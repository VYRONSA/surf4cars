-- PCP-001J1 Operations Applications schema
-- Backing store for the Operations applications centre, which had no database representation.
-- Column sets mirror the LocalOperationsApplication* records exactly.

create extension if not exists pgcrypto;

-- Operations staff are not dealership-scoped; they are identified by the user_type claim that
-- resolveUserTypeFromSupabaseUser() reads. Centralised here so every operations policy agrees.
create or replace function public.is_operations_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'user_type',
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'user_type',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) in (
    'platform-administrator',
    'developer',
    'platform-owner',
    'operations-director',
    'dealer-success',
    'marketplace',
    'revenue',
    'finance'
  );
$$;

create table if not exists public.operations_application_reviews (
  id text primary key,
  application_id text not null,
  application_type text not null,
  source_entity_id text not null,
  dealership_id text references public.dealerships(id) on delete set null,
  status text not null default 'new'
    check (status in (
      'new', 'assigned', 'in-review', 'waiting-customer',
      'approved', 'rejected', 'completed', 'cancelled', 'archived'
    )),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to_user_id text,
  assigned_to_name text,
  owner_user_id text,
  owner_name text,
  updated_at timestamptz not null default now(),
  unique (application_id)
);

create table if not exists public.operations_application_events (
  id text primary key,
  application_id text not null references public.operations_application_reviews(application_id) on delete cascade,
  action text not null,
  status_after text not null,
  actor_type text not null default 'system',
  actor_id text,
  actor_name text,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.operations_application_notes (
  id text primary key,
  application_id text not null references public.operations_application_reviews(application_id) on delete cascade,
  note text not null,
  actor_type text not null default 'system',
  actor_id text,
  actor_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.operations_application_attachments (
  id text primary key,
  application_id text not null references public.operations_application_reviews(application_id) on delete cascade,
  label text not null,
  file_name text not null,
  file_url text not null,
  file_size_bytes bigint,
  mime_type text,
  uploaded_by text,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_ops_reviews_status on public.operations_application_reviews(status);
create index if not exists idx_ops_reviews_dealership on public.operations_application_reviews(dealership_id);
create index if not exists idx_ops_reviews_updated on public.operations_application_reviews(updated_at desc);
create index if not exists idx_ops_events_application on public.operations_application_events(application_id, created_at desc);
create index if not exists idx_ops_notes_application on public.operations_application_notes(application_id, created_at desc);
create index if not exists idx_ops_attachments_application on public.operations_application_attachments(application_id, uploaded_at desc);

alter table public.operations_application_reviews enable row level security;
alter table public.operations_application_events enable row level security;
alter table public.operations_application_notes enable row level security;
alter table public.operations_application_attachments enable row level security;

drop policy if exists ops_reviews_operations_rw on public.operations_application_reviews;

create policy ops_reviews_operations_rw
  on public.operations_application_reviews
  for all
  using (public.is_operations_user())
  with check (public.is_operations_user());

drop policy if exists ops_events_operations_rw on public.operations_application_events;

create policy ops_events_operations_rw
  on public.operations_application_events
  for all
  using (public.is_operations_user())
  with check (public.is_operations_user());

drop policy if exists ops_notes_operations_rw on public.operations_application_notes;

create policy ops_notes_operations_rw
  on public.operations_application_notes
  for all
  using (public.is_operations_user())
  with check (public.is_operations_user());

drop policy if exists ops_attachments_operations_rw on public.operations_application_attachments;

create policy ops_attachments_operations_rw
  on public.operations_application_attachments
  for all
  using (public.is_operations_user())
  with check (public.is_operations_user());
