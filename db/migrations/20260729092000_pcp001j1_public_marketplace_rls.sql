-- PCP-001J1 Public marketplace read policies
--
-- Every policy authored before this point was owner-scoped `for all`. With RLS enabled and no
-- anonymous policy, a public marketplace query returns zero rows — the marketplace would be empty
-- in production even with the schema fully applied.
--
-- These policies are SELECT-only and additive. Postgres combines permissive policies with OR, so
-- dealer isolation for insert/update/delete is untouched: a dealer still cannot read, write or
-- delete another dealership's rows, and non-published stock stays owner-only.

-- Lifecycle values that project to a marketplace-visible status in the Vehicle Engine
-- (PUBLISHABLE_VEHICLE_STATUSES, with 'performance-monitoring' mapping to published).
-- Draft, ai-review, ready-to-publish, sold, archived and deleted remain private.
create or replace function public.is_marketplace_visible_status(lifecycle_status text)
returns boolean
language sql
immutable
as $$
  select lifecycle_status in ('published', 'performance-monitoring', 'reserved');
$$;

drop policy if exists inventory_vehicles_public_read on public.inventory_vehicles;

create policy inventory_vehicles_public_read
  on public.inventory_vehicles
  for select
  to anon, authenticated
  using (public.is_marketplace_visible_status(lifecycle_status));

-- Media is readable only when its parent vehicle is itself marketplace-visible.
drop policy if exists inventory_media_public_read on public.inventory_vehicle_media;

create policy inventory_media_public_read
  on public.inventory_vehicle_media
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.inventory_vehicles v
      where v.id = vehicle_id
        and public.is_marketplace_visible_status(v.lifecycle_status)
    )
  );

-- Dealer identity shown on a public listing (trading name, city, province, contact).
-- Restricted to dealerships that actually have marketplace-visible stock.
drop policy if exists dealerships_public_read on public.dealerships;

create policy dealerships_public_read
  on public.dealerships
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.inventory_vehicles v
      where v.dealership_id = id
        and public.is_marketplace_visible_status(v.lifecycle_status)
    )
  );

drop policy if exists dealership_branches_public_read on public.dealership_branches;

create policy dealership_branches_public_read
  on public.dealership_branches
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.inventory_vehicles v
      where v.branch_id = id
        and public.is_marketplace_visible_status(v.lifecycle_status)
    )
  );
