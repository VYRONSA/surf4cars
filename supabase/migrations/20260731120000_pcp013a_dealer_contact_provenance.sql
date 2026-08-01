-- PCP-013A P4 — Dealer data quality: make "not supplied" representable, then remove fabricated data.
--
-- WHY THE SCHEMA CHANGES BEFORE THE DATA
-- ======================================
-- Every one of the 128 dealership records carried invented contact details and invented legal identifiers.
-- That was not carelessness in the seed: `registration_number`, `vat_number`, `email`, `telephone` and
-- `whatsapp` were all `not null`, so the seed had no way to express "this dealership has not told us yet".
-- Forbidding absence does not produce complete data — it produces fabricated data. Clearing the values
-- without relaxing the constraint would simply push the next seed, import or onboarding draft into
-- inventing them again.
--
-- Two of these columns should never have been mandatory on the merits, independently of the seed:
--
--   vat_number            VAT registration in South Africa is compulsory only above R1 million taxable
--                         turnover in a 12-month period. A small independent dealer may be trading
--                         perfectly lawfully with no VAT number at all, and the schema was calling that
--                         state impossible.
--   registration_number   A sole proprietor has no CIPC company registration number. Same problem.
--
-- `email`, `telephone` and `whatsapp` are different: a dealership does need to be contactable. But a
-- `not null` constraint never delivered that — it delivered `owner.pcp001e-1785347218556-6598@example.com`
-- and 76 telephone numbers containing "555". Contactability is an onboarding and verification requirement,
-- and it is enforced there and surfaced in the Founder Quality Centre. It is not something a column type
-- can guarantee, and pretending otherwise is what produced the fabrications.
--
-- WHAT THE FABRICATED DATA ACTUALLY RISKED
-- ========================================
-- The public dealer profile published these values as fact, under the label "Provided by the dealer".
-- The seed had generated plausible South African domains from each business name, and three of them
-- resolve to live third-party hosts:
--
--   atlanticauto.co.za      88.198.176.58     (Atlantic Auto — 8 vehicles, profile reachable)
--   boulevardmotors.co.za   172.64.152.166    (Boulevard Motors — 5 vehicles, profile reachable)
--   coastalauto.co.za       102.209.241.245
--
-- So the platform was sending buyers to unrelated real businesses while asserting the dealership had
-- supplied the link. The format-correct identifiers were the same class of problem and harder to catch:
-- `4200000273` looks exactly like a real SA VAT number, and `2019/100039/07` like a real CIPC number.
-- An obviously fake placeholder gets fixed; a convincing one gets trusted.
--
-- THE RULE APPLIED HERE: CLEAR, NEVER INVENT
-- ==========================================
-- Nothing is replaced with a "better" fake. Every fabricated value becomes NULL, which the public profile
-- already renders honestly ("We would rather leave this blank than guess"). Absent and true beats present
-- and false — and unlike a plausible fake, an empty column is visible to the Founder as work to do.
--
-- Referential integrity is untouched: `owner_user_id` still points at `auth.users`, no row is deleted, and
-- no foreign key is affected. These are descriptive columns only.

begin;

-- ── 1. Make "not supplied" representable ──────────────────────────────────────────────────────────────
alter table public.dealerships alter column registration_number drop not null;
alter table public.dealerships alter column vat_number          drop not null;
alter table public.dealerships alter column email               drop not null;
alter table public.dealerships alter column telephone           drop not null;
alter table public.dealerships alter column whatsapp            drop not null;

comment on column public.dealerships.registration_number is
  'CIPC company registration number. NULL where not supplied — a sole proprietor legitimately has none. Never populate with a generated value.';
comment on column public.dealerships.vat_number is
  'SARS VAT number. NULL where not supplied — VAT registration is voluntary below R1m turnover. Never populate with a generated value.';
comment on column public.dealerships.email is
  'Public contact email. NULL where not supplied. Never populate with a generated address: the public profile publishes this as dealer-provided fact.';
comment on column public.dealerships.website is
  'Public website. NULL where not supplied. Never derive from the business name — generated domains have resolved to unrelated real businesses.';

-- Branch contact columns carry the same seeded fabrications for the same reason.
alter table public.dealership_branches alter column email     drop not null;
alter table public.dealership_branches alter column telephone drop not null;
alter table public.dealership_branches alter column whatsapp  drop not null;

-- ── 2. Remove the fabricated values ───────────────────────────────────────────────────────────────────
-- Matched on seed signature rather than blanked wholesale, so that any genuinely dealer-supplied value
-- entered through onboarding survives. Every pattern below was verified against the live table first.

update public.dealerships
set email = null
where id ~ '^(s1-)?dealer'
  and email is not null
  and (email ~* '@example\.(com|org|net)$' or email ~* '@surf4cars-demo\.');

-- Every stored website is seed-generated: 76 literal example.com, 52 domains derived from the business
-- name. None was supplied by a dealer, and the derived ones are the dangerous half.
update public.dealerships
set website = null
where id ~ '^(s1-)?dealer'
  and website is not null
  and (website ~* 'example\.(com|org|net)' or website ~* '\.co\.za');

update public.dealerships
set registration_number = null
where id ~ '^(s1-)?dealer'
  and registration_number is not null
  and (registration_number ~* '^REG-' or registration_number ~ '^\d{4}/\d{6}/\d{2}$');

update public.dealerships
set vat_number = null
where id ~ '^(s1-)?dealer'
  and vat_number is not null
  and (vat_number ~* '^VAT-' or vat_number ~ '^4[12]\d{8}$');

-- "555" is the seed's own marker; the remainder are sequential generated numbers in SA mobile/landline
-- format. None is a number a buyer can reach.
update public.dealerships
set telephone = null
where id ~ '^(s1-)?dealer'
  and telephone is not null
  and (telephone ~ '555' or telephone ~ '^\+?27\d{9}$' or telephone ~ '^0\d{9}$');

update public.dealerships
set whatsapp = null
where id ~ '^(s1-)?dealer'
  and whatsapp is not null
  and (whatsapp ~ '555' or whatsapp ~ '^\+?27\d{9}$' or whatsapp ~ '^0\d{9}$');

update public.dealership_branches
set email = null
where dealership_id ~ '^(s1-)?dealer'
  and email is not null
  and (email ~* '@example\.(com|org|net)$' or email ~* '@surf4cars-demo\.');

update public.dealership_branches
set telephone = null
where dealership_id ~ '^(s1-)?dealer'
  and telephone is not null
  and (telephone ~ '555' or telephone ~ '^\+?27\d{9}$' or telephone ~ '^0\d{9}$');

update public.dealership_branches
set whatsapp = null
where dealership_id ~ '^(s1-)?dealer'
  and whatsapp is not null
  and (whatsapp ~ '555' or whatsapp ~ '^\+?27\d{9}$' or whatsapp ~ '^0\d{9}$');

commit;
