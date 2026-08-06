import { isSupportChar } from './roles'
import type { Assignments, Character, Checks, Party, Raid } from './types'

/** 저장된 팟 데이터를 현재 구조로 맞춥니다. 예전에는 슬롯 배열만 저장했습니다. */
export function normalizeParties(raw: unknown): Party[] {
  if (!Array.isArray(raw)) return []
  return raw.map((p) => (Array.isArray(p) ? { slots: p as (string | null)[] } : (p as Party)))
}

export function cloneParties(parties: Party[]): Party[] {
  return parties.map((p) => ({ ...p, slots: [...p.slots] }))
}

export function cloneAssignments(assignments: Assignments): Assignments {
  return Object.fromEntries(
    Object.entries(assignments).map(([raidId, parties]) => [
      raidId,
      cloneParties(normalizeParties(parties)),
    ]),
  ) as Assignments
}

function normalizeSlots(slots: (string | null)[], partySize: number): (string | null)[] {
  const next = slots.slice(0, partySize)
  while (next.length < partySize) next.push(null)
  return next
}

export function padPartySlots(party: Party, partySize: number): Party {
  const slots = [...party.slots]
  while (slots.length < partySize) slots.push(null)
  return { ...party, slots }
}

/**
 * 원본 시트는 실제 파티와 단순 줄 세우기가 섞여 있으므로, 불러올 때는 캐릭터 순서만 재료로 쓰고
 * 4인 기준 서폿 1명 + 딜러 3명 규칙에 맞춰 다시 배치합니다.
 */
export function arrangePartiesByRules(
  rawParties: Party[],
  raid: Raid,
  charByName: Map<string, Character>,
): Party[] {
  const names: string[] = []
  for (const party of rawParties) {
    for (const name of party.slots) {
      if (name && charByName.has(name) && !names.includes(name)) names.push(name)
    }
  }

  const chars = names
    .map((name) => charByName.get(name))
    .filter((c): c is Character => !!c)
    .sort((a, b) => {
      const roleDiff = Number(isSupportChar(b)) - Number(isSupportChar(a))
      if (roleDiff !== 0) return roleDiff
      return (b.combatPower ?? 0) - (a.combatPower ?? 0)
    })

  const arranged: Party[] = []
  for (const char of chars) {
    placeCharacter(arranged, char, raid.partySize, charByName)
  }
  return arranged.map((p) => ({ ...p, slots: normalizeSlots(p.slots, raid.partySize), done: true }))
}

export function arrangeAssignmentsByRules(
  sourceAssignments: Assignments,
  raids: Raid[],
  characters: Character[],
): Assignments {
  const charByName = new Map(characters.map((c) => [c.name, c]))
  return Object.fromEntries(
    raids.map((raid) => [
      raid.id,
      arrangePartiesByRules(normalizeParties(sourceAssignments[raid.id]), raid, charByName),
    ]),
  ) as Assignments
}

export function placeCharacter(
  parties: Party[],
  char: Character,
  partySize: number,
  charByName: Map<string, Character>,
  options: { skipDone?: boolean } = {},
): void {
  const support = isSupportChar(char)
  for (const pot of parties) {
    if (options.skipDone && pot.done) continue
    const potChars = pot.slots
      .filter((n): n is string => n !== null)
      .map((n) => charByName.get(n))
      .filter((c): c is Character => !!c)
    if (potChars.some((c) => c.member === char.member)) continue

    for (let g = 0; g < pot.slots.length; g += SUBPARTY_SIZE) {
      const sub = pot.slots.slice(g, g + SUBPARTY_SIZE)
      const subChars = sub
        .filter((n): n is string => n !== null)
        .map((n) => charByName.get(n))
        .filter((c): c is Character => !!c)
      const supports = subChars.filter(isSupportChar).length
      const dealers = subChars.length - supports
      const emptyIdx = sub.findIndex((s) => s === null)
      if (emptyIdx < 0) continue
      if (support ? supports >= 1 : dealers >= SUBPARTY_SIZE - 1) continue
      pot.slots[g + emptyIdx] = char.name
      return
    }
  }

  const fresh: (string | null)[] = Array(partySize).fill(null)
  fresh[0] = char.name
  parties.push({ slots: fresh })
}

/** 로아 편성 규칙상 파티는 4인 단위입니다. 8인 팟은 4+4 두 파티로 나뉩니다. */
export const SUBPARTY_SIZE = 4

export interface PartyStatus {
  kind: 'ok' | 'filling' | 'error' | 'warn'
  label: string
  avg: number | null
  dealers: number
  supports: number
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/**
 * 팟 하나의 상태를 판정합니다. 시트의 조건부 서식이 하던 검증을 그대로 옮긴 것입니다.
 * - 같은 사람의 캐릭터가 한 팟에 둘 이상이면 함께 뛸 수 없으므로 '사람 중복'
 * - 4인 파티마다 서폿 1명이 기본 구성이라, 서폿이 겹치거나(2명 이상)
 *   파티가 꽉 찼는데 서폿이 없으면 경고를 띄웁니다.
 * - 레이드 체크가 안 된 캐릭터가 끼어 있으면 경고
 * - 인원이 덜 찼으면 '편성 중', 다 찼으면 '정상'
 */
export function partyStatus(
  potParty: Party,
  raid: Raid,
  charByName: Map<string, Character>,
  checks: Checks,
): PartyStatus {
  const party = potParty.slots
  const filled = party.filter((n): n is string => n !== null)
  const chars = filled.map((n) => charByName.get(n)).filter((c): c is Character => !!c)

  const powers = chars.map((c) => c.combatPower).filter((p): p is number => p !== null)
  const avg = powers.length > 0 ? powers.reduce((a, b) => a + b, 0) / powers.length : null
  const supports = chars.filter(isSupportChar).length
  const base = { avg, dealers: chars.length - supports, supports }

  const memberSet = new Set(chars.map((c) => c.member))
  if (memberSet.size < chars.length) {
    return { kind: 'error', label: '❌ 사람 중복', ...base }
  }

  const unchecked = filled.filter((n) => !checks[n]?.[raid.id])
  if (unchecked.length > 0) {
    return { kind: 'warn', label: `⚠️ 체크 안 됨: ${unchecked.join(', ')}`, ...base }
  }

  // 4인 파티 단위로 서폿 구성을 확인합니다.
  for (const [i, sub] of chunk(party, SUBPARTY_SIZE).entries()) {
    const subChars = sub
      .filter((n): n is string => n !== null)
      .map((n) => charByName.get(n))
      .filter((c): c is Character => !!c)
    const subSupports = subChars.filter(isSupportChar).length
    const label = party.length > SUBPARTY_SIZE ? `${i + 1}파티 ` : ''
    if (subChars.length === SUBPARTY_SIZE && subSupports === 0) {
      return { kind: 'warn', label: `⚠️ ${label}서폿 없음`, ...base }
    }
    if (subSupports > 1) {
      return { kind: 'warn', label: `⚠️ ${label}서폿 중복`, ...base }
    }
  }

  if (filled.length < raid.partySize) {
    if (potParty.done) {
      return {
        kind: 'ok',
        label: `✅ 인원 확정 (${filled.length}/${raid.partySize})`,
        ...base,
      }
    }
    return {
      kind: 'filling',
      label: `🕓 편성 중 (${filled.length}/${raid.partySize})`,
      ...base,
    }
  }
  return { kind: 'ok', label: '✅ 편성 완료', ...base }
}
