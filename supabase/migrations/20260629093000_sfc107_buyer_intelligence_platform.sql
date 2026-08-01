-- SFC-107 Buyer Intelligence Platform schema
-- Buyer profile, saved assets, and alerts supporting intelligent recommendations.

create table if not exists public.buyer_profiles (
  buyer_id text primary key,
  budget_min_cents bigint,
  budget_max_cents bigint,
  vehicle_types text[] not null default '{}',
  lifestyle text,
  daily_commute_km integer,
  family_size integer,
  fuel_preference text,
  transmission_preference text,
  towing_needs text,
  updated_at timestamptz not null default now()
);

create table if not exists public.buyer_saved_searches (
  id text primary key,
  buyer_id text not null,
  name text not null,
  query_text text not null,
  interpretation jsonb not null,
  alerts_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.buyer_saved_vehicles (
  id text primary key,
  buyer_id text not null,
  vehicle_id text not null references public.inventory_vehicles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, vehicle_id)
);

create table if not exists public.buyer_alert_subscriptions (
  id text primary key,
  buyer_id text not null,
  alert_type text not null,
  status text not null default 'active',
  channel text not null default 'email',
  reference_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_buyer_saved_searches_buyer
  on public.buyer_saved_searches(buyer_id, created_at desc);

create index if not exists idx_buyer_saved_vehicles_buyer
  on public.buyer_saved_vehicles(buyer_id, created_at desc);

create index if not exists idx_buyer_alerts_buyer
  on public.buyer_alert_subscriptions(buyer_id, created_at desc);

alter table public.buyer_profiles enable row level security;
alter table public.buyer_saved_searches enable row level security;
alter table public.buyer_saved_vehicles enable row level security;
alter table public.buyer_alert_subscriptions enable row level security;

drop policy if exists buyer_profiles_owner_rw on public.buyer_profiles;

create policy buyer_profiles_owner_rw
  on public.buyer_profiles
  for all
  using (buyer_id = coalesce(auth.uid()::text, ''))
  with check (buyer_id = coalesce(auth.uid()::text, ''));

drop policy if exists buyer_saved_searches_owner_rw on public.buyer_saved_searches;

create policy buyer_saved_searches_owner_rw
  on public.buyer_saved_searches
  for all
  using (buyer_id = coalesce(auth.uid()::text, ''))
  with check (buyer_id = coalesce(auth.uid()::text, ''));

drop policy if exists buyer_saved_vehicles_owner_rw on public.buyer_saved_vehicles;

create policy buyer_saved_vehicles_owner_rw
  on public.buyer_saved_vehicles
  for all
  using (buyer_id = coalesce(auth.uid()::text, ''))
  with check (buyer_id = coalesce(auth.uid()::text, ''));

drop policy if exists buyer_alert_subscriptions_owner_rw on public.buyer_alert_subscriptions;

create policy buyer_alert_subscriptions_owner_rw
  on public.buyer_alert_subscriptions
  for all
  using (buyer_id = coalesce(auth.uid()::text, ''))
  with check (buyer_id = coalesce(auth.uid()::text, ''));
