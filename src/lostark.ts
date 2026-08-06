// 브라우저에서 로스트아크 공식 API를 직접 호출하는 클라이언트.
// 공개 저장소라 API 키를 코드에 넣지 않고, 최초 1회 입력받아 브라우저에만 저장합니다.
const API_BASE = 'https://developer-lostark.game.onstove.com'
const KEY_STORAGE = 'loa-party:lostark-api-key'

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE)
  } catch {
    return null
  }
}

export function saveApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key.trim())
}

/** 저장된 키가 없으면 입력을 받아 저장한 뒤 돌려줍니다. 취소하면 null. */
export function ensureApiKey(): string | null {
  const existing = getApiKey()
  if (existing) return existing
  const entered = prompt(
    '로스트아크 API 키를 입력해 주세요.\n(developer-lostark.game.onstove.com에서 발급, 이 브라우저에만 저장됩니다)',
  )
  if (!entered?.trim()) return null
  saveApiKey(entered)
  return entered.trim()
}

export function clearApiKey(): void {
  localStorage.removeItem(KEY_STORAGE)
}

export interface LostarkProfile {
  clazz: string
  itemLevel: number | null
  combatPower: number | null
}

const parseNumber = (raw: unknown): number | null => {
  if (typeof raw !== 'string' || raw === '') return null
  const n = Number(raw.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

/**
 * 캐릭터 프로필을 조회합니다.
 * 존재하지 않는 캐릭터는 null, 키가 틀리면 'invalid-key'를 돌려줍니다.
 */
export async function fetchProfile(
  name: string,
  apiKey: string,
): Promise<LostarkProfile | null | 'invalid-key'> {
  const res = await fetch(
    `${API_BASE}/armories/characters/${encodeURIComponent(name)}/profiles`,
    { headers: { accept: 'application/json', authorization: `bearer ${apiKey}` } },
  )
  if (res.status === 401 || res.status === 403) return 'invalid-key'
  if (!res.ok) return null
  const data = await res.json()
  if (!data || typeof data !== 'object') return null
  return {
    clazz: (data.CharacterClassName as string) ?? '',
    itemLevel: parseNumber(data.ItemAvgLevel),
    combatPower: parseNumber(data.CombatPower),
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
