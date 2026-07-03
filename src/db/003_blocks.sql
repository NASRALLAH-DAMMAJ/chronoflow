-- ChronoFlow: blocks table
-- One row per time block on a given date.

create table if not exists public.blocks (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  date          date not null,
  start_min     smallint not null check (start_min between 0 and 1439),
  duration      smallint not null check (duration > 0),
  label         text not null,
  category      text not null,
  is_recurring  boolean default false,
  parent_rule_id uuid,   -- references recurring_rules.id when is_recurring=true
  archived      boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.blocks enable row level security;

create policy "Users can read their own blocks"
  on public.blocks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own blocks"
  on public.blocks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own blocks"
  on public.blocks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own blocks"
  on public.blocks for delete
  using (auth.uid() = user_id);
