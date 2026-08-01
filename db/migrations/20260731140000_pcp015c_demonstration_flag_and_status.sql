-- PCP-015C — Demonstration data as a first-class state, and a canonical onboarding status.
--
-- TAGGING RATHER THAN RENAMING
-- ===========================
-- `Cape Motors Final 1782824475665` is an SFC-008 test fixture carrying 22 vehicles — the deepest single
-- inventory on the platform. Renaming it would invent a company, which is the same fabrication this
-- programme has spent two sprints removing, in the opposite direction. Deleting it would silently drop 22
-- listings.
--
-- So it is labelled for what it actually is. `is_demonstration` makes "this record exists to demonstrate the
-- product" representable, which the schema previously could not say — and that gap is precisely why test and
-- seed rows were indistinguishable from real dealerships in every metric the platform produced.
--
-- The flag is not cosmetic. It is the join key for three behaviours:
--   1. production quality metrics exclude these rows, so the trust score describes the real marketplace;
--   2. the Founder Quality Centre lists them explicitly, so they are visible rather than filtered away;
--   3. any demonstration contact detail written in future must be platform-owned (demo@surf4cars.co.za,
--      +27 10 000 0000, demo.surf4cars.co.za) and can never point at a third party.
--
-- ONBOARDING STATUS
-- =================
-- The column was free text and held two spellings of the same state: 'completed' (78) and 'complete' (50).
-- Every consumer in the codebase compares against 'completed', so 50 dealerships were invisible to those
-- checks — silently, because a string comparison that never matches raises nothing. 'completed' is the
-- canonical value; a check constraint now makes a third spelling impossible rather than merely unlikely.
--
-- A check constraint rather than a Postgres enum type: the value set will grow as the dealer lifecycle
-- does, and adding to a constraint is a one-line migration where altering an enum in a transaction is not.
-- The constraint gives the same guarantee at the point that matters — the write.

begin;

-- ── 1. Demonstration data ─────────────────────────────────────────────────────────────────────────────
alter table public.dealerships
  add column if not exists is_demonstration boolean not null default false;

comment on column public.dealerships.is_demonstration is
  'True where the record exists to demonstrate the product rather than to trade. Excluded from production quality metrics and surfaced explicitly in the Founder Quality Centre. Any contact detail on such a row must be platform-owned and must never resolve to a third party.';

create index if not exists dealerships_is_demonstration_idx
  on public.dealerships (is_demonstration)
  where is_demonstration;

-- The two known SFC-008 onboarding-test fixtures.
update public.dealerships
set is_demonstration = true
where id in (
  'dealership-36ab80f2-3057-4831-af89-18ed1403a1bb',
  'dealership-owner-owner-sfc008-1782818327813-capemotors-co-za'
);

-- Any dealership whose business name still carries a raw timestamp is a fixture by construction.
update public.dealerships
set is_demonstration = true
where business_name ~ '\d{10,}';

-- ── 2. Canonical onboarding status ────────────────────────────────────────────────────────────────────
update public.dealerships
set onboarding_status = 'completed'
where onboarding_status = 'complete';

alter table public.dealerships
  drop constraint if exists dealerships_onboarding_status_check;

alter table public.dealerships
  add constraint dealerships_onboarding_status_check
  check (onboarding_status in ('in-progress', 'submitted', 'under-review', 'completed', 'suspended', 'rejected'));

comment on column public.dealerships.onboarding_status is
  'Canonical dealer lifecycle state. ''completed'' — never ''complete''. Constrained rather than free text: the two spellings coexisted for 50 records that every consumer silently failed to match.';

commit;
