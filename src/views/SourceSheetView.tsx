import { useEffect, useMemo, useState } from 'react'
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
  const [selectedPreset, setSelectedPreset] = useState('')
  const presets = sections.presets ?? []
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

  /** 마지막으로 저장했던 원본 시트(가장 최근 프리셋)를 편집본으로 불러옵니다. */
  const loadPrevious = () => {
    if (presets.length === 0) {
      alert('저장된 이전 값이 없습니다. 원본 시트를 저장하면 프리셋으로 쌓입니다.')
      return
    }
    const last = presets[presets.length - 1]
    if (!confirm(`마지막 저장본 '${last.name}'을 불러올까요? 저장 버튼을 눌러야 확정됩니다.`)) return
    setDraft(cloneAssignments(last.assignments))
    setSavedMsg(null)
  }

  const loadPreset = () => {
    const preset = presets.find((p) => p.savedAt === selectedPreset)
    if (!preset) {
      alert('불러올 프리셋을 먼저 선택해 주세요.')
      return
    }
    if (!confirm(`프리셋 '${preset.name}'을 불러올까요? 저장 버튼을 눌러야 확정됩니다.`)) return
    setDraft(cloneAssignments(preset.assignments))
    setSavedMsg(null)
  }

  const deletePreset = () => {
    const preset = presets.find((p) => p.savedAt === selectedPreset)
    if (!preset) {
      alert('삭제할 프리셋을 먼저 선택해 주세요.')
      return
    }
    if (!confirm(`프리셋 '${preset.name}'을 삭제할까요?`)) return
    update('presets', (cur) => (cur ?? []).filter((p) => p.savedAt !== preset.savedAt))
    setSelectedPreset('')
  }

  const loadCurrentBoard = () => {
    if (!confirm('현재 편성 보드 내용을 원본 시트 편집본으로 가져올까요? 저장 버튼을 눌러야 확정됩니다.')) return
    setDraft(cloneAssignments(sections.assignments))
    setSavedMsg(null)
  }

  const saveSourceSheet = () => {
    const defaultName = new Date().toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const name = prompt('프리셋 이름을 입력해 주세요.', defaultName)
    if (name === null) return
    const snapshot = cloneAssignments(draft)
    update('sourceAssignments', () => snapshot)
    // 저장할 때마다 프리셋으로 쌓아 두고, 오래된 것은 20개까지만 유지합니다.
    update('presets', (cur) => {
      const next = [
        ...(cur ?? []),
        { name: name.trim() || defaultName, savedAt: new Date().toISOString(), assignments: snapshot },
      ]
      return next.slice(-20)
    })
    setSavedMsg('원본 시트를 저장하고 프리셋으로 남겼습니다.')
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
          <button onClick={loadPrevious}>이전 값 불러오기</button>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            title="저장해 둔 프리셋 목록"
          >
            <option value="">프리셋 선택...</option>
            {[...presets].reverse().map((p) => (
              <option key={p.savedAt} value={p.savedAt}>
                {p.name}
              </option>
            ))}
          </select>
          <button onClick={loadPreset}>불러오기</button>
          <button onClick={deletePreset}>삭제</button>
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
