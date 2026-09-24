-- Run in the Supabase SQL editor before using account persistence.
create table if not exists public.user_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_state enable row level security;
grant select, insert, update on public.user_state to authenticated;

create policy "Read own state" on public.user_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own state" on public.user_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own state" on public.user_state
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
