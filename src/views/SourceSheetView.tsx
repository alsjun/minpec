import { useEffect, useMemo, useState } from 'react'
import { SEED_ASSIGNMENTS } from '../seed'
import { memberColor, memberList } from '../store'
import { cloneAssignments, cloneParties, normalizeParties, padPartySlots } from '../validation'
import type { AppState } from '../store'
import type { Assignments } from '../types'

interface Props {
  state: AppState
}

export default function SourceSheetView({ state }: Props) {
  const { sections, update } = state
  const [draft, setDraft] = useState<Assignments>(() => cloneAssignments(sections.sourceAssignments))
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const members = memberList(sections.characters)
  const colors = sections.memberColors
  const charByName = useMemo(
    () => new Map(sections.characters.map((c) => [c.name, c])),
    [sections.characters],
  )

  useEffect(() => {
    setDraft(cloneAssignments(sections.sourceAssignments))
  }, [sections.sourceAssignments])

  const setRaidParties = (
    raidId: string,
    updater: (parties: ReturnType<typeof normalizeParties>) => ReturnType<typeof normalizeParties>,
  ) => {
    setDraft((cur) => ({
      ...cur,
      [raidId]: updater(cloneParties(normalizeParties(cur[raidId]))),
    }))
    setSavedMsg(null)
  }

  const raidPartySize = (raidId: string) =>
    sections.raids.find((raid) => raid.id === raidId)?.partySize ?? 4

  const changeCell = (raidId: string, partyIdx: number, slotIdx: number, value: string | null) => {
    setRaidParties(raidId, (parties) => {
      const party = parties[partyIdx]
      if (!party) return parties
      while (party.slots.length <= slotIdx) party.slots.push(null)
      party.slots[slotIdx] = value?.trim() || null
      return parties
    })
  }

  const addParty = (raidId: string) => {
    setRaidParties(raidId, (parties) => [
      ...parties,
      { slots: Array(raidPartySize(raidId)).fill(null), done: true },
    ])
  }

  const removeParty = (raidId: string, partyIdx: number) => {
    setRaidParties(raidId, (parties) => parties.filter((_, i) => i !== partyIdx))
  }

  const appendCharacter = (raidId: string, name: string) => {
    setRaidParties(raidId, (parties) => {
      if (parties.some((party) => party.slots.includes(name))) return parties
      const size = raidPartySize(raidId)
      const next = cloneParties(parties).map((p) => padPartySlots(p, size))
      if (next.length === 0) next.push({ slots: Array(size).fill(null), done: true })
      let target = next.find((party) => party.slots.some((slot) => slot === null))
      if (!target) {
        target = { slots: Array(size).fill(null), done: true }
        next.push(target)
      }
      const emptyIdx = target.slots.findIndex((slot) => slot === null)
      target.slots[emptyIdx] = name
      return next
    })
  }

  const removeCharacter = (raidId: string, name: string) => {
    setRaidParties(raidId, (parties) =>
      parties.map((party) => ({
        ...party,
        slots: party.slots.map((slot) => (slot === name ? null : slot)),
      })),
    )
  }

  const placeOrSwap = (raidId: string, partyIdx: number, slotIdx: number, name: string) => {
    setRaidParties(raidId, (parties) => {
      const size = raidPartySize(raidId)
      const next = cloneParties(parties).map((p) => padPartySlots(p, size))
      while (next.length <= partyIdx) next.push({ slots: Array(size).fill(null), done: true })

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
      if (occupant === name) return next
      if (fromPi >= 0) next[fromPi].slots[fromSi] = occupant
      next[partyIdx].slots[slotIdx] = name
      return next
    })
  }

  const resetToSeed = () => {
    if (!confirm('원본 시트 편집 내용을 기본값으로 되돌릴까요? 저장 버튼을 눌러야 확정됩니다.')) return
    setDraft(cloneAssignments(SEED_ASSIGNMENTS))
    setSavedMsg(null)
  }

  const loadCurrentBoard = () => {
    if (!confirm('현재 편성 보드 내용을 원본 시트 편집본으로 가져올까요? 저장 버튼을 눌러야 확정됩니다.')) return
    setDraft(cloneAssignments(sections.assignments))
    setSavedMsg(null)
  }

  const saveSourceSheet = () => {
    update('sourceAssignments', () => cloneAssignments(draft))
    setSavedMsg('원본 시트를 저장했습니다.')
    setTimeout(() => setSavedMsg(null), 2500)
  }

  return (
    <div className="view source-sheet">
      <div className="sheet-toolbar">
        <div>
          <h3>원본 레이드표</h3>
          <p className="hint">
            레이드별 후보를 원본 재료로 정리한 뒤 저장하면, 대시보드에서 이 원본 기준으로 다시 편성할 수 있습니다.
          </p>
        </div>
        <div className="sheet-toolbar-actions">
          {savedMsg && <span className="save-msg">{savedMsg}</span>}
          <button onClick={loadCurrentBoard}>현재 편성 가져오기</button>
          <button onClick={resetToSeed}>기본값 불러오기</button>
          <button className="primary-action" onClick={saveSourceSheet}>원본 시트 저장</button>
        </div>
      </div>

      <div className="source-grid">
        {sections.raids
          .filter((raid) => raid.active)
          .map((raid) => {
            const parties = normalizeParties(draft[raid.id]).map((p) => padPartySlots(p, raid.partySize))
            const maxRows = Math.max(raid.partySize, ...parties.map((p) => p.slots.length), 1)
            const sourceNames = new Set(parties.flatMap((party) => party.slots).filter(Boolean))
            const checkedCandidates = sections.characters.filter((c) => sections.checks[c.name]?.[raid.id])
            return (
              <section key={raid.id} className="source-raid">
                <div className="source-raid-title">{raid.id}</div>
                <div className="source-party-table">
                  {parties.length === 0 && (
                    <div className="source-empty">
                      <span>팟 없음</span>
                      <button onClick={() => addParty(raid.id)}>1팟 만들기</button>
                    </div>
                  )}
                  {parties.map((party, pi) => {
                    return (
                      <div key={pi} className="source-party">
                        <div className="source-party-head">
                          <strong>{pi + 1}팟</strong>
                          <button
                            className="mini-x"
                            onClick={() => removeParty(raid.id, pi)}
                            title="팟 삭제"
                          >
                            x
                          </button>
                        </div>
                        {Array.from({ length: maxRows }).map((_, si) => {
                          const name = party.slots[si] ?? ''
                          const char = name ? charByName.get(name) : undefined
                          const color = char ? memberColor(char.member, members, colors) : undefined
                          return (
                            <div
                              key={si}
                              className={char ? 'source-cell known' : name ? 'source-cell unknown' : 'source-cell'}
                              draggable={!!name}
                              onDragStart={(e) => {
                                if (name) e.dataTransfer.setData('text/plain', name)
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault()
                                const dragged = e.dataTransfer.getData('text/plain')
                                if (dragged) placeOrSwap(raid.id, pi, si, dragged)
                              }}
                              style={color ? { borderLeftColor: color } : undefined}
                            >
                              {name ? (
                                <>
                                  <span>{name}</span>
                                  <button
                                    onClick={() => changeCell(raid.id, pi, si, null)}
                                    title="원본 목록에서 빼기"
                                  >
                                    x
                                  </button>
                                </>
                              ) : (
                                <span className="source-blank">빈칸</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
                {parties.length > 0 && (
                  <div className="source-actions">
                    <button onClick={() => addParty(raid.id)}>팟 추가</button>
                  </div>
                )}
                <div className="source-candidates">
                  {checkedCandidates.map((c) => {
                    const color = memberColor(c.member, members, colors)
                    const selected = sourceNames.has(c.name)
                    return (
                      <button
                        key={c.name}
                        draggable
                        className={selected ? 'source-candidate selected' : 'source-candidate'}
                        style={{ borderLeftColor: color }}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', c.name)}
                        onClick={() =>
                          selected ? removeCharacter(raid.id, c.name) : appendCharacter(raid.id, c.name)
                        }
                      >
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
      </div>
    </div>
  )
}
