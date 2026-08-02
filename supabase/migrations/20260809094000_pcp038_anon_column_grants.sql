-- PCP-038 — restrict what an anonymous caller may read, column by column.
--
-- WHY THE PREVIOUS MIGRATION'S REVOKE DID NOTHING
-- ===============================================
-- 20260809090000 issued `revoke select (owner_user_id) on public.dealerships from anon`. It applied
-- without error and changed nothing, and the audit re-probe still read the column.
--
-- Column privileges in Postgres are *additive to* table privileges, not subtractive from them. `anon`
-- holds a table-wide SELECT on public tables, so revoking a single column leaves the table grant
-- intact and the column readable. The only sequence that works is to remove the table grant and then
-- grant back the exact columns the public is allowed to see.
--
-- That makes this migration the one that has to be right about the public column set, so it is
-- written as an explicit allow-list. A column added to either table in future is *not* public until
-- somebody adds it here — which is the correct default, and the opposite of what was happening.
--
-- WHAT IS BEING WITHHELD, AND WHY
-- ===============================
--   dealerships.owner_user_id           a live auth.users UUID. The marketplace has never needed it.
--   dealerships.verification_note       internal review commentary.
--   dealerships.verification_checked_by the reviewer's account id.
--   dealerships.subscription_package    the dealership's commercial tier with us.
--   inventory_vehicles.lead_count_30d   how many enquiries a rival's listing drew.
--   inventory_vehicles.estimated_days_to_sell   our internal estimate about someone's stock.
--   inventory_vehicles.created_by       an actor identifier.
--
-- Everything else stays public because a customer-facing page renders it. `registration_number`,
-- `vat_number` and `dealer_licence_number` remain readable: they are legally published business
-- identifiers, and the dealer profile displays the licence number. They are all NULL today.
--
-- `authenticated` is deliberately untouched. `verifyDealershipOwnershipWithSupabase` runs
-- `where owner_user_id = $1` on the caller's own session, and a WHERE clause needs SELECT on that
-- column; narrowing `authenticated` would break every dealer ownership check. The residual exposure
-- to a signed-in account is recorded in the report rather than hidden here.

revoke select on public.dealerships from anon;

grant select (
  id,
  business_name,
  trading_name,
  registration_number,
  vat_number,
  dealer_licence_number,
  business_type,
  physical_address,
  province,
  city,
  postal_code,
  gps_latitude,
  gps_longitude,
  telephone,
  whatsapp,
  email,
  website,
  logo_data_url,
  cover_data_url,
  primary_color,
  secondary_color,
  onboarding_status,
  completed_at,
  created_at,
  updated_at,
  is_demonstration,
  verification_status,
  verification_checked_at,
  verification_expires_at
) on public.dealerships to anon;

revoke select on public.inventory_vehicles from anon;

grant select (
  id,
  dealership_id,
  branch_id,
  stock_number,
  vin,
  registration_number,
  title,
  make,
  model,
  year,
  mileage_km,
  asking_price_cents,
  currency,
  lifecycle_status,
  description,
  seo_title,
  seo_description,
  created_at,
  updated_at,
  sold_at,
  archived_at,
  variant,
  colour,
  fuel,
  transmission,
  engine,
  body_type,
  service_history,
  service_history_provenance,
  previous_owners,
  previous_owners_provenance,
  warranty_expires_on,
  warranty_provenance
) on public.inventory_vehicles to anon;
