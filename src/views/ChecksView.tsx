import { useState } from 'react'
import { memberColor, memberList } from '../store'
import type { AppState } from '../store'

interface Props {
  state: AppState
}

export default function ChecksView({ state }: Props) {
  const { sections, update } = state
  const members = memberList(sections.characters)
  const colors = sections.memberColors
  const raids = sections.raids.filter((r) => r.active)
  const [selectedPreset, setSelectedPreset] = useState('')
  const presets = sections.checkPresets ?? []

  const savePreset = () => {
    const defaultName = new Date().toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const name = prompt('체크 프리셋 이름을 입력해 주세요.', defaultName)
    if (name === null) return
    const snapshot = JSON.parse(JSON.stringify(sections.checks))
    // 저장할 때마다 쌓아 두고, 오래된 것은 20개까지만 유지합니다.
    update('checkPresets', (cur) => {
      const next = [
        ...(cur ?? []),
        { name: name.trim() || defaultName, savedAt: new Date().toISOString(), checks: snapshot },
      ]
      return next.slice(-20)
    })
  }

  const loadPreset = () => {
    const preset = presets.find((p) => p.savedAt === selectedPreset)
    if (!preset) {
      alert('불러올 프리셋을 먼저 선택해 주세요.')
      return
    }
    if (!confirm(`체크 프리셋 '${preset.name}'을 불러올까요? 지금 체크 상태를 덮어씁니다.`)) return
    update('checks', () => JSON.parse(JSON.stringify(preset.checks)))
  }

  const deletePreset = () => {
    const preset = presets.find((p) => p.savedAt === selectedPreset)
    if (!preset) {
      alert('삭제할 프리셋을 먼저 선택해 주세요.')
      return
    }
    if (!confirm(`체크 프리셋 '${preset.name}'을 삭제할까요?`)) return
    update('checkPresets', (cur) => (cur ?? []).filter((p) => p.savedAt !== preset.savedAt))
    setSelectedPreset('')
  }

  const clearAll = () => {
    if (!confirm('모든 캐릭터의 레이드 체크를 해제할까요? 되돌리기로 복구할 수 있습니다.')) return
    update('checks', (cur) =>
      Object.fromEntries(Object.keys(cur).map((name) => [name, {}])),
    )
  }

  const toggle = (charName: string, raidId: string) => {
    update('checks', (cur) => ({
      ...cur,
      [charName]: { ...cur[charName], [raidId]: !cur[charName]?.[raidId] },
    }))
  }

  return (
    <div className="view">
      <p className="hint">캐릭터가 이번 주에 갈 레이드를 체크하면, 편성 보드의 후보 목록에 나타납니다.</p>

      <div className="roster-toolbar">
        <button onClick={savePreset}>프리셋 저장</button>
        <select
          value={selectedPreset}
          onChange={(e) => setSelectedPreset(e.target.value)}
          title="저장해 둔 체크 프리셋 목록"
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
        <span className="toolbar-divider" />
        <button onClick={clearAll}>전체 체크 해제</button>
      </div>
      {members.map((member) => {
        const chars = sections.characters.filter((c) => c.member === member)
        const color = memberColor(member, members, colors)
        return (
          <section key={member} className="member-section">
            <h3>
              <span className="member-dot" style={{ background: color }} />
              {member}
              <span className="member-count">{chars.length}캐릭</span>
            </h3>
            <div className="table-scroll checks-scroll">
              <table className="checks-table">
                <thead>
                  <tr>
                    <th>캐릭터</th>
                    <th className="num">아이템 레벨</th>
                    {raids.map((r) => (
                      <th key={r.id} title={r.name}>{r.id}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chars.map((c) => (
                    <tr key={c.name}>
                      <td className="char-name">
                        <span className="member-dot" style={{ background: color }} />
                        {c.name}
                      </td>
                      <td className="num">
                        {c.itemLevel?.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) ?? '-'}
                      </td>
                      {raids.map((r) => (
                        <td key={r.id} className="check-cell">
                          <input
                            type="checkbox"
                            checked={sections.checks[c.name]?.[r.id] ?? false}
                            onChange={() => toggle(c.name, r.id)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
