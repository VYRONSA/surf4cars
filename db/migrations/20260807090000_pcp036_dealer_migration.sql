-- PCP-036 — dealer migration batches
--
-- WHY IMPORT NEEDS ITS OWN TABLES AT ALL
-- ======================================
-- Two of the brief's critical rules cannot be satisfied by writing straight into
-- `inventory_vehicles`:
--
--   "Every import must remain reversible until publication."
--   "Every imported value must retain its source."
--
-- A row written directly into inventory has lost the spreadsheet it came from, the column it came
-- from, and the fact that it arrived in a batch at all. Undo becomes "delete the rows somebody
-- thinks came from that file", and a dealer querying "why does this say 78 000 km" has nothing to
-- point at.
--
-- So an import is a first-class object. The batch records the file; the row records the raw source
-- cells, what they were mapped to, what was decided about them, and which vehicle resulted. The
-- inventory row is the *output* of an import, not the record of it.
--
-- THIS IS A LEDGER, NOT A STAGING AREA
-- ====================================
-- Rows are kept after the import completes. They are how a dealership answers "where did this come
-- from" six months later, and how a support conversation about a bad migration is settled with
-- evidence rather than recollection.

create table if not exists public.vehicle_import_batches (
  id text primary key default gen_random_uuid(),
  dealership_id text not null references public.dealerships (id) on delete cascade,

  -- 'csv' | 'autotrader' | 'carscoza' | 'excel' | a future adapter id. Recorded per batch rather
  -- than inferred later, because the adapter's behaviour is part of what produced these rows.
  source_kind text not null,
  source_name text,

  --   analysing   file read, mapping proposed, nothing written
  --   ready       the dealer has reviewed the plan
  --   importing   rows being written
  --   imported    written as drafts; still fully reversible
  --   published   the dealer published some or all of it; no longer reversible as a batch
  --   reverted    the dealer undid it
  --   failed      the run stopped
  status text not null default 'analysing',

  -- The mapping the dealer accepted, and the columns nothing was done with. The second half matters
  -- as much as the first: "Never silently discard imported data" means an ignored column has to be
  -- visible somewhere after the import, not only during it.
  column_mapping jsonb not null default '{}'::jsonb,
  ignored_columns jsonb not null default '[]'::jsonb,

  total_rows integer not null default 0,
  imported_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  rejected_count integer not null default 0,

  created_by text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint vehicle_import_batches_status_check check (
    status in ('analysing', 'ready', 'importing', 'imported', 'published', 'reverted', 'failed')
  )
);

create index if not exists vehicle_import_batches_dealership_idx
  on public.vehicle_import_batches (dealership_id, created_at desc);

create table if not exists public.vehicle_import_rows (
  id text primary key default gen_random_uuid(),
  batch_id text not null references public.vehicle_import_batches (id) on delete cascade,

  -- The dealer's own line number, 1-based and counting the header as row 1. Every warning this
  -- platform emits has to say "row 47, Mileage" and mean the row the dealer sees in Excel.
  row_number integer not null,

  -- The source cells exactly as they arrived, before any interpretation. This is the "retain its
  -- source" rule: whatever the mapper decided, the original is still here to be read.
  raw jsonb not null,
  mapped jsonb,

  --   pending     planned, not yet written
  --   imported    created as a draft
  --   updated     matched an existing vehicle the dealer chose to update
  --   skipped     matched an existing vehicle the dealer chose to keep
  --   rejected    could not be imported; `issues` says why
  decision text not null default 'pending',

  -- The vehicle this row produced or matched. Null for rejected rows.
  vehicle_id text,
  -- Set when a duplicate was detected, whatever the dealer then decided.
  matched_vehicle_id text,

  -- [{ severity, field, message, sourceColumn, value }] — never a bare "Failed".
  issues jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),

  constraint vehicle_import_rows_decision_check check (
    decision in ('pending', 'imported', 'updated', 'skipped', 'rejected')
  ),
  constraint vehicle_import_rows_unique_line unique (batch_id, row_number)
);

create index if not exists vehicle_import_rows_batch_idx
  on public.vehicle_import_rows (batch_id, row_number);

create index if not exists vehicle_import_rows_vehicle_idx
  on public.vehicle_import_rows (vehicle_id)
  where vehicle_id is not null;

alter table public.vehicle_import_batches enable row level security;
alter table public.vehicle_import_rows enable row level security;

-- No policies. A dealer reaches their batches through the authenticated dealer API, which already
-- resolves the dealership from the session; nothing in a browser reads these directly. With RLS on
-- and no policy the tables fail closed if a client-side query is ever added by mistake.

comment on table public.vehicle_import_batches is
  'One dealer import run. Reversible until published. Retains the accepted mapping and the columns that were ignored.';
comment on table public.vehicle_import_rows is
  'One source row, its raw cells, what it mapped to, what was decided, and why. The audit trail for a migration.';
