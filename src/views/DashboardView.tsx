import { useMemo } from 'react'
import { memberColor, memberList } from '../store'
import { isSupportChar } from '../roles'
import {
  SUBPARTY_SIZE,
  chunk,
  normalizeParties,
  padPartySlots,
  partyStatus,
} from '../validation'
import { RAID_ID_GOLD } from '../seed'
import type { AppState } from '../store'
import type { Party } from '../types'
import type { PartyStatus } from '../validation'

interface Props {
  state: AppState
  onOpenBoard: (raidId: string) => void
}

interface RaidRow {
  id: string
  name: string
  parties: Party[]
  statuses: PartyStatus[]
  unassigned: string[]
  issues: string[]
}

export default function DashboardView({ state, onOpenBoard }: Props) {
  const { sections, update } = state
  const members = memberList(sections.characters)
  const colors = sections.memberColors
  const charByName = useMemo(
    () => new Map(sections.characters.map((c) => [c.name, c])),
    [sections.characters],
  )

  const raidRows: RaidRow[] = sections.raids
    .filter((r) => r.active)
    .map((raid) => {
      const parties = normalizeParties(sections.assignments[raid.id]).map((p) =>
        padPartySlots(p, raid.partySize),
      )
      const statuses = parties.map((p) => partyStatus(p, raid, charByName, sections.checks))
      const assigned = new Set(parties.flatMap((p) => p.slots).filter(Boolean) as string[])
      const checked = sections.characters.filter((c) => sections.checks[c.name]?.[raid.id])
      const unassigned = checked.filter((c) => !assigned.has(c.name)).map((c) => c.name)
      const issues = statuses
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.kind === 'error' || s.kind === 'warn')
        .map(({ s, i }) => `${i + 1}팟 ${s.label.replace(/^[❌⚠️]+\s*/, '')}`)
      return { id: raid.id, name: raid.name, parties, statuses, unassigned, issues }
    })

  const problemRaids = raidRows.filter((r) => r.issues.length > 0)

  // 멤버별 요약: 캐릭터 수, 체크 수, 편성 수, 예상 골드(단순 합산)
  const memberRows = members.map((m) => {
    const chars = sections.characters.filter((c) => c.member === m)
    let checkedCount = 0
    let gold = 0
    for (const c of chars) {
      for (const [raidId, on] of Object.entries(sections.checks[c.name] ?? {})) {
        if (!on) continue
        checkedCount += 1
        gold += RAID_ID_GOLD[raidId] ?? 0
      }
    }
    const assignedCount = Object.values(sections.assignments)
      .flatMap((ps) => normalizeParties(ps))
      .flatMap((p) => p.slots)
      .filter((n) => n && chars.some((c) => c.name === n)).length
    return { member: m, charCount: chars.length, checkedCount, assignedCount, gold }
  })
  const totalGold = memberRows.reduce((a, r) => a + r.gold, 0)

  // 새 주가 시작될 때 모든 팟의 클리어 표시를 한 번에 풉니다.
  const resetCleared = () => {
    if (!confirm('모든 팟의 클리어 표시를 해제할까요? 보통 수요일 리셋 후에 누릅니다.')) return
    update('assignments', (cur) =>
      Object.fromEntries(
        Object.entries(cur).map(([raidId, parties]) => [
          raidId,
          normalizeParties(parties).map((p) => ({ ...p, cleared: false })),
        ]),
      ),
    )
  }

  // 원본 시트의 팟 구성을 재배치 없이 그대로 편성 보드로 가져옵니다.
  const resetFromSourceSheet = () => {
    if (!confirm('편성 보드를 원본 시트 편성 그대로 덮어쓸까요?')) return
    update('assignments', () =>
      Object.fromEntries(
        sections.raids.map((raid) => [
          raid.id,
          normalizeParties(sections.sourceAssignments[raid.id]).map((p) => ({
            ...padPartySlots(p, raid.partySize),
            done: true,
          })),
        ]),
      ),
    )
  }

  const renderPotCol = (row: RaidRow, pi: number) => {
    const party = row.parties[pi]
    const status = row.statuses[pi]
    return (
      <div
        key={pi}
        className={`pot-col status-${status.kind}${party.cleared ? ' cleared' : ''}`}
        onClick={() => onOpenBoard(row.id)}
        role="button"
        title={`${pi + 1}팟 — 누르면 편성 보드로 이동`}
      >
        <div className="pot-col-head">{pi + 1}팟</div>
        <div className="pot-col-names">
          {chunk(party.slots, SUBPARTY_SIZE).map((sub, gi) => (
            <div key={gi} className="pot-col-sub">
              {sub
                .filter((n): n is string => n !== null)
                .map((n) => {
                  const c = charByName.get(n)
                  const color = memberColor(c?.member ?? '', members, colors)
                  return (
                    <div
                      key={n}
                      className="name-cell"
                      style={{
                        background: `color-mix(in srgb, ${color} 20%, transparent)`,
                        borderLeftColor: color,
                      }}
                    >
                      {n}
                      {c && isSupportChar(c) && <span className="role-badge">폿</span>}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
        <div className="pot-col-status">{status.label}</div>
        <div className="pot-col-avg">
          평균: {status.avg !== null
            ? status.avg.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
            : '-'}
        </div>
        {party.done && <div className="pot-col-done">인원 확정</div>}
      </div>
    )
  }

  return (
    <div className="view dashboard">
      {problemRaids.length > 0 && (
        <div className="dash-problems">
          <h3>⚠️ 지금 확인이 필요한 편성</h3>
          <ul>
            {problemRaids.map((r) =>
              r.issues.map((issue, i) => (
                <li key={`${r.id}-${i}`}>
                  <button className="link" onClick={() => onOpenBoard(r.id)}>
                    [{r.id}] {issue}
                  </button>
                </li>
              )),
            )}
          </ul>
        </div>
      )}

      <div className="dash-section-head">
        <h3>전체 편성표</h3>
        <button onClick={resetFromSourceSheet}>원본 시트 그대로 불러오기</button>
        <button onClick={resetCleared}>🏁 주간 클리어 초기화</button>
      </div>
      <div className="raid-blocks">
        {raidRows.map((row) => (
          <div key={row.id} className="raid-block">
            <button className="raid-block-title" onClick={() => onOpenBoard(row.id)} title={row.name}>
              {row.id}
              {row.parties.some((p) => p.cleared) && (
                <span className="clear-progress">
                  {row.parties.filter((p) => p.cleared).length}/{row.parties.length}팟 클리어
                </span>
              )}
            </button>
            <div className="raid-block-pots">
              {row.parties.length === 0 && <span className="hint">팟 없음</span>}
              {row.parties.map((_, pi) => renderPotCol(row, pi))}
              {row.unassigned.length > 0 && (
                <div className="pot-col unassigned-col" title="아직 팟에 배치되지 않은 캐릭터">
                  <div className="pot-col-head">미편성</div>
                  <div className="pot-col-names">
                    {row.unassigned.map((n) => {
                      const c = charByName.get(n)
                      const color = memberColor(c?.member ?? '', members, colors)
                      return (
                        <div key={n} className="name-cell dim" style={{ borderLeftColor: color }}>
                          {n}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="hint">팟 열을 누르면 해당 레이드 편성 보드로 이동합니다. 열 안의 가로 구분선은 4인 파티 단위입니다.</p>

      <h3>멤버별 요약</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>멤버</th>
              <th className="num">캐릭터</th>
              <th className="num">레이드 체크</th>
              <th className="num">편성됨</th>
              <th className="num">예상 골드</th>
            </tr>
          </thead>
          <tbody>
            {memberRows.map((r) => (
              <tr key={r.member}>
                <td>
                  <span className="member-dot" style={{ background: memberColor(r.member, members, colors) }} />
                  {r.member}
                </td>
                <td className="num">{r.charCount}</td>
                <td className="num">{r.checkedCount}</td>
                <td className="num">{r.assignedCount}</td>
                <td className="num gold">{r.gold.toLocaleString('ko-KR')}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4}>합계</td>
              <td className="num gold">{totalGold.toLocaleString('ko-KR')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="hint">
        예상 골드는 체크된 레이드의 총액(골드표 기준)을 단순 합산한 값입니다. 계정당 골드 획득
        캐릭터 수 제한은 반영하지 않았습니다.
      </p>
    </div>
  )
}
