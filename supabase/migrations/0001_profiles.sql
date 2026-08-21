-- OBSOLETE — superseded by
-- inoxity_v2/supabase/control_backend/migrations/003_researcher_profiles.sql.
-- Kept only as a historical record of what was applied to the now-unused
-- inoxity_dashboard Supabase project (researcher auth/profiles and the
-- Control schema now live together in the inoxity_backend project instead).
-- Do not apply this file anywhere else, and do not edit it further.
--
-- profiles: one row per researcher, keyed to Supabase's built-in auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  institution text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Safety net only: the trigger below inserts as SECURITY DEFINER and
-- bypasses RLS, so this isn't required for signup to work, but keeps the
-- policy set complete in case a client-side insert is ever added later.
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Populate profiles automatically whenever a new auth.users row is created,
-- reading full_name/institution out of the signUp() metadata payload.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, institution)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'institution'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
