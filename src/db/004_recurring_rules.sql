-- ChronoFlow: recurring_rules table
-- Defines blocks that repeat on certain days of the week.

create table if not exists public.recurring_rules (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  days_of_week  smallint[] not null,  -- array of 0=Sun..6=Sat
  start_min     smallint not null check (start_min between 0 and 1439),
  duration      smallint not null check (duration > 0),
  label         text not null,
  category      text not null,
  active_until  date,   -- null means indefinitely
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.recurring_rules enable row level security;

create policy "Users can read their own rules"
  on public.recurring_rules for select
  using (auth.uid() = user_id);

create policy "Users can insert their own rules"
  on public.recurring_rules for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own rules"
  on public.recurring_rules for update
  using (auth.uid() = user_id);

create policy "Users can delete their own rules"
  on public.recurring_rules for delete
  using (auth.uid() = user_id);
