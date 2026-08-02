-- PCP-038 — diagnostic probe, immediately reversed by 20260809093000.
--
-- Kept because it has been applied and removing it would desynchronise the migration history.
--
-- The audit needed to know why CREATE POLICY was failing on `dealership_field_provenance` and
-- nowhere else. This proved the statement succeeds on a table created by a migration in the same
-- lineage, which isolated the cause to that one table's ownership rather than to the policy
-- expression. The finding is written up in docs/reports/pcp038-security-production-audit.md.
create policy pcp038_probe on public.dealership_ownership_events for select using (true);
