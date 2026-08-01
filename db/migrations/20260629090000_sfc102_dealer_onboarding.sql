-- SFC-102 Dealer Onboarding production schema
-- Designed to align with SURF4CARS ownership and permission architecture.

create extension if not exists pgcrypto;

create table if not exists public.dealerships (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  business_name text not null,
  trading_name text not null,
  registration_number text not null,
  vat_number text not null,
  dealer_licence_number text,
  business_type text not null,
  physical_address text not null,
  province text not null,
  city text not null,
  postal_code text not null,
  gps_latitude text not null,
  gps_longitude text not null,
  telephone text not null,
  whatsapp text not null,
  email text not null,
  website text,
  logo_data_url text,
  cover_data_url text,
  primary_color text not null,
  secondary_color text not null,
  onboarding_status text not null default 'in-progress',
  subscription_package text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealership_branches (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  name text not null,
  address text not null,
  province text not null,
  city text not null,
  postal_code text not null,
  telephone text not null,
  whatsapp text not null,
  email text not null,
  business_hours text not null,
  branch_manager text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealership_staff_memberships (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  branch_id text not null references public.dealership_branches(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  role_id text not null,
  permissions jsonb not null default '[]'::jsonb,
  status text not null default 'invited',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, email)
);

create table if not exists public.dealer_onboarding_drafts (
  owner_email text primary key,
  current_step_index integer not null default 0,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dealerships_owner_user_id on public.dealerships(owner_user_id);
create index if not exists idx_dealership_branches_dealership_id on public.dealership_branches(dealership_id);
create index if not exists idx_staff_memberships_dealership_id on public.dealership_staff_memberships(dealership_id);
create index if not exists idx_staff_memberships_email on public.dealership_staff_memberships(email);

alter table public.dealerships enable row level security;
alter table public.dealership_branches enable row level security;
alter table public.dealership_staff_memberships enable row level security;
alter table public.dealer_onboarding_drafts enable row level security;

-- Owners can create and manage their dealership records.
drop policy if exists dealerships_owner_rw on public.dealerships;

create policy dealerships_owner_rw
  on public.dealerships
  for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists dealership_branches_owner_rw on public.dealership_branches;

create policy dealership_branches_owner_rw
  on public.dealership_branches
  for all
  using (
    exists (
      select 1
      from public.dealerships d
      where d.id = dealership_id
        and d.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.dealerships d
      where d.id = dealership_id
        and d.owner_user_id = auth.uid()
    )
  );

drop policy if exists staff_memberships_owner_rw on public.dealership_staff_memberships;

create policy staff_memberships_owner_rw
  on public.dealership_staff_memberships
  for all
  using (
    exists (
      select 1
      from public.dealerships d
      where d.id = dealership_id
        and d.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.dealerships d
      where d.id = dealership_id
        and d.owner_user_id = auth.uid()
    )
  );

drop policy if exists onboarding_drafts_owner_rw on public.dealer_onboarding_drafts;

create policy onboarding_drafts_owner_rw
  on public.dealer_onboarding_drafts
  for all
  using (
    lower(owner_email) = lower(coalesce(auth.jwt()->>'email', ''))
  )
  with check (
    lower(owner_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
