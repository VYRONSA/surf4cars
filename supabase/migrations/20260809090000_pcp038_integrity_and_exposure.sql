-- PCP-038 — three things the audit proved, fixed at the level they can be enforced.
--
-- 1. A VEHICLE COULD SIT ON ANOTHER DEALERSHIP'S BRANCH
-- =====================================================
-- `inventory_vehicles` has two independent foreign keys: `dealership_id -> dealerships` and
-- `branch_id -> dealership_branches`. Each is satisfied on its own, and nothing has ever required
-- the branch to belong to the dealership.
--
-- The audit found 10 vehicles listed under one dealership while assigned to a branch owned by
-- another. Eight were published and customer-visible. The consequence is not abstract: a branch
-- carries a telephone number, an email address and an address, so a buyer enquiring about one
-- dealership's car can be shown another dealership's contact details — the precise failure
-- AGENTS.md is about, arriving through a foreign key instead of a seed.
--
-- A composite key makes the pairing checkable, so the database refuses the combination rather than
-- relying on every writer to remember.
--
-- 2. PROVENANCE WAS READABLE BY THE WHOLE INTERNET
-- ================================================
-- `dealership_field_provenance_read` was `using (true)`. Its own comment claims it is "readable by
-- anyone who can read the dealership itself", which is not what `true` means. The table holds one
-- row per dealership field, so it disclosed the id of all 128 dealerships — including the 85 that
-- the marketplace deliberately does not show — letting an anonymous caller enumerate every
-- dealership on the platform, and count them.
--
-- 3. COLUMNS THE PUBLIC NEVER NEEDS
-- =================================
-- RLS is row-level. `dealerships_public_read` correctly limits *which* dealerships anon may read,
-- and then exposes all 33 columns of them — including `owner_user_id`, a live `auth.users` UUID.
-- Column privileges are the only thing that scopes this, so they are set here.
--
-- Revoked from `anon` only, not `authenticated`. A `where owner_user_id = $1` requires SELECT on
-- that column, and `verifyDealershipOwnershipWithSupabase` runs exactly that query on the user's own
-- session; revoking it from `authenticated` would break every dealer ownership check. The residual
-- exposure to a signed-in account is recorded in the report rather than papered over here.

/* ── 1. A branch must belong to the dealership ───────────────────────────────────────────────── */

-- Repair before constraining. Each affected vehicle is moved to a branch of its OWN dealership,
-- preferring the oldest, which is the one onboarding creates first.
update public.inventory_vehicles v
set branch_id = (
  select b.id
  from public.dealership_branches b
  where b.dealership_id = v.dealership_id
  order by b.created_at
  limit 1
)
where exists (
  select 1
  from public.dealership_branches b
  where b.id = v.branch_id
    and b.dealership_id <> v.dealership_id
);

alter table public.dealership_branches
  drop constraint if exists dealership_branches_id_dealership_key;
alter table public.dealership_branches
  add constraint dealership_branches_id_dealership_key unique (id, dealership_id);

alter table public.inventory_vehicles
  drop constraint if exists inventory_vehicles_branch_belongs_to_dealership;
alter table public.inventory_vehicles
  add constraint inventory_vehicles_branch_belongs_to_dealership
  foreign key (branch_id, dealership_id)
  references public.dealership_branches (id, dealership_id)
  on delete cascade;

/* ── 3. Column privileges for anonymous callers ──────────────────────────────────────────────── */

-- A live auth.users id. The public marketplace has never needed it.
revoke select (owner_user_id) on public.dealerships from anon;

-- Internal review commentary and the reviewer's account id.
revoke select (verification_note, verification_checked_by) on public.dealerships from anon;

-- A dealership's commercial tier and onboarding state are ours and theirs, not the public's.
revoke select (subscription_package, onboarding_status) on public.dealerships from anon;

-- Competitive intelligence: how many enquiries a rival's listing drew, and what we estimate about
-- it. `created_by` is an actor identifier.
revoke select (lead_count_30d, estimated_days_to_sell, created_by) on public.inventory_vehicles from anon;

comment on constraint inventory_vehicles_branch_belongs_to_dealership on public.inventory_vehicles is
  'A vehicle''s branch must belong to the vehicle''s dealership. Added by PCP-038 after 10 vehicles were found on another dealership''s branch, 8 of them published.';
