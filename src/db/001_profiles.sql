-- ChronoFlow: profiles table
-- Created after user authenticates via trigger or app logic.

create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read any profile (for sharing, analytics)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Users can insert their own profile
create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);
