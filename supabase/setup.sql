-- Director Shot Assistant 測試版資料層
-- 在 Supabase Dashboard > SQL Editor 執行一次。
-- 不允許直接列出資料；只能透過隨機 project code 讀寫單一專案。

create table if not exists public.director_shot_projects (
  project_code text primary key check (char_length(project_code) between 8 and 64),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.director_shot_projects enable row level security;
revoke all on public.director_shot_projects from anon, authenticated;

create or replace function public.get_shot_project(p_code text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select payload from public.director_shot_projects where project_code = upper(p_code) limit 1;
$$;

create or replace function public.save_shot_project(p_code text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(p_code) < 8 then raise exception 'invalid project code'; end if;
  insert into public.director_shot_projects(project_code, payload, updated_at)
  values (upper(p_code), p_payload, now())
  on conflict (project_code) do update set payload = excluded.payload, updated_at = now();
end;
$$;

revoke all on function public.get_shot_project(text) from public;
revoke all on function public.save_shot_project(text, jsonb) from public;
grant execute on function public.get_shot_project(text) to anon, authenticated;
grant execute on function public.save_shot_project(text, jsonb) to anon, authenticated;
