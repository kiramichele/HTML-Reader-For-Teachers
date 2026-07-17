-- =====================================================================
-- HTML Reader For Teachers — database schema
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- Safe to re-run: uses "if not exists" / "drop policy if exists".
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.activities (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  storage_path text not null,                 -- path within the "activities" storage bucket
  collect_data boolean not null default true, -- false = plain slideshow, no student data saved
  share_slug   text not null unique,          -- public link id, e.g. /p/<share_slug>
  created_at   timestamptz not null default now()
);

create index if not exists activities_teacher_id_idx on public.activities (teacher_id);

create table if not exists public.responses (
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid not null references public.activities (id) on delete cascade,
  student_name    text not null,
  structured_data jsonb,                       -- { answers, responses:[{id,prompt,type,answer}] }
  status          text not null default 'draft' check (status in ('draft','complete')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- one editable record per student per activity
  unique (activity_id, student_name)
);

create index if not exists responses_activity_id_idx on public.responses (activity_id);

-- Keep updated_at fresh on every write.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists responses_touch_updated_at on public.responses;
create trigger responses_touch_updated_at
  before update on public.responses
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- Teachers (authenticated) may only see/manage THEIR OWN activities and
-- the responses to them. Students have no login: all student writes go
-- through the server using the service-role key, which bypasses RLS, so
-- there are deliberately NO public insert/update policies here.
-- ---------------------------------------------------------------------

alter table public.activities enable row level security;
alter table public.responses  enable row level security;

-- activities: owner-only CRUD
drop policy if exists "activities owner select" on public.activities;
create policy "activities owner select" on public.activities
  for select using (auth.uid() = teacher_id);

drop policy if exists "activities owner insert" on public.activities;
create policy "activities owner insert" on public.activities
  for insert with check (auth.uid() = teacher_id);

drop policy if exists "activities owner update" on public.activities;
create policy "activities owner update" on public.activities
  for update using (auth.uid() = teacher_id);

drop policy if exists "activities owner delete" on public.activities;
create policy "activities owner delete" on public.activities
  for delete using (auth.uid() = teacher_id);

-- responses: a teacher may read responses that belong to their activities.
-- (This also governs what Realtime will stream to the teacher dashboard.)
drop policy if exists "responses owner select" on public.responses;
create policy "responses owner select" on public.responses
  for select using (
    exists (
      select 1 from public.activities a
      where a.id = responses.activity_id
        and a.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Realtime: let the teacher dashboard subscribe to live responses.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'responses'
  ) then
    alter publication supabase_realtime add table public.responses;
  end if;
end
$$;
