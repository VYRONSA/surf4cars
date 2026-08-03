-- PCP-044 — the Founder approval workspace.
--
--
-- WHY A VEHICLE-LEVEL RECORD WHEN PHOTOGRAPHS ALREADY HAVE ONE
-- ===========================================================
-- `media_reviews` answers "may this frame be shown". It cannot answer "has this vehicle been looked
-- at", and those come apart in the case that matters: a vehicle whose every photograph was rejected
-- has four decisions recorded and no way to distinguish "reviewed, nothing usable" from "half
-- reviewed, ran out of time". A queue that cannot tell those apart is one somebody stops trusting.
--
-- So the workspace records the visit as well as the verdicts. `reviewed_at` is what moves a vehicle
-- out of the queue; the photograph states are what the marketplace reads.
--
--
-- WHY THE NOTE LIVES HERE AND NOT ON EACH FRAME
-- ============================================
-- Because it is usually about the car rather than about one photograph — "every frame is the
-- pre-facelift car", "dealer has been asked for their own set". Copying that sentence onto four
-- rows would make it look like four independent observations, and editing it later would leave
-- three stale copies. Per-photograph reasons still live on `media_reviews.note`, where they belong.

create table if not exists vehicle_reviews (
  -- `inventory_vehicles.id`, held as text for the same reason `editorial_placements` does: this
  -- table outlives the rows it refers to, and a sold vehicle must not delete the record that it was
  -- reviewed. The read path resolves and drops what no longer exists.
  vehicle_id    text primary key,
  note          text,
  reviewed_by   uuid,
  reviewed_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists vehicle_reviews_reviewed_idx on vehicle_reviews (reviewed_at desc);

-- Staff only. This is a working queue, and a half-finished review of somebody's listing is not
-- something to publish. RLS with no select policy denies every role but the owner and the service
-- key, which is the intent — the same posture as `media_integrity_flags`.
alter table vehicle_reviews enable row level security;
