import { useState } from 'react'
import { memberColor, memberList } from '../store'
import { charRole } from '../roles'
import { normalizeParties } from '../validation'
import { ensureApiKey, clearApiKey, getApiKey, fetchProfile, sleep } from '../lostark'
import type { AppState } from '../store'
import type { Assignments, Character, GemEfficiencyEffect } from '../types'

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

// 로펙은 브라우저에서 직접 읽을 수 없어(CORS 차단) GitHub Actions로 갱신합니다.
const LOPEC_WORKFLOW_URL = 'https://github.com/alsjun/minpec/actions/workflows/lopec.yml'

export default function RosterView({ state }: Props) {
  const { sections, update } = state
  const members = memberList(sections.characters)
  const colors = sections.memberColors

  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [progress, setProgress] = useState<string | null>(null)
  const [newMember, setNewMember] = useState('')
  const [newName, setNewName] = useState('')

  const sharedKey = sections.settings?.lostarkApiKey?.trim() || null

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

  /** 편성표(원본 포함)의 슬롯에 있는 이름을 치환합니다. 삭제 시에는 newName에 null을 넣습니다. */
  const mapAssignments = (a: Assignments, oldName: string, newName: string | null): Assignments =>
    Object.fromEntries(
      Object.entries(a).map(([raidId, parties]) => [
        raidId,
        normalizeParties(parties).map((p) => ({
          ...p,
          slots: p.slots.map((s) => (s === oldName ? newName : s)),
        })),
      ]),
    )

  const renameChar = (oldName: string) => {
    const name = editValue.trim()
    setEditing(null)
    if (!name || name === oldName) return
    if (sections.characters.some((c) => c.name === name)) {
      alert(`'${name}'은(는) 이미 있는 캐릭터 이름입니다.`)
      return
    }
    // 체크와 편성표가 캐릭터 이름을 키로 쓰므로 세 곳을 함께 바꿔야 합니다.
    update('characters', (cur) => cur.map((c) => (c.name === oldName ? { ...c, name } : c)))
    update('checks', (cur) => {
      const next = { ...cur }
      if (next[oldName]) {
        next[name] = next[oldName]
        delete next[oldName]
      }
      return next
    })
    update('assignments', (cur) => mapAssignments(cur, oldName, name))
    update('sourceAssignments', (cur) => mapAssignments(cur, oldName, name))
  }

  const removeChar = (name: string) => {
    if (!confirm(`'${name}' 캐릭터를 삭제할까요? 체크와 편성에서도 함께 빠집니다.`)) return
    update('characters', (cur) => cur.filter((c) => c.name !== name))
    update('checks', (cur) => {
      const next = { ...cur }
      delete next[name]
      return next
    })
    update('assignments', (cur) => mapAssignments(cur, name, null))
    update('sourceAssignments', (cur) => mapAssignments(cur, name, null))
  }

  const addChar = async () => {
    const member = newMember.trim()
    const name = newName.trim()
    if (!member || !name) {
      alert('본부계(사람)와 캐릭터 이름을 모두 입력해 주세요.')
      return
    }
    if (sections.characters.some((c) => c.name === name)) {
      alert(`'${name}'은(는) 이미 등록된 캐릭터입니다.`)
      return
    }

    // API 키가 있으면 직업/템렙/전투력을 바로 채워서 추가합니다.
    let clazz = ''
    let itemLevel: number | null = null
    let combatPower: number | null = null
    const key = sharedKey ?? getApiKey()
    if (key) {
      setProgress(`${name} 조회 중...`)
      const profile = await fetchProfile(name, key).catch(() => null)
      setProgress(null)
      if (profile === 'invalid-key') {
        alert('API 키가 유효하지 않습니다. 전체 조회 버튼에서 키를 다시 등록해 주세요.')
      } else if (profile === null) {
        if (!confirm(`'${name}' 캐릭터를 로아 API에서 찾지 못했습니다. 그래도 추가할까요?`)) return
      } else {
        clazz = profile.clazz
        itemLevel = profile.itemLevel
        combatPower = profile.combatPower
      }
    }

    update('characters', (cur) => [
      ...cur,
      { code: '', member, name, account: member, clazz, combatPower, itemLevel },
    ])
    update('checks', (cur) => ({ ...cur, [name]: {} }))
    setNewName('')
  }

  /** 전체 캐릭터의 템렙·전투력을 로아 API에서 순서대로 새로 받아옵니다. */
  const refreshAll = async () => {
    const key = sharedKey ?? ensureApiKey()
    if (!key) return

    const names = sections.characters.map((c) => c.name)
    const results = new Map<string, { clazz: string; itemLevel: number | null; combatPower: number | null }>()
    const failedNames: string[] = []

    for (let i = 0; i < names.length; i++) {
      setProgress(`조회 중... ${i + 1}/${names.length} (${names[i]})`)
      try {
        const profile = await fetchProfile(names[i], key)
        if (profile === 'invalid-key') {
          setProgress(null)
          if (sharedKey) {
            alert('팀 공유 API 키가 유효하지 않습니다. API 키 변경 버튼으로 새 키를 등록해 주세요.')
          } else {
            clearApiKey()
            alert('API 키가 유효하지 않아 중단했습니다. 버튼을 다시 눌러 키를 새로 입력해 주세요.')
          }
          return
        }
        if (profile) results.set(names[i], profile)
        else failedNames.push(names[i])
      } catch {
        failedNames.push(names[i])
      }
      // 로아 API는 분당 100회 제한이 있어 사이사이 짧게 쉽니다.
      await sleep(150)
    }

    const now = new Date().toISOString()
    update('characters', (cur) =>
      cur.map((c) => {
        const r = results.get(c.name)
        if (!r) return c
        return {
          ...c,
          clazz: r.clazz || c.clazz,
          itemLevel: r.itemLevel ?? c.itemLevel,
          combatPower: r.combatPower ?? c.combatPower,
          updatedAt: now,
        }
      }),
    )
    setProgress(null)
    alert(
      `조회 완료: ${results.size}명 갱신` +
        (failedNames.length > 0
          ? `\n\n실패 ${failedNames.length}명 (개명·삭제 확인 필요):\n${failedNames.join(', ')}`
          : ''),
    )
  }

  const renderRow = (c: Character) => {
    const role = charRole(c)
    return (
      <tr key={c.name}>
        <td className="char-name">
          {editing === c.name ? (
            <input
              className="name-edit"
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') renameChar(c.name)
                if (e.key === 'Escape') setEditing(null)
              }}
              onBlur={() => renameChar(c.name)}
            />
          ) : (
            <button
              className="name-btn"
              onClick={() => {
                setEditing(c.name)
                setEditValue(c.name)
              }}
              title="누르면 이름을 수정합니다"
            >
              {c.name} ✎
            </button>
          )}
        </td>
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
        <td>{c.clazz || '-'}</td>
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
        <td className="num" title={gemEfficiencyTitle(c.gemEfficiency?.effects ?? [])}>
          {fmtPercent(c.gemEfficiency?.total ?? null)}
        </td>
        <td className="center">
          <button className="slot-x" onClick={() => removeChar(c.name)} title="캐릭터 삭제">
            ✕
          </button>
        </td>
      </tr>
    )
  }

  return (
    <div className="view">
      <p className="hint">
        전투력과 아이템 레벨은 매일 새벽 자동 갱신되고, 아래 전체 조회 버튼으로 지금 바로 새로
        받아올 수도 있습니다.
        {lastUpdated ? ` 마지막 갱신: ${new Date(lastUpdated).toLocaleString('ko-KR')}` : ''}
      </p>

      <div className="roster-toolbar">
        <button className="primary-btn" onClick={refreshAll} disabled={progress !== null}>
          {progress ?? '⟳ 전체 조회 (로아 API)'}
        </button>
        <button
          onClick={() => {
            const entered = prompt(
              sharedKey
                ? '새 로아 API 키를 입력해 주세요. 팀원 모두에게 적용됩니다.'
                : '팀에서 함께 쓸 로아 API 키를 입력해 주세요. 한 번만 등록하면 됩니다.',
            )
            if (!entered?.trim()) return
            update('settings', (cur) => ({ ...cur, lostarkApiKey: entered.trim() }))
          }}
          title="팀원 모두가 같이 쓰는 로아 API 키를 등록합니다"
        >
          {sharedKey ? 'API 키 변경' : 'API 키 등록 (팀 공유)'}
        </button>
        <button
          onClick={() => {
            if (
              confirm(
                '로펙 점수 갱신 페이지를 열까요?\n열린 페이지에서 Run workflow 버튼을 누르면 2~3분 뒤 자동으로 반영됩니다.',
              )
            ) {
              window.open(LOPEC_WORKFLOW_URL, '_blank')
            }
          }}
          title="로펙 점수·젬 효율을 새로 받아옵니다 (GitHub Actions 실행)"
        >
          ⟳ 로펙 점수 갱신
        </button>
        <span className="toolbar-divider" />
        <input
          list="member-options"
          placeholder="당신의 이름은?"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
        />
        <datalist id="member-options">
          {members.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <input
          placeholder="캐릭터 이름"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void addChar()
          }}
        />
        <button onClick={() => void addChar()} disabled={progress !== null}>
          + 캐릭터 추가
        </button>
      </div>

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

      {members.map((member) => {
        const chars = sections.characters.filter((c) => c.member === member)
        return (
          <section key={member} className="member-section">
            <h3>
              <span
                className="member-dot"
                style={{ background: memberColor(member, members, colors) }}
              />
              {member}
              <span className="member-count">{chars.length}캐릭</span>
            </h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>캐릭터</th>
                    <th>조회</th>
                    <th>직업</th>
                    <th>역할</th>
                    <th className="num">아이템 레벨</th>
                    <th className="num">전투력</th>
                    <th className="num">로펙 현재</th>
                    <th className="num">로펙 최고</th>
                    <th className="num">젬 효율</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>{chars.map(renderRow)}</tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
