-- PCP-037 — a vehicle identifier that was never supplied is NULL, not "".
--
-- WHY THIS BLOCKS THE IMPORTER
-- ============================
-- `vin`, `registration_number` and `stock_number` are `not null`. A dealer's export legitimately
-- carries none of them: plenty of forecourts track stock by their own reference and never record a
-- VIN, and a vehicle that has not been registered has no registration number to give.
--
-- With the constraint in place the importer has exactly three options, and two are wrong:
--
--   1. Write ''. This is the fabrication AGENTS.md is about, one layer down. An empty string is a
--      third state alongside NULL and a real value, indistinguishable from a dealer who supplied a
--      blank, and invisible to every `is not null` check the Quality Centre counts with. The same
--      mistake was already found and fixed on `dealerships`: "a nullable column typed as non-null is
--      a lie the compiler will defend."
--   2. Reject the row. That refuses a legitimate vehicle over a field the buyer never sees, and
--      turns a 250-car migration into a 250-line list of complaints.
--   3. Store NULL and say "Not provided". Correct, and already the platform's stated preference:
--      "NULL is preferred in development *and* in production; 'Not provided' is a finished state,
--      not a gap to be filled."
--
-- WHAT THIS DOES NOT CHANGE
-- =========================
-- `make`, `model` and `year` stay `not null`. They are not identifiers — they are what a listing
-- *is*, a buyer filters on all three, and the import validator already rejects a row missing any of
-- them with an error that names the column. A vehicle with no make is not an under-described
-- vehicle; it is not a vehicle.
--
-- The unique constraint on (dealership_id, stock_number) is unaffected in the way that matters:
-- Postgres does not consider two NULLs equal, so any number of vehicles may have no stock number
-- while two vehicles still cannot share one.

alter table public.inventory_vehicles
  alter column vin drop not null,
  alter column registration_number drop not null,
  alter column stock_number drop not null;

-- Existing rows that carry '' were written under the old constraint and mean "not supplied". Left
-- as '' they would keep reading as a supplied-but-blank identifier for ever, and every consumer
-- would have to know to test both. One representation, decided here.
update public.inventory_vehicles set vin = null where vin = '';
update public.inventory_vehicles set registration_number = null where registration_number = '';
update public.inventory_vehicles set stock_number = null where stock_number = '';

comment on column public.inventory_vehicles.vin is
  'Chassis/VIN as supplied. NULL means not provided — never '''' . Displayed as "Not provided".';
comment on column public.inventory_vehicles.registration_number is
  'Registration as supplied. NULL means not provided — never ''''.';
comment on column public.inventory_vehicles.stock_number is
  'The dealer''s own reference. NULL means not provided. Unique per dealership when present; NULLs do not collide.';
