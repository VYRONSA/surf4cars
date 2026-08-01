-- PCP-032 — real dealership verification state
--
-- WHAT THIS REPLACES
-- ==================
-- `verified: true`, hardcoded in `vehicle-platform.repository.ts` and `vehicle-record.mapper.ts`,
-- for every dealership on the platform. Every listing card, every vehicle page and every dealer
-- profile carried a "Verified by SURF4CARS" badge, and nobody had verified anything. There was no
-- column to verify *into*.
--
-- A badge nobody can revoke is not a badge. It is a decoration that happens to be shaped like a
-- guarantee, and it transfers the platform's credibility to businesses it has never assessed.
--
-- WHY A STATE MACHINE AND NOT A BOOLEAN
-- =====================================
-- A boolean has two values and verification has six, five of which are not "yes". The difference
-- between "we have not looked at them", "they sent documents last Tuesday" and "we checked and
-- rejected them" is the whole substance of the thing, and a boolean flattens all three into `false`
-- — which is how a column that starts out honest drifts back into being set to `true` by default
-- because `false` looked unfair.
--
--   unknown              nobody has assessed this dealership. The default, and the honest state today
--   pending              verification has been requested and is queued
--   documents_submitted  the dealership has supplied documents; awaiting review
--   verified             SURF4CARS checked and confirmed. The only state that earns a badge
--   rejected             checked and failed
--   expired              was verified; the check has lapsed and is no longer being claimed
--
-- Only `verified` may ever render a badge. Everything else renders nothing at all rather than a
-- negative badge: "Not verified" next to a dealership's name is a claim about them we also cannot
-- defend, and a marketplace that labels businesses it simply has not got to yet is worse than one
-- that stays quiet.

alter table public.dealerships
  add column if not exists verification_status text not null default 'unknown';

alter table public.dealerships
  add column if not exists verification_checked_at timestamptz;

-- Who checked, and what they concluded. A verification with no author is not auditable, and an
-- unauditable verification is the boolean again wearing a longer name.
alter table public.dealerships
  add column if not exists verification_checked_by text;

alter table public.dealerships
  add column if not exists verification_note text;

-- Verified state lapses. Without a date the platform would keep asserting a check made in 2026 for
-- as long as the row exists, which is how `expired` stops being a real state.
alter table public.dealerships
  add column if not exists verification_expires_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dealerships_verification_status_check'
  ) then
    alter table public.dealerships
      add constraint dealerships_verification_status_check
      check (verification_status in (
        'unknown', 'pending', 'documents_submitted', 'verified', 'rejected', 'expired'
      ));
  end if;
end $$;

create index if not exists dealerships_verification_status_idx
  on public.dealerships (verification_status);

comment on column public.dealerships.verification_status is
  'Real verification state. Only ''verified'' may render a badge. Default ''unknown'' — nobody has been assessed.';

-- Deliberately no backfill.
--
-- Every existing row keeps the default `unknown`, which is the true state: 128 dealerships, none
-- assessed. Backfilling `verified` to preserve the badges would recreate the exact fabrication this
-- migration exists to remove, and it would do it in a way that looked like data rather than like a
-- hardcoded literal — which is harder to find and easier to trust.
