-- PCP-029 — `leads.id` gets a default.
--
-- The column has always been `not null` with no default, because the only writer was the local JSON
-- store and it generated a uuid in application code. Moving the enquiry path onto Supabase surfaced
-- that immediately: the first real insert failed with 23502, "null value in column id".
--
-- It failed safely — the buyer saw an honest error and a retry path rather than a false confirmation
-- — but a column that requires every writer to remember an identifier is a trap that will be sprung
-- again by the next one. The database can supply it.
--
-- Additive and backfill-free: the 300 existing rows already carry ids.

alter table leads alter column id set default gen_random_uuid();
alter table lead_timeline alter column id set default gen_random_uuid();
