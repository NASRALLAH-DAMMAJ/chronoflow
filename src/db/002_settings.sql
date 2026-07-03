-- ChronoFlow: settings table
-- Each user has exactly one settings row, created on signup.

create table if not exists public.settings (
  user_id     uuid references public.profiles(id) on delete cascade primary key,
  sleep_start smallint default 1380,   -- 23:00 in minutes
  sleep_end   smallint default 420,    -- 07:00 in minutes
  theme       text    default 'system' check (theme in ('system', 'light', 'dark')),
  timezone    text    default 'UTC',
  updated_at  timestamptz default now()
);

alter table public.settings enable row level security;

create policy "Users can view their own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.settings for update
  using (auth.uid() = user_id);
