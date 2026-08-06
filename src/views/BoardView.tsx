import { useMemo } from 'react'
import { memberColor, memberList } from '../store'
import { isSupportChar } from '../roles'
import {
  SUBPARTY_SIZE,
  chunk,
  normalizeParties,
  padPartySlots,
  partyStatus,
  placeCharacter,
} from '../validation'
import type { AppState } from '../store'
import type { Character, Party } from '../types'

interface Props {
  state: AppState
  raidId: string
  onSelectRaid: (raidId: string) => void
}

/**
 * 파티 규칙을 지키는 첫 번째 빈 자리에 캐릭터를 배치합니다.
 * - 인원 확정된 팟과, 같은 사람(본부계)의 캐릭터가 이미 있는 팟은 건너뜁니다.
 * - 4인 파티 단위로 서폿은 1명까지, 딜러는 3명까지만 넣습니다.
 * 맞는 자리가 없으면 새 팟을 만들어 배치합니다.
 */
function placeByRules(
  parties: Party[],
  char: Character,
  partySize: number,
  charByName: Map<string, Character>,
): Party[] {
  const next = parties.map((p) => ({ ...p, slots: [...p.slots] }))
  placeCharacter(next, char, partySize, charByName, { skipDone: true })
  return next
}

export default function BoardView({ state, raidId, onSelectRaid }: Props) {
  const { sections, update } = state
  const raids = sections.raids.filter((r) => r.active)

  const raid = raids.find((r) => r.id === raidId) ?? raids[0]
  const members = memberList(sections.characters)
  const colors = sections.memberColors
  const charByName = useMemo(
    () => new Map(sections.characters.map((c) => [c.name, c])),
    [sections.characters],
  )

  if (!raid) return <p className="hint">활성화된 레이드가 없습니다.</p>

  const parties: Party[] = normalizeParties(sections.assignments[raid.id]).map((p) =>
    padPartySlots(p, raid.partySize),
  )

  // 이 레이드에 체크된 캐릭터 목록. 이미 배치된 캐릭터는 표시만 바뀝니다.
  const assignedNames = new Set(
    parties.flatMap((p) => p.slots).filter(Boolean) as string[],
  )
  const candidates = sections.characters.filter((c) => sections.checks[c.name]?.[raid.id])
  const unassigned = candidates.filter((c) => !assignedNames.has(c.name))

  const setParties = (next: Party[]) => {
    update('assignments', (cur) => ({ ...cur, [raid.id]: next }))
  }

  const withoutChar = (src: Party[], name: string): Party[] =>
    src.map((p) => ({ ...p, slots: p.slots.map((n) => (n === name ? null : n)) }))

  /** 칩 클릭: 미배치면 규칙에 맞는 자리로 자동 배치, 이미 배치돼 있으면 해제 */
  const toggleAuto = (name: string) => {
    const char = charByName.get(name)
    if (!char) return
    if (assignedNames.has(name)) {
      setParties(withoutChar(parties, name))
      return
    }
    setParties(placeByRules(parties, char, raid.partySize, charByName))
  }

  /** 미편성 후보 전체를 순서대로 자동 배치 */
  const autoPlaceAll = () => {
    let next = parties.map((p) => ({ ...p, slots: [...p.slots] }))
    // 서폿부터 넣어야 각 파티에 서폿 자리가 고르게 잡힙니다.
    const ordered = [...unassigned].sort(
      (a, b) => Number(isSupportChar(b)) - Number(isSupportChar(a)),
    )
    for (const c of ordered) {
      next = placeByRules(next, c, raid.partySize, charByName)
    }
    setParties(next)
  }

  /**
   * 드래그로 특정 자리에 직접 배치합니다 (규칙 검사 없이 원하는 자리에 강제 배치).
   * 이미 배치된 캐릭터를 다른 캐릭터 위에 떨어뜨리면 두 캐릭터의 자리를 서로 바꿉니다.
   */
  const placeOrSwap = (partyIdx: number, slotIdx: number, name: string) => {
    const next = parties.map((p) => ({ ...p, slots: [...p.slots] }))
    let fromPi = -1
    let fromSi = -1
    for (let pi = 0; pi < next.length; pi++) {
      const si = next[pi].slots.indexOf(name)
      if (si >= 0) {
        fromPi = pi
        fromSi = si
        break
      }
    }
    const occupant = next[partyIdx].slots[slotIdx]
    if (occupant === name) return
    // 드래그한 캐릭터가 이미 보드에 있으면 원래 자리에 상대를 넣어 교환합니다.
    if (fromPi >= 0) next[fromPi].slots[fromSi] = occupant
    next[partyIdx].slots[slotIdx] = name
    setParties(next)
  }

  const clearSlot = (partyIdx: number, slotIdx: number) => {
    const next = parties.map((p) => ({ ...p, slots: [...p.slots] }))
    next[partyIdx].slots[slotIdx] = null
    setParties(next)
  }

  const addParty = () => {
    setParties([
      ...parties.map((p) => ({ ...p, slots: [...p.slots] })),
      { slots: Array(raid.partySize).fill(null) },
    ])
  }

  const removeParty = (idx: number) => {
    const target = parties[idx]
    if (target.slots.some(Boolean) && !confirm(`${idx + 1}팟에 편성된 캐릭터가 있습니다. 삭제할까요?`)) {
      return
    }
    setParties(parties.filter((_, i) => i !== idx))
  }

  /** 인원이 덜 차도 이 인원으로 가기로 확정/해제 */
  const toggleDone = (idx: number) => {
    setParties(parties.map((p, i) => (i === idx ? { ...p, done: !p.done } : p)))
  }

  /** 이번 주에 이 팟이 레이드를 돌았는지 표시/해제 */
  const toggleCleared = (idx: number) => {
    setParties(parties.map((p, i) => (i === idx ? { ...p, cleared: !p.cleared } : p)))
  }

  const changePartySize = (size: number) => {
    update('raids', (cur) => cur.map((r) => (r.id === raid.id ? { ...r, partySize: size } : r)))
    // 이미 만든 팟의 슬롯 수도 함께 맞춥니다. 줄어드는 경우 잘리는 캐릭터는 편성 해제됩니다.
    setParties(
      parties.map((p) => {
        const slots = [...p.slots]
        while (slots.length < size) slots.push(null)
        return { ...p, slots: slots.slice(0, size) }
      }),
    )
  }

  const renderSlot = (party: Party, pi: number, si: number) => {
    const name = party.slots[si]
    const c = name ? charByName.get(name) : undefined
    const color = c ? memberColor(c.member, members, colors) : undefined
    return (
      <div
        key={si}
        className={name ? 'slot filled' : 'slot'}
        draggable={!!name}
        onDragStart={(e) => {
          if (name) e.dataTransfer.setData('text/plain', name)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const dragged = e.dataTransfer.getData('text/plain')
          if (dragged) placeOrSwap(pi, si, dragged)
        }}
        style={color ? { background: `color-mix(in srgb, ${color} 16%, transparent)` } : undefined}
        title={name ? '드래그해서 자리를 옮기거나, 보드 밖에 놓으면 빠집니다' : '후보 캐릭터를 드래그해서 넣을 수 있습니다'}
      >
        {c ? (
          <>
            <span className="member-dot" style={{ background: color }} />
            <span className="slot-name">{c.name}</span>
            {isSupportChar(c) && <span className="role-badge">폿</span>}
            <span className="slot-class">{c.clazz}</span>
            <button
              className="slot-x"
              onClick={(e) => {
                e.stopPropagation()
                clearSlot(pi, si)
              }}
              title="편성에서 빼기"
            >
              ✕
            </button>
          </>
        ) : (
          <span className="slot-empty">빈 자리</span>
        )}
      </div>
    )
  }

  return (
    <div
      className="view board-view"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        // 슬롯 위 드롭은 슬롯에서 stopPropagation으로 막으므로,
        // 여기 닿았다는 것은 보드 밖(빈 공간)에 놓았다는 뜻 → 편성에서 뺀다.
        e.preventDefault()
        const dragged = e.dataTransfer.getData('text/plain')
        if (dragged && assignedNames.has(dragged)) {
          setParties(withoutChar(parties, dragged))
        }
      }}
    >
      <div className="raid-tabs">
        {raids.map((r) => (
          <button
            key={r.id}
            className={r.id === raid.id ? 'raid-tab active' : 'raid-tab'}
            onClick={() => onSelectRaid(r.id)}
            title={r.name}
          >
            {r.id}
          </button>
        ))}
      </div>

      <div className="board-toolbar">
        <span className="raid-name">{raid.name}</span>
        <label>
          팟 인원
          <select
            value={raid.partySize}
            onChange={(e) => changePartySize(Number(e.target.value))}
          >
            <option value={4}>4인</option>
            <option value={8}>8인</option>
            <option value={16}>16인</option>
          </select>
        </label>
        <button onClick={addParty}>+ 팟 추가</button>
        {unassigned.length > 0 && (
          <button onClick={autoPlaceAll} title="미편성 후보를 규칙에 맞게 순서대로 채웁니다">
            ⚡ 미편성 {unassigned.length}명 자동 배치
          </button>
        )}
      </div>

      <div className="candidates">
        <h4>후보 캐릭터 — 누르면 규칙에 맞는 자리로 자동 배치, 다시 누르면 해제. 원하는 자리에는 드래그로.</h4>
        <div className="chip-list">
          {candidates.length === 0 && (
            <span className="hint">레이드 체크 탭에서 이 레이드에 갈 캐릭터를 먼저 체크해 주세요.</span>
          )}
          {candidates.map((c) => (
            <button
              key={c.name}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', c.name)}
              className={
                'chip' +
                (assignedNames.has(c.name) ? ' assigned' : '') +
                (isSupportChar(c) ? ' support' : '')
              }
              style={{
                borderLeftColor: memberColor(c.member, members, colors),
                background: `color-mix(in srgb, ${memberColor(c.member, members, colors)} 14%, transparent)`,
              }}
              onClick={() => toggleAuto(c.name)}
              title={`${c.member} · ${c.clazz} · 전투력 ${c.combatPower?.toLocaleString('ko-KR') ?? '-'}`}
            >
              {c.name}
              {isSupportChar(c) && <span className="role-badge">폿</span>}
              {assignedNames.has(c.name) && <span className="badge">배치됨</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="party-grid">
        {parties.length === 0 && (
          <p className="hint">아직 팟이 없습니다. 후보 캐릭터를 누르면 팟이 자동으로 만들어집니다.</p>
        )}
        {parties.map((party, pi) => {
          const status = partyStatus(party, raid, charByName, sections.checks)
          const slotGroups = chunk(
            party.slots.map((_, si) => si),
            SUBPARTY_SIZE,
          )
          return (
            <div
              key={pi}
              className={`party-card status-${status.kind}${party.cleared ? ' cleared' : ''}`}
            >
              <div className="party-head">
                <strong>{pi + 1}팟</strong>
                <span className="party-status">{status.label}</span>
                <button
                  className={party.cleared ? 'done-btn cleared-btn active' : 'done-btn cleared-btn'}
                  onClick={() => toggleCleared(pi)}
                  title="이번 주에 이 팟이 레이드를 돌았으면 눌러 주세요"
                >
                  {party.cleared ? '🏁 클리어됨' : '클리어'}
                </button>
                <button
                  className={party.done ? 'done-btn active' : 'done-btn'}
                  onClick={() => toggleDone(pi)}
                  title="인원이 덜 차도 이 인원으로 가기로 확정합니다"
                >
                  {party.done ? '확정됨' : '확정'}
                </button>
                <button className="party-remove" onClick={() => removeParty(pi)} title="팟 삭제">
                  ✕
                </button>
              </div>
              <div className="slots">
                {slotGroups.map((group, gi) => (
                  <div key={gi} className="subparty">
                    {slotGroups.length > 1 && (
                      <div className="subparty-label">{gi + 1}파티</div>
                    )}
                    {group.map((si) => renderSlot(party, pi, si))}
                  </div>
                ))}
              </div>
              <div className="party-foot">
                딜러 {status.dealers} · 서폿 {status.supports} | 평균 전투력:{' '}
                {status.avg !== null
                  ? status.avg.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
                  : '-'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
