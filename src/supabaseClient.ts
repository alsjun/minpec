import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// 빌드 시점에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 주입되면 공유 모드,
// 없으면 브라우저 localStorage만 쓰는 로컬 모드로 동작합니다.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null
