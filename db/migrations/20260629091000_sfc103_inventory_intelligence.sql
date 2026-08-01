-- SFC-103 Inventory Intelligence Platform schema
-- Extends existing dealership tenancy for production inventory intelligence workflows.

create extension if not exists pgcrypto;

create table if not exists public.inventory_vehicles (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  branch_id text not null references public.dealership_branches(id) on delete cascade,
  stock_number text not null,
  vin text not null,
  registration_number text not null,
  title text not null,
  make text not null,
  model text not null,
  year integer not null,
  mileage_km integer not null,
  asking_price_cents bigint not null default 0,
  currency text not null default 'ZAR',
  lifecycle_status text not null default 'draft',
  description text,
  seo_title text,
  seo_description text,
  estimated_days_to_sell integer,
  lead_count_30d integer not null default 0,
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sold_at timestamptz,
  archived_at timestamptz,
  unique (dealership_id, stock_number)
);

create table if not exists public.inventory_vehicle_media (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  vehicle_id text not null references public.inventory_vehicles(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  is_primary boolean not null default false,
  sort_order integer not null,
  quality_status text not null default 'review',
  processing_status text not null default 'uploaded',
  ai_enhancement_status text not null default 'not-started',
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_vehicle_documents (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  vehicle_id text not null references public.inventory_vehicles(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  file_url text not null,
  uploaded_by text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.inventory_vehicle_price_history (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  vehicle_id text not null references public.inventory_vehicles(id) on delete cascade,
  price_cents bigint not null,
  reason text not null,
  changed_by text not null,
  changed_at timestamptz not null default now()
);

create table if not exists public.inventory_vehicle_history (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  vehicle_id text not null references public.inventory_vehicles(id) on delete cascade,
  event_type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_vehicle_audit (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  vehicle_id text not null references public.inventory_vehicles(id) on delete cascade,
  actor_id text not null,
  actor_type text not null,
  action text not null,
  payload text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_vehicles_dealership on public.inventory_vehicles(dealership_id);
create index if not exists idx_inventory_vehicles_status on public.inventory_vehicles(dealership_id, lifecycle_status);
create index if not exists idx_inventory_media_vehicle on public.inventory_vehicle_media(vehicle_id);
create index if not exists idx_inventory_docs_vehicle on public.inventory_vehicle_documents(vehicle_id);
create index if not exists idx_inventory_price_vehicle on public.inventory_vehicle_price_history(vehicle_id);
create index if not exists idx_inventory_history_vehicle on public.inventory_vehicle_history(vehicle_id);
create index if not exists idx_inventory_audit_vehicle on public.inventory_vehicle_audit(vehicle_id);

alter table public.inventory_vehicles enable row level security;
alter table public.inventory_vehicle_media enable row level security;
alter table public.inventory_vehicle_documents enable row level security;
alter table public.inventory_vehicle_price_history enable row level security;
alter table public.inventory_vehicle_history enable row level security;
alter table public.inventory_vehicle_audit enable row level security;

drop policy if exists inventory_vehicles_owner_rw on public.inventory_vehicles;

create policy inventory_vehicles_owner_rw
  on public.inventory_vehicles
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

drop policy if exists inventory_media_owner_rw on public.inventory_vehicle_media;

create policy inventory_media_owner_rw
  on public.inventory_vehicle_media
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

drop policy if exists inventory_docs_owner_rw on public.inventory_vehicle_documents;

create policy inventory_docs_owner_rw
  on public.inventory_vehicle_documents
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

drop policy if exists inventory_price_owner_rw on public.inventory_vehicle_price_history;

create policy inventory_price_owner_rw
  on public.inventory_vehicle_price_history
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

drop policy if exists inventory_history_owner_rw on public.inventory_vehicle_history;

create policy inventory_history_owner_rw
  on public.inventory_vehicle_history
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

drop policy if exists inventory_audit_owner_rw on public.inventory_vehicle_audit;

create policy inventory_audit_owner_rw
  on public.inventory_vehicle_audit
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
