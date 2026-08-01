-- PRP-004 — Verification framework.
--
-- Deliberately free of Surf4Cars nouns. `subject_kind`, `claim_type` and evidence kinds are free text with
-- per-product registries in application code, so VYRON COST verifies suppliers and Child Compass verifies
-- therapists against this same schema. Naming a table `dealership_claims` would have made the framework a
-- Surf4Cars feature with a reusable-sounding description.
--
--
-- WHY EVENTS ARE THE STORE AND STATE IS THE FOLD
-- ==============================================
-- The brief asks each claim to expose `verified_by`, `verified_at` *and* an audit history. Those requirements
-- fight: if the claim row holds the verification, a re-verification overwrites the previous decision and the
-- audit is gone. The usual patch is a second "audit" table — which is this table, arrived at by accident and
-- kept in sync by hand.
--
-- So the event stream is primary. `verification_claims` carries a materialised current state for the read
-- path, written only by `record_claim_event`, never by application code. The events are the truth; the claim
-- row is a cache of their fold, and the function that appends an event is the only thing permitted to
-- refresh it.
--
--
-- WHY PROVENANCE BECOMES A VIEW
-- =============================
-- `dealership_field_provenance` (PRP-001) already encoded a three-state lifecycle in one column: `seed` is
-- "not a claim at all", `dealer` is "asserted, unverified", `verified` is "checked by us". The lifecycle in
-- this brief is the same axis at higher resolution.
--
-- Keeping both would be two spellings of one truth, which this codebase has paid for twice — 50 dealerships
-- invisible behind `complete` vs `completed`, and 76 dead links behind two slug builders. Neither was wrong
-- on the day it was written; both drifted on the third change.
--
-- The table is therefore migrated into claims and replaced by a view of the same name and shape. Every
-- existing consumer keeps working unchanged, and there is one place where the answer lives.
--
--
-- FAILURE MODE
-- ============
-- `record_claim_event` rejects an illegal transition loudly rather than silently coercing it. A verification
-- system that quietly accepts "verified → draft" produces an audit trail that reads plausibly and is wrong,
-- which is the failure this platform has spent four programmes removing.

begin;

-- ── Claims ────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.verification_claims (
  id text primary key,
  /* Product decides the vocabulary: 'dealer', 'listing', 'supplier', 'employee', 'farm', 'therapist'. */
  subject_kind text not null,
  subject_id text not null,
  /* 'address', 'contact', 'vat_registration', 'vehicle_photographs', … Registered per product in code. */
  claim_type text not null,

  /* ── Materialised fold of the event stream. Written only by record_claim_event. ── */
  state text not null default 'draft'
    check (state in ('draft', 'submitted', 'evidence_received', 'under_review', 'verified', 'rejected', 'expired')),
  /* Human-readable snapshot of what is being asserted, for the queue. Never the source of truth for the
     value itself — that stays on the domain table. */
  asserted_value text,
  submitted_by text,
  submitted_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  /* Set from policy when a claim is verified. A verification with no expiry is a claim about the past
     presented as a claim about the present. */
  expires_at timestamptz,
  /* Reserved for automated and AI-assisted verification. Null means "not expressed", never "certain". */
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (subject_kind, subject_id, claim_type)
);

comment on table public.verification_claims is
  'One customer-facing assertion about one subject. A claim is an identity, not a value: the value lives on the domain table, and this records whether anyone has asserted it and whether we have checked. Current state is a materialised fold of verification_claim_events and must only be written by record_claim_event().';

create index if not exists verification_claims_state_idx on public.verification_claims (state, claim_type);
create index if not exists verification_claims_subject_idx on public.verification_claims (subject_kind, subject_id);
create index if not exists verification_claims_expiry_idx on public.verification_claims (expires_at)
  where expires_at is not null;

-- ── Events: the actual truth, append-only ─────────────────────────────────────────────────────────────
create table if not exists public.verification_claim_events (
  id bigserial primary key,
  claim_id text not null references public.verification_claims(id) on delete cascade,
  /* The state this event moved the claim into. */
  to_state text not null
    check (to_state in ('draft', 'submitted', 'evidence_received', 'under_review', 'verified', 'rejected', 'expired')),
  from_state text,
  /* 'dealer', 'staff', 'system', 'manufacturer-feed', 'automated-check'. Who asserted or decided. */
  actor_kind text not null,
  actor_id text,
  /* How the decision was reached: 'manual-review', 'dealer-confirmation', 'document-check',
     'manufacturer-feed', 'automated-validation'. Recorded because "verified" without a method is a claim
     about a claim. */
  method text,
  note text,
  occurred_at timestamptz not null default now()
);

comment on table public.verification_claim_events is
  'Append-only. Every assertion and every decision, in order. This is the audit history — not a copy of it.';

create index if not exists verification_claim_events_claim_idx
  on public.verification_claim_events (claim_id, occurred_at desc);

