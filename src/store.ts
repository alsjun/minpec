import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'
import { SEED_SECTIONS } from './seed'
import type { Sections } from './types'

export type SectionKey = keyof Sections

const SECTION_KEYS: SectionKey[] = [
  'characters',
  'raids',
  'checks',
  'sourceAssignments',
  'assignments',
  'memberColors',
]

interface Adapter {
  label: string
  load(): Promise<Partial<Sections>>
  /** prev를 이력으로 남긴 뒤 next를 저장합니다. 이력이 있어야 되돌리기가 가능합니다. */
  save(key: SectionKey, next: unknown, prev: unknown): Promise<void>
  /** 마지막 이력을 꺼내 복원합니다. 이력이 없으면 null을 돌려줍니다. */
  undo(key: SectionKey): Promise<unknown | null>
  subscribe(cb: (key: SectionKey, data: unknown) => void): () => void
}

/** Supabase 미설정 시 localStorage에 저장하는 로컬 모드. 혼자 테스트할 때 사용됩니다. */
class LocalAdapter implements Adapter {
  label = '로컬 모드 (공유 안 됨)'
  private storageKey = 'loa-party:sections'
  private historyKey = 'loa-party:history'

  private read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  }

  async load(): Promise<Partial<Sections>> {
    return this.read<Partial<Sections>>(this.storageKey, {})
  }

  async save(key: SectionKey, next: unknown, prev: unknown): Promise<void> {
    const all = this.read<Record<string, unknown>>(this.storageKey, {})
    all[key] = next
    localStorage.setItem(this.storageKey, JSON.stringify(all))

    const history = this.read<Record<string, unknown[]>>(this.historyKey, {})
    const stack = history[key] ?? []
    stack.push(prev)
    // 이력이 무한히 커지지 않도록 최근 50개만 유지합니다.
    history[key] = stack.slice(-50)
    localStorage.setItem(this.historyKey, JSON.stringify(history))
  }

  async undo(key: SectionKey): Promise<unknown | null> {
    const history = this.read<Record<string, unknown[]>>(this.historyKey, {})
    const stack = history[key] ?? []
    const restored = stack.pop()
    if (restored === undefined) return null
    history[key] = stack
    localStorage.setItem(this.historyKey, JSON.stringify(history))

    const all = this.read<Record<string, unknown>>(this.storageKey, {})
    all[key] = restored
    localStorage.setItem(this.storageKey, JSON.stringify(all))
    return restored
  }

  subscribe(): () => void {
    return () => {}
  }
}

/** 팀원 전체가 같은 데이터를 보는 공유 모드. sections 테이블 한 곳에 섹션별 JSON을 저장합니다. */
class SupabaseAdapter implements Adapter {
  label = '공유 모드'

  async load(): Promise<Partial<Sections>> {
    const sb = supabase!
    const { data, error } = await sb.from('sections').select('key, data')
    if (error) throw new Error(`불러오기 실패: ${error.message}`)

    if (!data || data.length === 0) {
      // 최초 실행: 시트에서 옮겨 온 시드 데이터를 올립니다.
      const rows = SECTION_KEYS.map((key) => ({ key, data: SEED_SECTIONS[key] }))
      const { error: seedError } = await sb.from('sections').upsert(rows)
      if (seedError) throw new Error(`초기 데이터 업로드 실패: ${seedError.message}`)
      return { ...SEED_SECTIONS }
    }

    const result: Record<string, unknown> = {}
    for (const row of data) result[row.key] = row.data
    return result as Partial<Sections>
  }

  async save(key: SectionKey, next: unknown, prev: unknown): Promise<void> {
    const sb = supabase!
    // 저장 직전 상태를 이력으로 남긴다 → 되돌리기에서 이 행을 꺼내 복원한다.
    const { error: histError } = await sb
      .from('sections_history')
      .insert({ section: key, data: prev })
    if (histError) throw new Error(`이력 저장 실패: ${histError.message}`)

    const { error } = await sb
      .from('sections')
      .upsert({ key, data: next, updated_at: new Date().toISOString() })
    if (error) throw new Error(`저장 실패: ${error.message}`)
  }

