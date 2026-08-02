-- PCP-039 — close the dealership enumeration exposure, at the level it actually lives.
--
-- WHAT PCP-038 GOT WRONG
-- ======================
-- PCP-038 recorded this as "M1", diagnosed it as a table-ownership problem, and proposed a
-- CREATE POLICY statement to be run by the `postgres` owner. The diagnosis and the fix were both
-- wrong, for one reason:
--
--   `public.dealership_field_provenance` is a VIEW, not a table.
--
-- Postgres rejects CREATE POLICY on a view and rejects ALTER TABLE ... ENABLE ROW LEVEL SECURITY on
-- one — exactly the two failures PCP-038 observed. A control statement succeeding on a different
-- object looked like proof of an ownership difference. It was proof of an object-kind difference.
--
-- WHAT PCP-038 GOT RIGHT
-- ======================
-- The exposure. Measured again immediately before this migration: an anonymous caller read 640 rows
-- and 128 distinct dealership ids, 85 of them dealerships the marketplace does not show.
--
-- AND WHERE IT ACTUALLY LIVES
-- ===========================
-- Revoking the view alone is theatre: `verification_claims`, the base table, returns the same 640
-- rows to `anon` with `subject_kind = 'dealer'` and the same 128 ids. Its policy is
-- `for select using (true)`. Closing the view and stopping would have moved the leak, not removed it.
--
-- A view also does not inherit the base table's row-level security unless it is declared
-- `security_invoker`; by default it runs with its owner's privileges. So both halves are needed:
-- make the view ask on the caller's behalf, and give the base table a policy worth asking.
--
-- WHY NOT SIMPLY REVOKE FROM anon
-- ===============================
-- Tried, and undone below. `loadPublishableFields` in the public dealer profile reads this view
-- through `createSupabaseServerClient()` with no token — which is the anon key. Revoking made that
-- read fail, and it fails *closed*: provenance unknown means nothing is publishable, so the page
-- would suppress a dealer's genuine telephone number and website the day one is supplied. The
-- suppression is invisible today only because 0 of 128 dealerships have supplied any.

/* 1. Undo the blunt revoke — the public dealer profile legitimately reads this view as anon. */
grant select on public.dealership_field_provenance to anon;

/* 2. Make the view apply the caller's own permissions rather than its owner's, so the policy below
      actually governs what an anonymous caller sees through it. */
alter view public.dealership_field_provenance set (security_invoker = true);

/* 3. Scope the base table. A claim about a dealership is readable only when that dealership is
      readable — which `dealerships_public_read` already decides, so there is no second copy of the
      marketplace-visibility rule to keep in step. Claims about anything else are unaffected. */
drop policy if exists verification_claims_read on public.verification_claims;

create policy verification_claims_read
  on public.verification_claims
  for select
  using (
    subject_kind <> 'dealer'
    or exists (
      select 1
      from public.dealerships d
      where d.id = verification_claims.subject_id
    )
  );
