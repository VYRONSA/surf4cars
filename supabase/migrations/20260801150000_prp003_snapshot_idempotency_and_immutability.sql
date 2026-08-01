-- PRP-003 — Automated history: idempotency, versioning, immutability.
--
-- IDEMPOTENCY AND IMMUTABILITY LOOKED CONTRADICTORY
-- ================================================
-- The brief asks for scheduled capture that is *idempotent*, and separately that snapshots are *immutable*
-- and never updated. Taken literally those pull apart: the usual way to make a writer idempotent is upsert,
-- and upsert is an update.
--
-- They reconcile once the identity of a snapshot is the *period* it describes rather than the instant it was
-- taken. Then idempotency is insert-if-absent: a second run for the same period does nothing at all. Nothing
-- is updated, and a scheduler retry, a duplicated worker, or a nervous operator running the script twice all
-- converge on one row.
--
-- The current table shows why this matters. It holds two runs 29 seconds apart with identical values, both
-- claiming to describe "the marketplace". Any delta computed across them is arithmetic on the same moment
-- counted twice — and a daily scheduler with a retry would have produced that shape routinely.
--
-- The redundant run is removed below, before immutability is enforced. It is a duplicate observation of a
-- single period created while testing capture, and a duplicate is noise rather than evidence. This is the
-- only deletion this table will ever accept: after the triggers below exist, history cannot be altered by
-- anything, including a future migration, without explicitly dropping them.
--
-- VERSIONING — "THE MARKETPLACE IMPROVED" vs "THE SCORING CHANGED"
-- ===============================================================
-- `rule_set_fingerprint` already distinguishes a rules change from a marketplace change. `app_version` and
-- `git_commit` answer the harder follow-up: *which deployment* changed behaviour. A rules hash tells you the
-- scoring moved; the commit tells you what else shipped that day, which is usually the actual explanation.
--
-- All three are recorded, never derived later. A snapshot that cannot say what produced it is a number
-- without a witness.

begin;

-- ── 1. Remove the duplicate-period run (see above) ────────────────────────────────────────────────────
delete from public.quality_snapshot_runs a
where exists (
  select 1
  from public.quality_snapshot_runs b
  where date_trunc('day', b.captured_at) = date_trunc('day', a.captured_at)
    and b.captured_at < a.captured_at
);

-- ── 2. Period identity ────────────────────────────────────────────────────────────────────────────────
alter table public.quality_snapshot_runs
  add column if not exists period text not null default 'daily',
  add column if not exists period_key text,
  add column if not exists app_version text,
  add column if not exists git_commit text;

update public.quality_snapshot_runs
set period_key = to_char(captured_at at time zone 'UTC', 'YYYY-MM-DD')
where period_key is null;

alter table public.quality_snapshot_runs
  alter column period_key set not null;

alter table public.quality_snapshot_runs
  drop constraint if exists quality_snapshot_runs_period_check;
alter table public.quality_snapshot_runs
  add constraint quality_snapshot_runs_period_check check (period in ('hourly', 'daily', 'weekly'));

/* The idempotency key. `insert … on conflict do nothing` against this is the whole mechanism. */
create unique index if not exists quality_snapshot_runs_period_unique
  on public.quality_snapshot_runs (period, period_key);

comment on column public.quality_snapshot_runs.period_key is
  'The period this snapshot describes (e.g. 2026-07-31), not the instant it was taken. Identity is the period, which is what makes scheduled capture idempotent without any update ever occurring.';
comment on column public.quality_snapshot_runs.git_commit is
  'Commit that produced this snapshot. The rules fingerprint says the scoring changed; the commit says what else shipped, which is usually the real explanation for a movement.';

-- ── 3. Immutability, enforced rather than agreed ──────────────────────────────────────────────────────
-- "Snapshots are immutable" as a convention lasts until the first person with a good reason. As a trigger it
-- lasts until somebody drops the trigger, which is a deliberate, reviewable act rather than an afternoon's
-- expedient fix. Operational history is evidence; evidence that can be edited is not evidence.
create or replace function public.reject_history_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'quality history is immutable: % on % is not permitted. Corrections belong in a new snapshot.',
    tg_op, tg_table_name
    using hint = 'Capture a new run rather than altering a recorded one.';
end;
$$;

drop trigger if exists quality_snapshot_runs_immutable on public.quality_snapshot_runs;
create trigger quality_snapshot_runs_immutable
  before update or delete on public.quality_snapshot_runs
  for each row execute function public.reject_history_mutation();

drop trigger if exists quality_observations_immutable on public.quality_observations;
create trigger quality_observations_immutable
  before update or delete on public.quality_observations
  for each row execute function public.reject_history_mutation();

commit;
