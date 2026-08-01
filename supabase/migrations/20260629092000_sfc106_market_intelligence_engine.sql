-- SFC-106 Market Intelligence Engine schema
-- Analytics event pipeline storage for future market intelligence models.

create table if not exists public.market_analytics_events (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  vehicle_id text references public.inventory_vehicles(id) on delete set null,
  event_type text not null,
  event_name text not null,
  event_timestamp timestamptz not null,
  actor_id text,
  actor_type text not null default 'system',
  session_id text,
  source text not null default 'web',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_market_events_dealership_time
  on public.market_analytics_events(dealership_id, event_timestamp desc);

create index if not exists idx_market_events_vehicle_time
  on public.market_analytics_events(vehicle_id, event_timestamp desc);

create index if not exists idx_market_events_type_time
  on public.market_analytics_events(event_type, event_timestamp desc);

alter table public.market_analytics_events enable row level security;

drop policy if exists market_events_owner_rw on public.market_analytics_events;

create policy market_events_owner_rw
  on public.market_analytics_events
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