-- ── Evidence: attached to the event it supports ───────────────────────────────────────────────────────
-- Evidence belongs to an *assertion*, not to a claim. A dealership that resubmits after rejection supplies
-- new evidence; hanging both sets off the claim would lose which document supported which decision.
create table if not exists public.verification_evidence (
  id text primary key,
  event_id bigint not null references public.verification_claim_events(id) on delete cascade,
  /* 'business-registration', 'vat-certificate', 'utility-bill', 'dealer-photograph', 'manufacturer-feed',
     'vehicle-registration', 'identity-document', 'signed-declaration'. Registered per product. */
  kind text not null,
  /* Storage reference, or a URL for feed-sourced evidence. */
  location text,
  /* Free-form detail: document number, feed run id, checksum. */
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists verification_evidence_event_idx on public.verification_evidence (event_id);

-- ── Immutability ──────────────────────────────────────────────────────────────────────────────────────
-- Same standard as operational history: evidence that can be edited is not evidence.
drop trigger if exists verification_claim_events_immutable on public.verification_claim_events;
create trigger verification_claim_events_immutable
  before update or delete on public.verification_claim_events
  for each row execute function public.reject_history_mutation();

-- ── The only writer ───────────────────────────────────────────────────────────────────────────────────
create or replace function public.record_claim_event(
  p_claim_id text,
  p_to_state text,
  p_actor_kind text,
  p_actor_id text default null,
  p_method text default null,
  p_note text default null,
  p_expires_at timestamptz default null,
  p_confidence numeric default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_state text;
  v_event_id bigint;
  v_legal boolean;
begin
  select state into v_from_state from public.verification_claims where id = p_claim_id for update;
  if not found then
    raise exception 'unknown claim %', p_claim_id;
  end if;

  /* Legal transitions, stated once.
     A verification system that silently accepts an impossible transition produces an audit trail that reads
     plausibly and is wrong — the exact failure mode this platform has spent four programmes removing. */
  v_legal := case v_from_state
    when 'draft'             then p_to_state in ('submitted')
    when 'submitted'         then p_to_state in ('evidence_received', 'under_review', 'verified', 'rejected')
    when 'evidence_received' then p_to_state in ('under_review', 'verified', 'rejected')
    when 'under_review'      then p_to_state in ('verified', 'rejected', 'evidence_received')
    when 'verified'          then p_to_state in ('expired', 'under_review')
    when 'rejected'          then p_to_state in ('submitted', 'under_review')
    when 'expired'           then p_to_state in ('submitted', 'under_review')
    else false
  end;

  if not v_legal then
    raise exception 'illegal verification transition: % -> % for claim %', v_from_state, p_to_state, p_claim_id
      using hint = 'Transitions are defined in record_claim_event. Append a legal event rather than forcing state.';
  end if;

  insert into public.verification_claim_events (claim_id, from_state, to_state, actor_kind, actor_id, method, note)
  values (p_claim_id, v_from_state, p_to_state, p_actor_kind, p_actor_id, p_method, p_note)
  returning id into v_event_id;

  update public.verification_claims
  set state       = p_to_state,
      submitted_by = case when p_to_state = 'submitted' then p_actor_id else submitted_by end,
      submitted_at = case when p_to_state = 'submitted' then now() else submitted_at end,
      reviewed_by  = case when p_to_state in ('verified', 'rejected') then p_actor_id else reviewed_by end,
      reviewed_at  = case when p_to_state in ('verified', 'rejected') then now() else reviewed_at end,
      expires_at   = case when p_to_state = 'verified' then p_expires_at else expires_at end,
      confidence   = coalesce(p_confidence, confidence),
      updated_at   = now()
  where id = p_claim_id;

  return v_event_id;
end;
$$;

comment on function public.record_claim_event is
  'The only supported way to move a claim. Validates the transition, appends the event, and refreshes the materialised state atomically so the fold can never disagree with its events.';

-- ── Migrate dealership_field_provenance into claims ───────────────────────────────────────────────────
insert into public.verification_claims (id, subject_kind, subject_id, claim_type, state, submitted_at, created_at)
select
  'claim-dealer-' || p.dealership_id || '-' || p.field,
  'dealer',
  p.dealership_id,
  p.field,
  case p.provenance
    /* `seed` is not an assertion by anybody. It is the absence of a claim, which is `draft`. */
    when 'seed'     then 'draft'
    when 'dealer'   then 'submitted'
    when 'verified' then 'verified'
    else 'draft'
  end,
  case when p.provenance = 'dealer' then p.updated_at end,
  p.updated_at
from public.dealership_field_provenance p
on conflict (subject_kind, subject_id, claim_type) do nothing;

/* A genesis event per migrated claim, so no claim exists without a stream explaining it. */
insert into public.verification_claim_events (claim_id, from_state, to_state, actor_kind, actor_id, method, note, occurred_at)
select c.id, null, c.state, 'system', 'prp004-migration', 'migration',
       'Migrated from dealership_field_provenance', c.created_at
from public.verification_claims c
where c.subject_kind = 'dealer';

drop table public.dealership_field_provenance;

/* Same name, same columns, one source of truth. Existing readers require no change. */
create view public.dealership_field_provenance as
select
  c.subject_id as dealership_id,
  c.claim_type as field,
  case
    when c.state = 'verified' then 'verified'
    when c.state in ('submitted', 'evidence_received', 'under_review') then 'dealer'
    else 'seed'
  end as provenance,
  c.updated_at
from public.verification_claims c
where c.subject_kind = 'dealer';

comment on view public.dealership_field_provenance is
  'Compatibility projection of verification_claims. Provenance is the claim lifecycle viewed at low resolution, not a separate fact — storing both would let them drift.';

alter table public.verification_claims enable row level security;
alter table public.verification_claim_events enable row level security;
alter table public.verification_evidence enable row level security;

/* Claims are read by the public dealer profile (through the view) to decide what may be published, so
   selects are open; every write goes through record_claim_event under the service role. Evidence is not
   public — it holds identity documents and utility bills. */
drop policy if exists verification_claims_read on public.verification_claims;
create policy verification_claims_read on public.verification_claims for select using (true);

commit;
