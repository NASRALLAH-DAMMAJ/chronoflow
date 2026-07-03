-- Auto-create profile and settings when a user signs up

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
