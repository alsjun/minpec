import { useState } from 'react'
import { useAppState } from './store'
import type { SectionKey } from './store'
import DashboardView from './views/DashboardView'
import BoardView from './views/BoardView'
import ChecksView from './views/ChecksView'
import RosterView from './views/RosterView'
import GoldView from './views/GoldView'
import SourceSheetView from './views/SourceSheetView'

type Tab = 'dash' | 'board' | 'source' | 'checks' | 'roster' | 'gold'

const TABS: { id: Tab; label: string; undoKey?: SectionKey }[] = [
  { id: 'dash', label: '대시보드' },
  { id: 'board', label: '편성 보드', undoKey: 'assignments' },
  { id: 'source', label: '원본 시트', undoKey: 'sourceAssignments' },
  { id: 'checks', label: '레이드 체크', undoKey: 'checks' },
  { id: 'roster', label: '캐릭터' },
  { id: 'gold', label: '골드표' },
]

const TAB_IDS = ['dash', 'board', 'source', 'checks', 'roster', 'gold'] as const

/** 주소창 해시(#board 등)에서 탭을 읽습니다. 새로고침해도 보던 탭이 유지됩니다. */
function tabFromHash(): Tab {
  const h = window.location.hash.replace('#', '')
  return (TAB_IDS as readonly string[]).includes(h) ? (h as Tab) : 'dash'
}

export default function App() {
  const state = useAppState()
  const [tab, setTabState] = useState<Tab>(tabFromHash)
  const setTab = (t: Tab) => {
    setTabState(t)
    window.history.replaceState(null, '', `#${t}`)
  }
  const [boardRaidId, setBoardRaidId] = useState<string>('')
  const [undoMsg, setUndoMsg] = useState<string | null>(null)

  const activeTab = TABS.find((t) => t.id === tab)!

  const openBoard = (raidId: string) => {
    setBoardRaidId(raidId)
    setTab('board')
  }

  const handleUndo = async () => {
    if (!activeTab.undoKey) return
    const ok = await state.undo(activeTab.undoKey)
    setUndoMsg(ok ? '직전 상태로 되돌렸습니다.' : '되돌릴 이력이 없습니다.')
    setTimeout(() => setUndoMsg(null), 2500)
  }

  return (
    <div className="app">
      <header>
        <h1>VALOA 레이드 시트</h1>
        <span className={state.shared ? 'mode shared' : 'mode local'}>{state.modeLabel}</span>
      </header>

      {state.syncError && (
        <div className="sync-error">동기화 오류: {state.syncError} — 새로고침 후 다시 시도해 주세요.</div>
      )}

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        {activeTab.undoKey && (
          <button className="undo-btn" onClick={handleUndo} title="이 탭의 마지막 변경을 되돌립니다">
            ↩ 되돌리기
          </button>
        )}
        {undoMsg && <span className="undo-msg">{undoMsg}</span>}
      </nav>

      {!state.ready ? (
        <p className="hint">불러오는 중...</p>
      ) : (
        <main>
          {tab === 'dash' && <DashboardView state={state} onOpenBoard={openBoard} />}
          {tab === 'board' && (
            <BoardView state={state} raidId={boardRaidId} onSelectRaid={setBoardRaidId} />
          )}
          {tab === 'source' && <SourceSheetView state={state} />}
          {tab === 'checks' && <ChecksView state={state} />}
          {tab === 'roster' && <RosterView state={state} />}
          {tab === 'gold' && <GoldView />}
        </main>
      )}
    </div>
  )
}
