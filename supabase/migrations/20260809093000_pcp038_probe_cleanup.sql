-- PCP-038 — reverses the diagnostic probe in 20260809092000. Net effect of the pair is nothing.
drop policy if exists pcp038_probe on public.dealership_ownership_events;
