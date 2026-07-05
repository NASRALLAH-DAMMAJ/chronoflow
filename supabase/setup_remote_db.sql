-- ChronoFlow: Complete database setup
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/dkuwoqqgdihmkadkiczu/sql/new)

-- 1. Profiles table
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Settings table
create table if not exists public.settings (
  user_id     uuid references public.profiles(id) on delete cascade primary key,
  sleep_start smallint default 1380,
  sleep_end   smallint default 420,
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

-- 3. Blocks table
create table if not exists public.blocks (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  date          date not null,
  start_min     smallint not null check (start_min between 0 and 1439),
  duration      smallint not null check (duration > 0),
  label         text not null,
  category      text not null,
  is_recurring  boolean default false,
  parent_rule_id uuid,
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

-- 4. Recurring rules table
create table if not exists public.recurring_rules (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  days_of_week  smallint[] not null,
  start_min     smallint not null check (start_min between 0 and 1439),
  duration      smallint not null check (duration > 0),
  label         text not null,
  category      text not null,
  active_until  date,
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

-- 5. Auto-create profile + settings on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'User'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  );

  insert into public.settings (user_id)
  values (new.id);

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 6. Create profile + settings for ANY existing users who don't have one yet
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', 'User')
from auth.users
where id not in (select id from public.profiles)
on conflict do nothing;

insert into public.settings (user_id)
select id from public.profiles
where id not in (select user_id from public.settings)
on conflict do nothing;
