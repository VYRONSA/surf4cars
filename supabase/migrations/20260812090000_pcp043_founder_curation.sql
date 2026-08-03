-- PCP-043 — Founder photography review, and dealership branding.
--
--
-- WHY "NOT REJECTED" HAD TO STOP BEING THE RULE
-- ============================================
-- Until now a photograph reached the homepage by not being on a denylist. That approves by default,
-- and the default is wrong for the one page that speaks for the marketplace: the library holds
-- several hundred reference frames, almost none of which anybody has looked at, so every improvement
-- to merchandising promoted a fresh batch of unreviewed photographs to the cover and the denylist had
-- to chase it. Across two sprints roughly twenty-four frames were examined that way and twenty
-- failed — motor shows, forecourts, foreign street furniture, a fire-service vehicle, a concept car
-- that was never sold.
--
-- This inverts it. A photograph carries an explicit state, and the homepage shows only what a person
-- has affirmatively approved. New inventory can no longer improve or degrade the shop window by
-- arriving; it can only queue for review.
--
--
-- WHY FOUR STATES AND NOT A BOOLEAN
-- =================================
-- Because "may a customer see this" and "may it lead the shop window" are different questions, and
-- collapsing them is what produced the earlier mess. A forecourt photograph of the right car is
-- exactly what a buyer searching that model should see, and exactly what must not be the cover.
--
--   approved_homepage  fit to lead the marketplace. The premium rails show only these.
--   approved_search    a true, usable photograph of the car. Search and detail pages, never the cover.
--   rejected           must not be shown anywhere. Wrong car, unsafe, or embarrassing.
--   needs_review       nobody has looked yet. The default, and never treated as approval.
--
-- `needs_review` is the absence of a row rather than a stored value, so the queue cannot drift out of
-- step with the library: a photograph that exists and has no row is by definition unreviewed.

