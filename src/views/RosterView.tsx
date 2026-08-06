import { memberColor, memberList } from '../store'
import { charRole } from '../roles'
import type { AppState } from '../store'
import type { GemEfficiencyEffect } from '../types'

interface Props {
  state: AppState
}

const fmt = (n: number | null) =>
  n === null || n === undefined ? '-' : n.toLocaleString('ko-KR', { maximumFractionDigits: 2 })

const fmtPercent = (n: number | null) => (n === null || n === undefined ? '-' : `${fmt(n)}%`)

const gemEfficiencyTitle = (effects: GemEfficiencyEffect[] = []) => {
  if (effects.length === 0) return '로펙 젬 효율 정보가 없습니다'
  return effects
    .map((effect) => `${effect.name} Lv.${effect.level} ${fmtPercent(effect.effect)}`)
    .join('\n')
}

const lopecUrl = (name: string) =>
  `https://lopec.kr/character/specPoint/${encodeURIComponent(name)}`

const refreshWorkflowUrl = import.meta.env.VITE_REFRESH_WORKFLOW_URL as string | undefined

export default function RosterView({ state }: Props) {
  const { sections, update } = state
  const members = memberList(sections.characters)
  const colors = sections.memberColors
  const lastUpdated = sections.characters
    .map((c) => c.updatedAt)
    .filter(Boolean)
    .sort()
    .pop()

  const toggleRole = (name: string) => {
    update('characters', (cur) =>
      cur.map((c) =>
        c.name === name
          ? { ...c, role: charRole(c) === 'support' ? ('dealer' as const) : ('support' as const) }
          : c,
      ),
    )
  }

  const changeMemberColor = (member: string, color: string) => {
    update('memberColors', (cur) => ({ ...cur, [member]: color }))
  }

  const resetMemberColor = (member: string) => {
    update('memberColors', (cur) => {
      const next = { ...cur }
      delete next[member]
      return next
    })
  }

  return (
    <div className="view">
      <p className="hint">
        전투력과 아이템 레벨은 로스트아크 API에서 매일 새벽 자동으로 갱신됩니다.
        {lastUpdated
          ? ` 마지막 갱신: ${new Date(lastUpdated).toLocaleString('ko-KR')}`
          : ' 아직 자동 갱신 전이라 시트에서 가져온 값이 표시됩니다.'}
        <br />
        역할은 직업 기준으로 추정한 값이라, 발키리 딜러처럼 다른 경우 역할 버튼을 눌러 바꿔 주세요.
        편성 보드의 서폿 검증에 바로 반영됩니다.
        {refreshWorkflowUrl ? (
          <>
            <br />
            <a className="hint-action" href={refreshWorkflowUrl} target="_blank" rel="noreferrer">
              GitHub Actions에서 수동 갱신
            </a>
          </>
        ) : null}
      </p>

      <section className="member-color-panel">
        <h3>멤버 색상</h3>
        <div className="member-color-grid">
          {members.map((member) => {
            const color = memberColor(member, members, colors)
            return (
              <label key={member} className="member-color-row">
                <span className="member-dot" style={{ background: color }} />
                <span className="member-color-name">{member}</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => changeMemberColor(member, e.target.value)}
                  title={`${member} 색상 변경`}
                />
                <button type="button" onClick={() => resetMemberColor(member)}>
                  기본
                </button>
              </label>
            )
          })}
        </div>
      </section>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>본부계</th>
              <th>캐릭터</th>
              <th>조회</th>
              <th>직업</th>
              <th>역할</th>
              <th>아이템 레벨</th>
              <th>전투력</th>
              <th>로펙 현재</th>
              <th>로펙 최고</th>
              <th>젬 효율</th>
            </tr>
          </thead>
          <tbody>
            {sections.characters.map((c) => {
              const role = charRole(c)
              return (
                <tr key={c.name}>
                  <td>
                    <span
                      className="member-dot"
                      style={{ background: memberColor(c.member, members, colors) }}
                    />
                    {c.member}
                  </td>
                  <td className="char-name">{c.name}</td>
                  <td>
                    <a
                      className="lopec-link"
                      href={lopecUrl(c.name)}
                      target="_blank"
                      rel="noreferrer"
                      title={`${c.name} 로펙 페이지 열기`}
                    >
                      로펙
                    </a>
                  </td>
                  <td>{c.clazz}</td>
                  <td>
                    <button
                      className={role === 'support' ? 'role-toggle support' : 'role-toggle'}
                      onClick={() => toggleRole(c.name)}
                      title="누르면 딜러/서폿이 바뀝니다"
                    >
                      {role === 'support' ? '서폿' : '딜러'}
                    </button>
                  </td>
                  <td className="num">{fmt(c.itemLevel)}</td>
                  <td className="num">{fmt(c.combatPower)}</td>
                  <td className="num" title={c.lopecError ?? undefined}>
                    {fmt(c.lopec?.currentScore ?? null)}
                  </td>
                  <td className="num">{fmt(c.lopec?.bestScore ?? null)}</td>
                  <td
                    className="num"
                    title={gemEfficiencyTitle(c.gemEfficiency?.effects ?? [])}
                  >
                    {fmtPercent(c.gemEfficiency?.total ?? null)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
