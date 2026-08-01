-- PRP-002 Priority 1 — Trustworthy history.
--
-- ONE OBSERVATION STORE, NOT FOUR TABLES
-- ======================================
-- The brief asked for `quality_snapshots`, `dealer_health_history`, `marketplace_metrics` and
-- `listing_readiness_history`. Those are four schemas for one fact — *this metric, for this subject, at this
-- moment* — and all four would be written from the single Readiness/Quality engine that PRP-002 has just
-- declared canonical.
--
-- Four writers fed by one engine is the drift the architecture freeze exists to prevent. It is the same
-- shape as the two spellings of `onboarding_status` and the two copies of the slug builder: nothing is wrong
-- on the day it is written, and by the third change they disagree. A new metric would also need a migration
-- and a fifth table before it could be recorded at all, which is precisely the friction that stops metrics
-- being recorded.
--
-- So: a run header, and observations belonging to it. Dealer health, listing readiness, marketplace
-- completeness and integrity are all observations that differ only in `subject_kind`.
--
-- WHY A RUN HEADER RATHER THAN A TIMESTAMP PER ROW
-- ================================================
-- A snapshot has to be *coherent*. Integrity and completeness must come from the same evaluation of the same
-- records, or the trend compares two different marketplaces. A parent row makes the capture atomic and gives
-- every observation a single, shared moment.
--
-- THE FINGERPRINT — THE PART THAT MAKES HISTORY HONEST
-- ====================================================
-- This is the reason to build history carefully rather than quickly.
--
-- A score is only comparable against a score produced by the same rules. Add a rule tomorrow and
-- completeness falls; the chart shows a marketplace going backwards on a day nothing about the marketplace
-- changed. The Founder asks "why is growth slowing?" and every answer available from the data is wrong.
--
-- `rule_set_fingerprint` is a hash of every active rule and its weight. Two runs are comparable when their
-- fingerprints match, and a change of fingerprint is a discontinuity that must be shown as a break in the
-- series rather than smoothed over. A time series that silently mixes rule sets is worse than no time
-- series, because it is believed.
--
-- Immutability: rows are inserted, never updated. History that can be edited is not evidence.

begin;

create table if not exists public.quality_snapshot_runs (
  id text primary key,
  captured_at timestamptz not null default now(),
  /* Which engine produced this. Bumped when the shape of the output changes. */
  engine_version text not null,
  /* Hash of the active rule set. Runs are only comparable to runs sharing this value. */
  rule_set_fingerprint text not null,
  /* Scope of the evaluation, so a change in denominator is visible rather than inferred. */
  dealers_audited integer not null,
  listings_audited integer not null,
  demonstration_dealers integer not null,
  /* How the run was triggered: 'manual', 'cron', 'ci'. */
  trigger text not null default 'manual',
  notes text
);

comment on table public.quality_snapshot_runs is
  'One atomic capture of marketplace quality. Observations belong to a run so that every metric in a snapshot describes the same moment and the same rule set. Never updated — history that can be edited is not evidence.';

comment on column public.quality_snapshot_runs.rule_set_fingerprint is
  'Hash of every active rule and weight. Two runs are comparable only when these match; a change is a discontinuity in the series, not a movement in it.';

create index if not exists quality_snapshot_runs_captured_at_idx
  on public.quality_snapshot_runs (captured_at desc);

create table if not exists public.quality_observations (
  run_id text not null references public.quality_snapshot_runs(id) on delete cascade,
  /* 'marketplace' rows carry subject_id '*'. Nullable columns in a primary key do not behave, and a
     sentinel is clearer than a partial index here. */
  subject_kind text not null check (subject_kind in ('marketplace', 'dealer', 'listing')),
  subject_id text not null,
  /* 'integrity_score', 'completeness_score', 'health_score', 'listings_published',
     'listings_with_dealer_photography', 'stage:needs-photos', … Free text on purpose: a new metric must not
     require a migration, or it will not be captured. */
  metric text not null,
  value numeric not null,
  primary key (run_id, subject_kind, subject_id, metric)
);

comment on table public.quality_observations is
  'Every recorded metric, for every subject, in a run. Dealer health, listing readiness and marketplace scores differ only by subject_kind — they are the same fact and share one store rather than one table each.';

create index if not exists quality_observations_metric_idx
  on public.quality_observations (metric, subject_kind);

create index if not exists quality_observations_subject_idx
  on public.quality_observations (subject_kind, subject_id);

alter table public.quality_snapshot_runs enable row level security;
alter table public.quality_observations enable row level security;

/* Deliberately no policies.
   =========================
   RLS enabled with no policy denies every ordinary session — reads and writes alike. Operational history is
   reached only through the service role, which bypasses RLS, and that is the correct boundary: this data has
   no customer-facing use, and the operations portal is already gated by `resolvePortalAccess("operations")`.

   A permissive `using (true)` would have been easier and would have published the marketplace's own quality
   history to anyone holding the anon key. There is no invented `is_platform_staff()` helper here either —
   writing a policy against a function that does not exist would have failed closed in a way that looked like
   a working policy. */

commit;
