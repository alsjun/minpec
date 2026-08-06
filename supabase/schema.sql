-- VALOA 레이드 시트 스키마
-- Supabase 대시보드 → SQL Editor에 이 파일 전체를 붙여 넣고 실행해 주세요.
-- 실행 후 웹앱을 처음 열면 시트에서 옮겨 온 초기 데이터가 자동으로 올라갑니다.

-- 섹션별 현재 상태. key: characters / raids / checks / assignments
create table if not exists public.sections (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- 저장 직전 상태를 쌓아 두는 이력. 되돌리기와 백업이 여기서 나옵니다.
create table if not exists public.sections_history (
  id bigint generated always as identity primary key,
  section text not null,
  data jsonb not null,
  saved_at timestamptz not null default now()
);

create index if not exists sections_history_section_idx
  on public.sections_history (section, id desc);

-- 로그인 없이 쓰는 서비스라서 anon 키에 읽기/쓰기를 모두 허용합니다.
-- 주소를 아는 사람은 누구나 수정할 수 있다는 점을 감안한 설계입니다.
alter table public.sections enable row level security;
alter table public.sections_history enable row level security;

drop policy if exists "sections_select" on public.sections;
drop policy if exists "sections_insert" on public.sections;
drop policy if exists "sections_update" on public.sections;
create policy "sections_select" on public.sections for select using (true);
create policy "sections_insert" on public.sections for insert with check (true);
create policy "sections_update" on public.sections for update using (true);

drop policy if exists "history_select" on public.sections_history;
drop policy if exists "history_insert" on public.sections_history;
drop policy if exists "history_delete" on public.sections_history;
create policy "history_select" on public.sections_history for select using (true);
create policy "history_insert" on public.sections_history for insert with check (true);
-- 되돌리기가 마지막 이력을 꺼내 쓰면서 삭제하므로 delete도 필요합니다.
create policy "history_delete" on public.sections_history for delete using (true);

-- 팀원 화면에 변경이 실시간으로 반영되도록 Realtime 발행 대상에 추가합니다.
alter publication supabase_realtime add table public.sections;