create table if not exists media_reviews (
  -- The photograph itself. Public path, because that is what every read path already carries.
  photograph    text primary key,
  state         text not null check (state in ('approved_homepage', 'approved_search', 'rejected')),
  -- Why, in the reviewer's words. Required for a rejection: a state nobody explained cannot be argued
  -- with, and every entry that migrated into this table arrived with a written reason.
  note          text,
  -- Who decided. An editorial judgement with no author is an algorithm wearing a byline.
  reviewed_by   uuid,
  reviewed_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists media_reviews_state_idx on media_reviews (state);

--
-- INTEGRITY FLAGS
-- ===============
-- Raised by `photograph-integrity.ts`, not by a person: a photograph shared by listings whose body
-- style or performance derivative disagree cannot be correct for all of them. Stored rather than
-- recomputed at read time so the Founder sees the same queue twice running, and so a flag that has
-- been considered and dismissed stays dismissed.
--
-- Separate from `media_reviews` because they answer different questions. A flag says "these two facts
-- disagree"; a review says "I have looked". A flagged photograph may still be approved — the Ranger
-- fording a river is a fine photograph of a Ranger and a poor one of a Raptor, and which of those
-- matters is a judgement.
create table if not exists media_integrity_flags (
  id            uuid primary key default gen_random_uuid(),
  photograph    text not null,
  -- 'model-mismatch' | 'body-style-conflict' | 'derivative-conflict'
  rule          text not null,
  detail        text not null,
  -- Cleared by a person once considered. Never cleared automatically.
  dismissed     boolean not null default false,
  detected_at   timestamptz not null default now(),
  unique (photograph, rule, detail)
);

create index if not exists media_integrity_flags_open_idx
  on media_integrity_flags (dismissed, photograph);

--
-- DEALERSHIP BRANDING
-- ===================
-- The Dealer Spotlight is now a commercial placement, and it was rendering a SURF4CARS library
-- photograph of a Cape Town showroom behind a named dealership's name. Nobody claimed those were
-- their premises and the layout implied it, which is the failure mode AGENTS.md names: a convincing
-- placeholder gets trusted.
--
-- So a cover is a thing a dealership supplies, and its absence is a state rather than a gap to be
-- filled. `cover_image_provenance` records which — the same shape as the field provenance already
-- used elsewhere, because "we have no cover" and "the dealer gave us this" must never be told apart
-- by looking at whether a string is null.
alter table dealerships
  add column if not exists cover_image_url text,
  add column if not exists cover_image_provenance text
    check (cover_image_provenance in ('dealer', 'surf4cars-verified', 'demonstration')),
  -- Optional. One line, written by the dealership, shown on the spotlight. Never generated.
  add column if not exists promotional_headline text;

--
-- READ ACCESS
-- ===========
-- The marketplace reads review states on every homepage render, so `media_reviews` is publicly
-- readable. There is nothing sensitive in it: the photographs are already public files and the states
-- are editorial decisions about our own shop window.
--
-- Integrity flags are staff-only. They read as accusations about specific dealers' listings, and a
-- half-finished review queue is not something to publish.
--
-- Writes are granted to nobody. Both tables are written through the service role behind the
-- `/operations` gate, exactly as the editorial console already is.
alter table media_reviews enable row level security;
alter table media_integrity_flags enable row level security;

drop policy if exists media_reviews_public_read on media_reviews;
create policy media_reviews_public_read on media_reviews for select using (true);

-- No select policy on media_integrity_flags: RLS with no policy denies every role but the owner and
-- the service key, which is the intent.

--
-- SEED: the judgements already made, with the reasons already written.
-- ====================================================================
-- Every row below was examined one frame at a time during PCP-041A and PCP-042 and the reasoning is
-- recorded in `src/config/media/`. Migrating them here rather than starting empty means the Founder's
-- queue opens with the known-bad already filed, and the review that remains is the affirmative one.
--
-- Note what is *not* seeded: nothing is marked `approved_homepage`. That decision belongs to a person
-- and has not been made, which is the entire point of this migration.
insert into media_reviews (photograph, state, note) values
  -- Must not be shown at all: wrong car, wrong market, or unsafe to publish.
  ('/images/vehicles/library/honda-fit/front.webp', 'rejected', 'A collision on a pedestrian crossing, bystanders inspecting the damage.'),
  ('/images/vehicles/library/hyundai-i20/front.webp', 'rejected', 'A liveried rally car mid-corner in dirt. Not a vehicle anybody can buy.'),
  ('/images/vehicles/library/mercedes-benz-c-class/front.webp', 'rejected', 'A liveried DTM touring car on a circuit.'),
  ('/images/vehicles/library/volvo-xc90/front.webp', 'rejected', 'Grey XC90 parked small in front of a brick shopfront hung with signage.'),
  ('/images/vehicles/library/toyota-hilux/front.webp', 'rejected', 'White bakkie in SECURITY livery against construction scaffolding.'),
  ('/images/vehicles/library/mahindra-pik-up/front.webp', 'rejected', 'Flatbed truck with a livestock cage under a CHICKEN KING sign.'),
  ('/images/vehicles/library/bmw-x1/front.webp', 'rejected', 'Dark X1 against a cluttered shopfront hung with SALE banners.'),
  ('/images/vehicles/library/bmw-x5/front.webp', 'rejected', 'Rear-only press shot of a hydrogen prototype, photographers in frame.'),
  ('/images/vehicles/library/nissan-magnite/front.webp', 'rejected', 'Motor show stand: red Magnite behind a crowd in face masks.'),
  ('/images/vehicles/library/toyota-corolla/front.webp', 'rejected', 'An instrument cluster. A dial is not a car.'),
  ('/images/vehicles/library/toyota-hilux/rear.webp', 'rejected', 'Close-up of a tow-bar mount and exhaust tip. No car visible.'),
  ('/images/vehicles/library/mitsubishi-triton/front.webp', 'rejected', 'Dashboard from the back seat inside a shopping mall, paperwork on the windscreen.'),
  ('/images/vehicles/library/toyota-land-cruiser/front.webp', 'rejected', 'A J100 on a desert dune, twenty-five years older than the listings it led.'),
  ('/images/vehicles/library/toyota-corolla/rear.webp', 'rejected', 'Early-2000s Corolla Altis on gravel with a Thai plate and a bystander.'),
  ('/images/vehicles/library/toyota-hilux/side.webp', 'rejected', '1990s Hilux in Thai government fleet livery at a public event.'),
  ('/images/vehicles/library/toyota-corolla/side.webp', 'rejected', 'A 1970s Corolla coupe on cobblestones, leading a 2026 Corolla.'),

  -- True photographs of the right car, and not covers.
  ('/images/vehicles/library/volvo-xc90/rear.webp', 'approved_search', 'Parking lot, flat overcast light, plate whited out.'),
  ('/images/vehicles/library/bmw-x5/rear.webp', 'approved_search', 'Dealership forecourt with an Approved Used Cars board and a tyre-store van.'),
  ('/images/vehicles/library/porsche-macan/front.webp', 'approved_search', 'Motor show stand, crowd, exhibition signage.'),
  ('/images/vehicles/library/jaguar-f-pace/front.webp', 'approved_search', 'Suburban street kerb, telegraph pole, litter, US dealer plate.'),
  ('/images/vehicles/library/volvo-xc60/front.webp', 'approved_search', 'Forecourt with a MILITARY AUTOSOURCE sign and a third-party plate surround.'),
  ('/images/vehicles/library/hyundai-i20/rear.webp', 'approved_search', 'Motor show hall, crowd, advertising board.'),
  ('/images/vehicles/library/bmw-320i/front.webp', 'approved_search', 'Suburban driveway, another car cut off at the edge, US state plate.'),
  ('/images/vehicles/library/toyota-fortuner/front.webp', 'approved_search', 'Street kerb; the plate is a dealer advertising board.'),
  ('/images/vehicles/library/bmw-m340i/front.webp', 'approved_search', 'Petrol station forecourt, bollards, bystander, 50% OFF board.'),
  ('/images/vehicles/library/toyota-corolla-cross/front.webp', 'approved_search', 'Industrial yard, shipping container, window sticker, no plate.'),
  ('/images/vehicles/library/mazda-cx-5/front.webp', 'approved_search', 'Motor show stand with a spec board and show flooring.'),
  ('/images/vehicles/library/isuzu-d-max/front.webp', 'approved_search', 'Inside a workshop, bystander, roller door.'),
  ('/images/vehicles/library/peugeot-2008/front.webp', 'approved_search', 'Plate surround advertises a live German dealership, legible at cover width.'),
  ('/images/vehicles/library/audi-q3/front.webp', 'approved_search', 'Forecourt carrying another dealership''s branding on both cars.'),
  ('/images/vehicles/library/audi-q5/front.webp', 'approved_search', 'A fire-service command vehicle with a roof light bar.'),
  ('/images/vehicles/library/bmw-x1/rear.webp', 'approved_search', 'A street in China: foreign plates, traffic, signage inside the windscreen.'),
  ('/images/vehicles/library/mercedes-benz-c-class/rear.webp', 'approved_search', 'Motor show stand; also an estate, leading saloon listings.'),
  ('/images/vehicles/library/lexus-nx/front.webp', 'approved_search', 'The LF-NX concept car on a show stand. Never sold.'),
  ('/images/vehicles/library/bmw-x3/front.webp', 'approved_search', 'Moving traffic, foreign plate, a bus filling the left third.'),
  ('/images/vehicles/library/mercedes-benz-v-class/front.webp', 'approved_search', 'Moving traffic; the occupants are clearly identifiable.'),
  ('/images/vehicles/library/toyota-land-cruiser/rear.webp', 'approved_search', 'Dealership showroom; also the previous generation and the wrong engine.'),
  ('/images/vehicles/library/kia-sportage/front.webp', 'approved_search', 'Brand pop-up stand with a display board where the plate should be.'),
  ('/images/vehicles/library/toyota-prado/front.webp', 'approved_search', 'Street outside shops, advertising boards, bystander; also the three-door.'),
  ('/images/vehicles/library/volkswagen-amarok/front.webp', 'approved_search', 'Dealership forecourt, rows of unregistered stock, no plate fitted.'),
  ('/images/vehicles/library/porsche-macan/rear.webp', 'approved_search', 'Motor show stand; also a Macan S leading a Macan GTS.'),
  ('/images/vehicles/library/bmw-m340i/rear.webp', 'approved_search', 'Wet car park outside a row of shops, restaurant signage, foreign plate.'),
  ('/images/vehicles/library/bmw-x5/side.webp', 'approved_search', 'Inside a dealership showroom, glass partitions, windscreen sticker.')
on conflict (photograph) do nothing;
