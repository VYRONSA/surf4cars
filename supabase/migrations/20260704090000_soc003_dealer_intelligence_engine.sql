-- SOC-003 Dealer Intelligence Engine schema
-- Internal operations knowledge base scaffolding only (no crawling or external integrations).

create table if not exists public.dealer_intelligence_reviews (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  queue_status text not null check (queue_status in ('new', 'under-review', 'verified', 'rejected', 'duplicate', 'archived')),
  verification_status text not null check (verification_status in ('verified', 'needs-review', 'pending', 'rejected', 'duplicate')),
  internal_notes text,
  operations_owner text not null,
  last_reviewed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (dealership_id)
);

create table if not exists public.dealer_intelligence_activity (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  action text not null,
  source text not null default 'operations-centre',
  actor_type text not null default 'system',
  actor_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_dealer_intel_reviews_dealership
  on public.dealer_intelligence_reviews(dealership_id, last_reviewed_at desc);

create index if not exists idx_dealer_intel_reviews_queue
  on public.dealer_intelligence_reviews(queue_status, verification_status, updated_at desc);

create index if not exists idx_dealer_intel_activity_dealership
  on public.dealer_intelligence_activity(dealership_id, created_at desc);

alter table public.dealer_intelligence_reviews enable row level security;
alter table public.dealer_intelligence_activity enable row level security;

drop policy if exists dealer_intelligence_reviews_operations_rw on public.dealer_intelligence_reviews;

create policy dealer_intelligence_reviews_operations_rw
  on public.dealer_intelligence_reviews
  for all
  using (
    coalesce(current_setting('request.jwt.claim.role', true), '') in (
      'platform-owner',
      'operations-director',
      'dealer-success',
      'marketplace',
      'support',
      'moderation'
    )
  )
  with check (
    coalesce(current_setting('request.jwt.claim.role', true), '') in (
      'platform-owner',
      'operations-director',
      'dealer-success',
      'marketplace',
      'support',
      'moderation'
    )
  );

drop policy if exists dealer_intelligence_activity_operations_rw on public.dealer_intelligence_activity;

create policy dealer_intelligence_activity_operations_rw
  on public.dealer_intelligence_activity
  for all
  using (
    coalesce(current_setting('request.jwt.claim.role', true), '') in (
      'platform-owner',
      'operations-director',
      'dealer-success',
      'marketplace',
      'support',
      'moderation'
    )
  )
  with check (
    coalesce(current_setting('request.jwt.claim.role', true), '') in (
      'platform-owner',
      'operations-director',
      'dealer-success',
      'marketplace',
      'support',
      'moderation'
    )
  );
