-- Run once in the Supabase SQL editor before enabling the scheduled check.
-- This table contains no user data and permits only reads through the public API.
begin;

create table if not exists public.health_check (
  id integer primary key check (id = 1)
);

insert into public.health_check (id) values (1) on conflict (id) do nothing;

alter table public.health_check enable row level security;
revoke all on public.health_check from public, anon, authenticated;
grant select on public.health_check to anon, authenticated;

drop policy if exists "Read health check" on public.health_check;
create policy "Read health check" on public.health_check
  for select to anon, authenticated using (id = 1);

commit;
