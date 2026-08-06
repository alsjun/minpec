import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// 빌드 시점에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 주입되면 공유 모드,
// 없으면 브라우저 localStorage만 쓰는 로컬 모드로 동작합니다.
const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
// 대시보드에서 REST 주소(.../rest/v1/)를 복사해 넣는 실수가 흔해서 base 주소로 정리합니다.
const url = rawUrl?.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null
