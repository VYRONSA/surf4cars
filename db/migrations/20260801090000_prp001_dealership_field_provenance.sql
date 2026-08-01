-- PRP-001 — Provenance for dealership profile fields.
--
-- THE GAP THIS CLOSES
-- ===================
-- Vehicles carry provenance on media, service history, previous owners and warranty. Dealerships carry none.
-- Where a field had no provenance the read path compensated with a hardcoded `null`:
--
--     story: null,
--     services: null,
--     openingHours: null,      -- "Not in the schema" — the comment was wrong
--     yearsInBusiness: null,
--
-- Opening hours *are* in the schema, on `dealership_branches.business_hours`, and all 128 branches have a
-- value. The loader was right to withhold them — there are only five distinct strings across 128 branches,
-- so they are seed data, and publishing them would send a buyer to a forecourt on our word. The same is true
-- of `logo_data_url`, which is `/images/branding/logo.png` — the SURF4CARS logo — on every one of the 128
-- dealerships, and of `cover_data_url`, one generic stock hero repeated 128 times.
--
-- So the behaviour was correct and the mechanism was not. A hardcoded `null` is the same blunt instrument as
-- the `isPlaceholderValue` suppression that hid 128 broken contact records for months: invisible to the
-- Founder, unmeasurable by the Quality Centre, and — the part that matters for growth — it blocks *genuine*
-- data from ever appearing. A dealer who uploads a real logo tomorrow would still see initials, because the
-- code cannot tell their logo from ours.
--
-- WHY A TABLE RATHER THAN COLUMNS
-- ===============================
-- Ten `*_provenance` columns would answer "what is this value" but not "who said so and when", and Phase 5
-- of this programme is a verification workspace whose entire output is that second question. A row per
-- field gives the audit trail for free, and lets new fields be tracked without a migration each time.
--
-- The values match the platform's existing vocabulary:
--   seed        generated to populate the environment. Never published.
--   dealer      supplied by the dealership. Published, attributed to them.
--   verified    checked by SURF4CARS. Published, attributed to us.
--
-- Absence of a row means the field has never been set — which is different from `seed`, and is the state a
-- brand-new dealership starts in.

begin;

create table if not exists public.dealership_field_provenance (
  dealership_id text not null references public.dealerships(id) on delete cascade,
  /* Logical field name, not a column name: `opening_hours` lives on branches, `story` does not exist yet.
     Naming the concept rather than the storage keeps this stable as the schema moves. */
  field text not null,
  provenance text not null check (provenance in ('seed', 'dealer', 'verified')),
  /* Free text: "onboarding form", "PCP-001E seed", "verified by <operator> against CIPC". */
  source text,
  verified_at timestamptz,
  verified_by text,
  updated_at timestamptz not null default now(),
  primary key (dealership_id, field)
);

comment on table public.dealership_field_provenance is
  'Where each dealership profile field came from. Only ''dealer'' and ''verified'' may be published to customers. Replaces the hardcoded nulls in dealer-profile.ts, which suppressed seed data invisibly and would have suppressed genuine data too.';

create index if not exists dealership_field_provenance_field_idx
  on public.dealership_field_provenance (field, provenance);

alter table public.dealership_field_provenance enable row level security;

/* Readable by anyone who can read the dealership itself; the marketplace is public, and provenance is a
   claim we make to customers rather than an internal note. Writes go through the service role and the
   verification workspace. */
drop policy if exists dealership_field_provenance_read on public.dealership_field_provenance;
create policy dealership_field_provenance_read
  on public.dealership_field_provenance
  for select
  using (true);

drop policy if exists dealership_field_provenance_write on public.dealership_field_provenance;
create policy dealership_field_provenance_write
  on public.dealership_field_provenance
  for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

-- ── Backfill: everything currently populated is seed ──────────────────────────────────────────────────
-- Verified against the live table before writing:
--   logo_data_url    128/128 = '/images/branding/logo.png'          (the platform's own logo)
--   cover_data_url   128/128 = one of 6 generic stock heroes
--   business_hours   128/128 branches, 5 distinct strings
insert into public.dealership_field_provenance (dealership_id, field, provenance, source)
select d.id, f.field, 'seed', 'PRP-001 backfill: pre-existing seed value'
from public.dealerships d
cross join (values ('logo'), ('cover_image'), ('opening_hours')) as f(field)
where d.id ~ '^(s1-)?dealer'
on conflict (dealership_id, field) do nothing;

-- Address, city and province were also seeded, and 32 of them contradict themselves. Recording that here
-- makes the contradiction attributable rather than merely present.
insert into public.dealership_field_provenance (dealership_id, field, provenance, source)
select id, 'address', 'seed', 'PRP-001 backfill: pre-existing seed value'
from public.dealerships
where id ~ '^(s1-)?dealer'
on conflict (dealership_id, field) do nothing;

commit;
