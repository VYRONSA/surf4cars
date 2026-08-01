-- PCP-001J2 RLS correction: recursion break + dealer staff access
--
-- Two defects found by live RLS testing against the production database:
--
-- 1. INFINITE RECURSION (42P17). The public marketplace policy on `dealerships` queried
--    `inventory_vehicles`, whose owner policy queried `dealerships`, forming a cycle. Every read
--    by anon or authenticated returned HTTP 500 — the marketplace, dealer portal and buyer journey
--    were all non-functional for non-service roles.
--
--    Fix: cross-table checks move into SECURITY DEFINER functions. Those run as the function owner
--    and therefore do not re-enter RLS on the inner relation, which breaks the cycle. This is the
--    documented pattern for cross-table policy predicates.
--
-- 2. STAFF LOCKOUT. Policies authorised only `dealerships.owner_user_id`, while the application
--    also authorises active staff memberships (authorizeDealerApiRequest). Staff would pass
--    application authorisation and then be refused by the database.
--
--    Fix: a single has_dealership_access() predicate covering owner OR active staff, applied
--    consistently across every dealership-scoped table. This widens access to exactly the set the
--    application already authorises — it does not weaken tenant isolation.

-- ---------------------------------------------------------------------------
-- Access predicates
-- ---------------------------------------------------------------------------

-- Owner or active staff member of the dealership. SECURITY DEFINER so the membership lookup does
-- not recurse into the policies of dealerships / dealership_staff_memberships.
create or replace function public.has_dealership_access(p_dealership_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dealerships d
    where d.id = p_dealership_id
      and d.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.dealership_staff_memberships m
    where m.dealership_id = p_dealership_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- Marketplace visibility, evaluated without re-entering inventory_vehicles policies.
create or replace function public.dealership_has_marketplace_stock(p_dealership_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.inventory_vehicles v
    where v.dealership_id = p_dealership_id
      and public.is_marketplace_visible_status(v.lifecycle_status)
  );
$$;

create or replace function public.branch_has_marketplace_stock(p_branch_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.inventory_vehicles v
    where v.branch_id = p_branch_id
      and public.is_marketplace_visible_status(v.lifecycle_status)
  );
$$;

create or replace function public.vehicle_is_marketplace_visible(p_vehicle_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.inventory_vehicles v
    where v.id = p_vehicle_id
      and public.is_marketplace_visible_status(v.lifecycle_status)
  );
$$;

grant execute on function public.has_dealership_access(text) to anon, authenticated;
grant execute on function public.dealership_has_marketplace_stock(text) to anon, authenticated;
grant execute on function public.branch_has_marketplace_stock(text) to anon, authenticated;
grant execute on function public.vehicle_is_marketplace_visible(text) to anon, authenticated;
grant execute on function public.is_marketplace_visible_status(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Dealerships: owner/staff read-write, plus public read of dealers with live stock
-- ---------------------------------------------------------------------------

drop policy if exists dealerships_owner_rw on public.dealerships;

create policy dealerships_owner_rw
  on public.dealerships
  for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists dealerships_staff_read on public.dealerships;

create policy dealerships_staff_read
  on public.dealerships
  for select
  to authenticated
  using (public.has_dealership_access(id));

drop policy if exists dealerships_public_read on public.dealerships;

create policy dealerships_public_read
  on public.dealerships
  for select
  to anon, authenticated
  using (public.dealership_has_marketplace_stock(id));

-- ---------------------------------------------------------------------------
-- Dealership-scoped tables: one consistent owner-or-staff predicate
-- ---------------------------------------------------------------------------

drop policy if exists dealership_branches_owner_rw on public.dealership_branches;

create policy dealership_branches_owner_rw
  on public.dealership_branches
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists dealership_branches_public_read on public.dealership_branches;

create policy dealership_branches_public_read
  on public.dealership_branches
  for select
  to anon, authenticated
  using (public.branch_has_marketplace_stock(id));

drop policy if exists staff_memberships_owner_rw on public.dealership_staff_memberships;

create policy staff_memberships_owner_rw
  on public.dealership_staff_memberships
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists inventory_vehicles_owner_rw on public.inventory_vehicles;

create policy inventory_vehicles_owner_rw
  on public.inventory_vehicles
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists inventory_vehicles_public_read on public.inventory_vehicles;

create policy inventory_vehicles_public_read
  on public.inventory_vehicles
  for select
  to anon, authenticated
  using (public.is_marketplace_visible_status(lifecycle_status));

drop policy if exists inventory_media_owner_rw on public.inventory_vehicle_media;

create policy inventory_media_owner_rw
  on public.inventory_vehicle_media
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists inventory_media_public_read on public.inventory_vehicle_media;

create policy inventory_media_public_read
  on public.inventory_vehicle_media
  for select
  to anon, authenticated
  using (public.vehicle_is_marketplace_visible(vehicle_id));

drop policy if exists inventory_docs_owner_rw on public.inventory_vehicle_documents;

create policy inventory_docs_owner_rw
  on public.inventory_vehicle_documents
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists inventory_price_owner_rw on public.inventory_vehicle_price_history;

create policy inventory_price_owner_rw
  on public.inventory_vehicle_price_history
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists inventory_history_owner_rw on public.inventory_vehicle_history;

create policy inventory_history_owner_rw
  on public.inventory_vehicle_history
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists inventory_audit_owner_rw on public.inventory_vehicle_audit;

create policy inventory_audit_owner_rw
  on public.inventory_vehicle_audit
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists market_events_owner_rw on public.market_analytics_events;

create policy market_events_owner_rw
  on public.market_analytics_events
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists dealer_intelligence_reviews_owner_rw on public.dealer_intelligence_reviews;

create policy dealer_intelligence_reviews_owner_rw
  on public.dealer_intelligence_reviews
  for all
  using (public.has_dealership_access(dealership_id) or public.is_operations_user())
  with check (public.has_dealership_access(dealership_id) or public.is_operations_user());

drop policy if exists dealer_intelligence_activity_owner_rw on public.dealer_intelligence_activity;

create policy dealer_intelligence_activity_owner_rw
  on public.dealer_intelligence_activity
  for all
  using (public.has_dealership_access(dealership_id) or public.is_operations_user())
  with check (public.has_dealership_access(dealership_id) or public.is_operations_user());

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------

drop policy if exists leads_dealer_rw on public.leads;

create policy leads_dealer_rw
  on public.leads
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

drop policy if exists leads_buyer_read on public.leads;

create policy leads_buyer_read
  on public.leads
  for select
  to authenticated
  using (buyer_id is not null and buyer_id = auth.uid()::text);

drop policy if exists lead_timeline_dealer_rw on public.lead_timeline;

create policy lead_timeline_dealer_rw
  on public.lead_timeline
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));
