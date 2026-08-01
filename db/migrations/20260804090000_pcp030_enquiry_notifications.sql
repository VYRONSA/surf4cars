-- PCP-030 — Enquiry notification delivery
--
-- WHY THIS TABLE EXISTS
-- =====================
-- Before this migration an enquiry was durable and invisible. The lead committed to `leads`, the
-- dealer portal could show it, and nothing told the dealership it had arrived. A dealership that
-- does not log in did not know a buyer was waiting — while the buyer had been told they would be
-- contacted. That is a promise the platform could not keep.
--
-- A send is not a boolean on the lead. It is an attempt with a provider, a destination, a count, a
-- response and a set of timestamps, and every one of those is needed to answer the only two
-- questions that matter after something goes wrong: *did it reach them*, and *can we send it again*.
-- A `notified boolean` answers neither, and cannot be repaired retrospectively.
--
-- SENT IS NOT DELIVERED
-- =====================
-- `sent_at` records the provider accepting the message. `delivered_at` records the provider telling
-- us it reached the mailbox, which only arrives over a webhook. Without that webhook wired, rows
-- stop at `sent` and the Founder card must say "sent", not "delivered". Collapsing the two would
-- produce a dashboard that certifies deliveries nobody observed — the same class of mistake as a
-- fabricated VAT number, and harder to spot because it is a green number rather than a wrong one.

-- Ids are `text` throughout this schema, not `uuid`. `leads.id` is `text primary key` with a
-- `gen_random_uuid()` default, and a `uuid` foreign key here would not match it. Following the
-- existing convention is worth more than the type being nominally tighter in one table.
create table if not exists public.enquiry_notifications (
  id text primary key default gen_random_uuid(),
  lead_id text not null references public.leads (id) on delete cascade,
  dealership_id text not null references public.dealerships (id) on delete cascade,

  channel text not null default 'email',

  -- Which provider handled the attempt, recorded per row rather than read from configuration at
  -- report time. Configuration changes; history should not move when it does.
  provider text not null,
  destination text,
  -- Where the address came from: 'dealership', 'staff', or null when there was none to find. The
  -- difference between "we emailed the wrong person" and "there was nobody to email" is an
  -- onboarding problem, not a delivery problem, and the two need separate fixes.
  destination_source text,

  --   pending        queued, never attempted
  --   retrying       attempted, failed transiently, next_attempt_at is set
  --   sent           the provider accepted it
  --   delivered      the provider confirmed the mailbox received it
  --   failed         permanent; no further attempts will be made
  --   unroutable     no address on record for the dealership; nothing was attempted
  --   not_configured no email provider configured; nothing was attempted
  status text not null default 'pending',

  attempts integer not null default 0,
  max_attempts integer not null default 4,
  next_attempt_at timestamptz,

  last_error text,
  provider_message_id text,
  provider_response jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,

  constraint enquiry_notifications_status_check check (
    status in ('pending', 'retrying', 'sent', 'delivered', 'failed', 'unroutable', 'not_configured')
  )
);

-- One notification per lead per channel.
--
-- This is the duplicate guarantee, and it is a constraint rather than a check in application code
-- because the retry sweeper and a live request can run at the same moment. A dealership receiving
-- the same enquiry twice reads as a broken system; receiving it twice while the buyer is told it
-- was sent once reads as a system nobody can reason about.
create unique index if not exists enquiry_notifications_lead_channel_key
  on public.enquiry_notifications (lead_id, channel);

-- The sweeper's query: everything due, oldest first.
create index if not exists enquiry_notifications_due_idx
  on public.enquiry_notifications (next_attempt_at)
  where status in ('pending', 'retrying');

-- The Founder health card's query.
create index if not exists enquiry_notifications_created_idx
  on public.enquiry_notifications (created_at desc);

create index if not exists enquiry_notifications_status_idx
  on public.enquiry_notifications (status);

alter table public.enquiry_notifications enable row level security;

-- Deliberately no policies.
--
-- Every row holds a dealership's contact address and a provider response. Nothing in the browser
-- needs to read this: the dealer lead centre reads `lead_timeline`, and the Founder card is a
-- server component. With RLS on and no policy, only the service key can reach it — which is the
-- narrowest correct grant, and one that fails closed if a future client-side query is added by
-- mistake.

comment on table public.enquiry_notifications is
  'Delivery attempts for dealer enquiry notifications. Service-role access only. sent_at is provider acceptance; delivered_at requires a provider webhook.';