  async undo(key: SectionKey): Promise<unknown | null> {
    const sb = supabase!
    const { data, error } = await sb
      .from('sections_history')
      .select('id, data')
      .eq('section', key)
      .order('id', { ascending: false })
      .limit(1)
    if (error) throw new Error(`이력 조회 실패: ${error.message}`)
    if (!data || data.length === 0) return null

    const entry = data[0]
    const { error: delError } = await sb.from('sections_history').delete().eq('id', entry.id)
    if (delError) throw new Error(`이력 정리 실패: ${delError.message}`)

    const { error: upError } = await sb
      .from('sections')
      .upsert({ key, data: entry.data, updated_at: new Date().toISOString() })
    if (upError) throw new Error(`복원 실패: ${upError.message}`)
    return entry.data
  }

  subscribe(cb: (key: SectionKey, data: unknown) => void): () => void {
    const sb = supabase!
    const channel = sb
      .channel('sections-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sections' },
        (payload) => {
          const row = payload.new as { key?: SectionKey; data?: unknown } | null
          if (row?.key && row.data !== undefined) cb(row.key, row.data)
        },
      )
      .subscribe()
    return () => {
      sb.removeChannel(channel)
    }
  }
}

export interface AppState {
  sections: Sections
  ready: boolean
  shared: boolean
  modeLabel: string
  syncError: string | null
  update: <K extends SectionKey>(key: K, updater: (cur: Sections[K]) => Sections[K]) => void
  undo: (key: SectionKey) => Promise<boolean>
}

export function useAppState(): AppState {
  const adapterRef = useRef<Adapter>(supabase ? new SupabaseAdapter() : new LocalAdapter())
  const [sections, setSections] = useState<Sections>(SEED_SECTIONS)
  const [ready, setReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    const adapter = adapterRef.current
    let alive = true

    adapter
      .load()
      .then((loaded) => {
        if (!alive) return
        setSections((prev) => {
          const next = { ...prev, ...loaded }
          if (!loaded.sourceAssignments && loaded.assignments) {
            next.sourceAssignments = loaded.assignments
            adapter
              .save('sourceAssignments', loaded.assignments, prev.sourceAssignments)
              .catch((e: Error) => setSyncError(e.message))
          }
          return next
        })
        setReady(true)
      })
      .catch((e: Error) => {
        if (!alive) return
        setSyncError(e.message)
        setReady(true)
      })

    const unsubscribe = adapter.subscribe((key, data) => {
      // 다른 팀원이 저장한 변경이 실시간으로 흘러 들어온다.
      setSections((prev) => ({ ...prev, [key]: data }))
    })
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const update = useCallback(
    <K extends SectionKey>(key: K, updater: (cur: Sections[K]) => Sections[K]) => {
      setSections((prev) => {
        const next = updater(prev[key])
        adapterRef.current
          .save(key, next, prev[key])
          .then(() => setSyncError(null))
          .catch((e: Error) => setSyncError(e.message))
        return { ...prev, [key]: next }
      })
    },
    [],
  )

  const undo = useCallback(async (key: SectionKey): Promise<boolean> => {
    try {
      const restored = await adapterRef.current.undo(key)
      if (restored === null) return false
      setSections((prev) => ({ ...prev, [key]: restored as never }))
      setSyncError(null)
      return true
    } catch (e) {
      setSyncError((e as Error).message)
      return false
    }
  }, [])

  return {
    sections,
    ready,
    shared: supabase !== null,
    modeLabel: adapterRef.current.label,
    syncError,
    update,
    undo,
  }
}

/** 멤버별 고정 색상. 시트의 캐릭터 색깔 자동지정을 대신합니다. */
const MEMBER_COLORS = [
  '#e06c75', '#61afef', '#98c379', '#c678dd', '#d19a66',
  '#56b6c2', '#be5046', '#7f9f5f', '#a6accd', '#e5c07b',
]

export function memberColor(
  member: string,
  memberOrder: string[],
  customColors: Sections['memberColors'] = {},
): string {
  if (customColors[member]) return customColors[member]
  const idx = memberOrder.indexOf(member)
  return MEMBER_COLORS[(idx >= 0 ? idx : memberOrder.length) % MEMBER_COLORS.length]
}

export function memberList(characters: Sections['characters']): string[] {
  const seen: string[] = []
  for (const c of characters) {
    if (!seen.includes(c.member)) seen.push(c.member)
  }
  return seen
}
