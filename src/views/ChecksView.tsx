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

  const toggle = (charName: string, raidId: string) => {
    update('checks', (cur) => ({
      ...cur,
      [charName]: { ...cur[charName], [raidId]: !cur[charName]?.[raidId] },
    }))
  }

  return (
    <div className="view">
      <p className="hint">캐릭터가 이번 주에 갈 레이드를 체크하면, 편성 보드의 후보 목록에 나타납니다.</p>
      <div className="table-scroll">
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
            {sections.characters.map((c) => (
              <tr key={c.name}>
                <td className="char-name">
                  <span className="member-dot" style={{ background: memberColor(c.member, members, colors) }} />
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
    </div>
  )
}
