-- PCP-039 — the control that proved M1 is an ownership problem, not a syntax one.
--
-- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `COMMENT ON TABLE` both fail on
-- `public.dealership_field_provenance` under the role `supabase db push` uses. Both require table
-- ownership. This statement is the control: the identical statement against a table created by a
-- migration in this same lineage succeeds.
--
-- Two statements failing on one table and succeeding on another isolates the cause to that table's
-- owner, and rules out the policy expression, the CLI, and the connection. M1 therefore cannot be
-- applied from this repository; it needs one statement run by the owner. See
-- docs/reports/pcp038-security-production-audit.md and the launch checklist.
--
-- Kept as a file because it has been applied and deleting it would desynchronise migration history.
comment on table public.dealership_ownership_events is
  'Append-only history of who has controlled a dealership and who could act for it. Evidence, not analytics.';
