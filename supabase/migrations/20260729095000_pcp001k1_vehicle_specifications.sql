-- PCP-001K1 Vehicle schema alignment
--
-- inventory_vehicles could not store six fields the Vehicle Engine domain model reads:
-- variant, colour, fuel, transmission, engine, body_type. The mapper substituted defaults for the
-- missing values, so every migrated vehicle rendered as a Petrol / Automatic / SUV with
-- "Awaiting specification" engine and colour, and specification search returned nothing.
--
-- These are first-class vehicle attributes, queried directly by buyers, so they become columns
-- rather than being folded into a JSON blob. Nothing else is denormalised: media, pricing history
-- and audit remain in their own tables.

alter table public.inventory_vehicles add column if not exists variant text;
alter table public.inventory_vehicles add column if not exists colour text;
alter table public.inventory_vehicles add column if not exists fuel text;
alter table public.inventory_vehicles add column if not exists transmission text;
alter table public.inventory_vehicles add column if not exists engine text;
alter table public.inventory_vehicles add column if not exists body_type text;

-- Search pushdown indexes.
--
-- The repository previously loaded every vehicle and filtered in memory. Filtering moves into the
-- database, so each predicate a buyer can select needs index support. Partial indexes are scoped to
-- marketplace-visible stock because that is the overwhelming majority of public queries.

create index if not exists idx_inventory_vehicles_make_lower
  on public.inventory_vehicles (lower(make));

create index if not exists idx_inventory_vehicles_model_lower
  on public.inventory_vehicles (lower(model));

create index if not exists idx_inventory_vehicles_body_type_lower
  on public.inventory_vehicles (lower(body_type));

create index if not exists idx_inventory_vehicles_fuel_lower
  on public.inventory_vehicles (lower(fuel));

create index if not exists idx_inventory_vehicles_transmission_lower
  on public.inventory_vehicles (lower(transmission));

create index if not exists idx_inventory_vehicles_year
  on public.inventory_vehicles (year);

create index if not exists idx_inventory_vehicles_price
  on public.inventory_vehicles (asking_price_cents);

create index if not exists idx_inventory_vehicles_mileage
  on public.inventory_vehicles (mileage_km);

-- The marketplace's default query: visible stock, most recently updated first.
create index if not exists idx_inventory_vehicles_marketplace
  on public.inventory_vehicles (lifecycle_status, updated_at desc)
  where lifecycle_status in ('published', 'performance-monitoring', 'reserved');

-- Dealer inventory views are always tenant-scoped.
create index if not exists idx_inventory_vehicles_dealership_status
  on public.inventory_vehicles (dealership_id, lifecycle_status);
