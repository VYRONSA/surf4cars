-- PCP-001J1 Lead Ecosystem schema
-- Backing store for the dealer enquiry service, which had no database representation.
-- Column set mirrors LocalLeadRecord / LocalLeadTimelineRecord exactly so PCP-001J2 can swap the
-- repository without any change to service behaviour.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id text primary key,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  vehicle_id text not null references public.inventory_vehicles(id) on delete cascade,
  buyer_id text,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  message text not null default 'Interested in this vehicle.',
  -- Duplicate suppression key. The service computes this from dealership + vehicle + buyer
  -- contact + enquiry type + message, and treats a repeat as a duplicate rather than a new lead.
  fingerprint text not null,
  enquiry_type text not null default 'contact'
    check (enquiry_type in ('contact', 'test-drive', 'finance')),
  status text not null default 'new'
    check (status in (
      'new', 'assigned', 'responded', 'follow-up',
      'test-drive-scheduled', 'finance-in-progress', 'closed-won', 'closed-lost'
    )),
  assigned_to_user_id text,
  assigned_to_name text,
  assigned_at timestamptz,
  responded_at timestamptz,
  responded_by text,
  follow_up_at timestamptz,
  closed_at timestamptz,
  resolution text check (resolution in ('won', 'lost')),
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- Enforces at the database what the service enforces in code: one lead per fingerprint
  -- per dealership.
  unique (dealership_id, fingerprint)
);

create table if not exists public.lead_timeline (
  id text primary key,
  lead_id text not null references public.leads(id) on delete cascade,
  dealership_id text not null references public.dealerships(id) on delete cascade,
  type text not null,
  message text not null,
  actor_id text,
  actor_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_dealership on public.leads(dealership_id);
create index if not exists idx_leads_vehicle on public.leads(vehicle_id);
create index if not exists idx_leads_buyer on public.leads(buyer_id);
create index if not exists idx_leads_status on public.leads(dealership_id, status);
-- The dealer queue is ordered by most-recently-updated.
create index if not exists idx_leads_last_updated on public.leads(dealership_id, last_updated_at desc);
create index if not exists idx_lead_timeline_lead on public.lead_timeline(lead_id, created_at);

alter table public.leads enable row level security;
alter table public.lead_timeline enable row level security;

-- Dealer access: the owning dealership manages its own leads.
drop policy if exists leads_dealer_rw on public.leads;

create policy leads_dealer_rw
  on public.leads
  for all
  using (
    exists (
      select 1
      from public.dealerships d
      where d.id = dealership_id
        and d.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.dealerships d
      where d.id = dealership_id
        and d.owner_user_id = auth.uid()
    )
  );

-- Buyer access: a signed-in buyer may read their own enquiries (listBuyerEnquiries), never write.
drop policy if exists leads_buyer_read on public.leads;

create policy leads_buyer_read
  on public.leads
  for select
  using (buyer_id is not null and buyer_id = coalesce(auth.uid()::text, ''));

drop policy if exists lead_timeline_dealer_rw on public.lead_timeline;

create policy lead_timeline_dealer_rw
  on public.lead_timeline
  for all
  using (
    exists (
      select 1
      from public.dealerships d
      where d.id = dealership_id
        and d.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.dealerships d
      where d.id = dealership_id
        and d.owner_user_id = auth.uid()
    )
  );
