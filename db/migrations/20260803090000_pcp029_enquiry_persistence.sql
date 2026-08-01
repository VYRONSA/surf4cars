-- PCP-029 — Enquiry persistence.
--
-- WHAT WAS WRONG
-- ==============
-- `leads` has existed since PCP-001J with the right shape, and the enquiry path never moved onto it.
-- `createDealerEnquiry` wrote to `db/local/platform-store.json` through `updatePlatformStore()` — a
-- file on the server's working tree. On a serverless host that filesystem is read-only or ephemeral,
-- so a real enquiry is lost, and the buyer is shown "Enquiry sent to the dealer" regardless.
--
-- An enquiry is the entire purpose of the marketplace. Everything else on the platform exists to
-- produce one.
--
--
-- TWO COLUMNS, AND WHY EACH IS NOT OPTIONAL
-- =========================================
-- `reference` is what a person says on the telephone. "Did you get my enquiry?" is unanswerable
-- against a uuid, and it is the first thing a dealership asks a buyer who calls to follow up. It is
-- generated in application code rather than by a default so the value is known before the insert and
-- can be shown to the buyer on the same screen — a reference the customer never sees is a column,
-- not a reference.
--
-- `source_page` records where the enquiry began: a vehicle page, a dealer profile, a collection. It
-- is the only way to answer "which surface actually converts", which is the question that decides
-- where editorial effort goes next. Captured now because it cannot be reconstructed later.
--
--
-- WHY NO NOTIFICATION TABLE YET
-- =============================
-- The brief asks the architecture to be *prepared* for dealer notifications, email delivery, CRM and
-- analytics — not for those to be built. `lead_timeline` already models "something happened to this
-- lead" and is the correct place for a delivery attempt to be recorded. Adding an empty
-- notifications table before a sender exists would be scaffolding, and this codebase has spent four
-- programmes removing scaffolding.

alter table leads add column if not exists reference text;
alter table leads add column if not exists source_page text;

-- Unique, but nullable: the 300 seeded rows predate references and must not be back-filled with
-- invented ones. A partial index enforces uniqueness only where a reference exists.
create unique index if not exists leads_reference_key on leads (reference) where reference is not null;

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_dealership_status_idx on leads (dealership_id, status);
