-- PCP-037 — dealership ownership, invitations and audit.
--
-- THE BLOCKER THIS EXISTS TO REMOVE
-- =================================
-- PCP-036 measured it: 128 of 128 dealerships have a working owner account, and not one of those
-- accounts belongs to the dealership. 76 sit on `example.com` — an IANA-reserved domain that cannot
-- receive mail — and 50 on `surf4cars-demo.co.za`, which is ours. Password reset therefore delivers
-- to us. `owner_user_id` was written once at onboarding completion and nothing anywhere reassigned
-- it, so there was no path, at any price, for a real dealership to take possession of its own record.
--
-- WHY A CLAIM IS REVIEWED AND A TRANSFER IS NOT
-- =============================================
-- These are two different acts and collapsing them would be a security hole.
--
-- A *claim* is an unauthenticated-in-substance assertion: "that business is mine". Nothing in the
-- claimant's session proves it. Self-service claiming would let anybody take over any dealership on
-- the platform, along with its inventory, its leads and its buyers' contact details. So a claim is a
-- request, and a human at SURF4CARS approves it against evidence.
--
-- A *transfer* is performed by the current owner, who is authenticated and already holds the record.
-- It needs no review — but it may only target someone who is already an active staff member of that
-- same dealership. A compromised session can then move ownership only to somebody the dealership
-- itself put on the team, which is a far smaller blast radius than "any email address".
--
-- INVITATION TOKENS ARE STORED HASHED
-- ===================================
-- An invitation link is a bearer credential: whoever holds it becomes staff. Storing the raw token
-- would put a working credential in plaintext in the database, readable by every backup, log drain
-- and support query that ever touches this table. Only the SHA-256 digest is stored; the raw token
-- exists in the invitation URL and nowhere else. A lost link is reissued, never recovered.

/* ── Invitations ─────────────────────────────────────────────────────────────────────────────── */

alter table public.dealership_staff_memberships
  add column if not exists invitation_token_hash text,
  add column if not exists invitation_expires_at timestamptz,
  add column if not exists invited_by_user_id uuid references auth.users (id) on delete set null;

-- Looked up on every acceptance, and the digest is the only thing the acceptor's token can be
-- matched against.
create unique index if not exists dealership_staff_invitation_token_idx
  on public.dealership_staff_memberships (invitation_token_hash)
  where invitation_token_hash is not null;

comment on column public.dealership_staff_memberships.invitation_token_hash is
  'SHA-256 of the invitation token. The raw token is in the emailed link and is never stored. Cleared on acceptance so a used link cannot be replayed.';

/* ── Ownership claims ────────────────────────────────────────────────────────────────────────── */

create table if not exists public.dealership_ownership_claims (
  id text primary key default gen_random_uuid(),
  dealership_id text not null references public.dealerships (id) on delete cascade,

  -- The signed-in user asking to take possession. Not the email on the record — the account that
  -- will hold the dealership if this is approved.
  claimant_user_id uuid not null references auth.users (id) on delete cascade,
  claimant_email text not null,
  claimant_name text not null,

  -- What the claimant offers as proof they are who they say. Free text plus whatever they upload;
  -- deliberately not a fixed schema, because the evidence a dealer principal can produce varies and
  -- a rigid form would reject legitimate claims.
  claimant_role text,
  evidence_note text,

  status text not null default 'pending',

  reviewed_by_user_id uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  -- Required on rejection. A refused claim that does not say why generates a support conversation
  -- nobody can settle.
  decision_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint dealership_ownership_claims_status_check check (
    status in ('pending', 'approved', 'rejected', 'withdrawn')
  )
);

-- One live claim per user per dealership. Without this, a refresh or a double-click files a second
-- request and the reviewer sees the same claim twice with no way to tell which is current.
create unique index if not exists dealership_ownership_claims_pending_idx
  on public.dealership_ownership_claims (dealership_id, claimant_user_id)
  where status = 'pending';

create index if not exists dealership_ownership_claims_queue_idx
  on public.dealership_ownership_claims (status, created_at);

/* ── Ownership and team audit ────────────────────────────────────────────────────────────────── */

-- Append-only. Every change to who controls a dealership, and every change to who can act on its
-- behalf, lands here — including the ones performed by platform staff.
--
-- This is separate from `market_analytics_events`, which the team service currently writes to. That
-- table is analytics: it is aggregated, it is not authoritative, and nobody would defend it in a
-- dispute. Ownership needs a record whose purpose is evidence.
create table if not exists public.dealership_ownership_events (
  id text primary key default gen_random_uuid(),
  dealership_id text not null references public.dealerships (id) on delete cascade,

  --   claim-submitted | claim-approved | claim-rejected | claim-withdrawn
  --   ownership-transferred
  --   staff-invited | staff-invitation-accepted | staff-invitation-revoked
  --   staff-role-changed | staff-removed | staff-reinstated
  event_type text not null,

  -- Who performed it. Null only for platform-automated events, which must then say so in `detail`.
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_email text,

  -- Who or what it was performed on.
  subject_user_id uuid references auth.users (id) on delete set null,
  subject_email text,
  membership_id text,

  -- Ownership moves record both ends, so "who held this in March" is answerable without replaying
  -- the whole log.
  previous_owner_user_id uuid references auth.users (id) on delete set null,
  new_owner_user_id uuid references auth.users (id) on delete set null,

  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dealership_ownership_events_dealership_idx
  on public.dealership_ownership_events (dealership_id, created_at desc);

/* ── Row level security ──────────────────────────────────────────────────────────────────────── */

alter table public.dealership_ownership_claims enable row level security;
alter table public.dealership_ownership_events enable row level security;

-- No policies, deliberately, matching the import ledger. Both tables are reached only through the
-- authenticated dealer and operations APIs, which resolve the dealership from the session before
-- reading. With RLS enabled and no policy they fail closed if a browser-side query is ever added by
-- mistake — which is the failure mode worth designing for, because it is silent.

comment on table public.dealership_ownership_claims is
  'A request by a signed-in user to take possession of an existing dealership. Reviewed by platform staff; never self-service.';
comment on table public.dealership_ownership_events is
  'Append-only history of who has controlled a dealership and who could act for it. Evidence, not analytics.';
