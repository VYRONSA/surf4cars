-- PCP-011A Equipment architecture
--
-- The platform could not record what a vehicle is fitted with. `features` was hardcoded to an empty
-- array in the record mapper, so "Features & Equipment" rendered a heading above nothing on all 229
-- published listings, and no amount of UI work could change that. Equipment is now the bottleneck for
-- Vehicle Highlights, equipment search filters, vehicle comparison, dealer self-service editing and any
-- future recommendation work — one model unlocks all of them, which is why it comes before the UI.
--
--
-- WHY TWO TABLES RATHER THAN A JSONB COLUMN
-- =========================================
-- The requirement is that each item is *individually searchable*. A `jsonb` array of strings makes that
-- possible but not good: every query becomes a containment scan, "Apple CarPlay" and "apple carplay" and
-- "CarPlay" become three different facts, and there is nowhere to hang a category or a provenance. A
-- normalised catalogue plus a join table gives exact matching, index support, one canonical label per
-- concept, and a natural place to record how we know.
--
-- equipment_items    the catalogue. One row per distinct thing a car can have.
-- vehicle_equipment  the claim. This vehicle has this item, and here is where that came from.
--
--
-- WHY PROVENANCE LIVES ON THE CLAIM
-- =================================
-- The platform's governing principle is that every customer-facing claim answers "how do you know this?".
-- Equipment is the clearest case: "Adaptive Cruise Control" typed by a dealer and "Adaptive Cruise
-- Control" decoded from a VIN are different levels of confidence about the same car, and a buyer paying
-- for that feature deserves to know which they are looking at. Provenance therefore belongs on the join
-- row, not on the item — the item is a definition, the join is an assertion.

-- ── Catalogue ────────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.equipment_items (
  id uuid primary key default gen_random_uuid(),

  -- Stable machine key. Used in search URLs and filter state, so it must not change when a label is
  -- reworded: 'apple-carplay' survives "Apple CarPlay" becoming "Apple CarPlay®".
  slug text not null unique,

  label text not null,

  -- Fixed vocabulary. Deliberately a constraint rather than a lookup table: these eight are a
  -- presentation grouping for the vehicle page, not a domain that dealers extend.
  category text not null check (category in (
    'safety',
    'driver-assistance',
    'comfort',
    'technology',
    'convenience',
    'exterior',
    'interior',
    'performance'
  )),

  -- Alternate spellings, for matching imported or dealer-typed text onto the canonical item.
  -- "CarPlay", "Apple Car Play" and "apple carplay" should all resolve to one row rather than
  -- creating three near-duplicates that fragment every filter built on top of them.
  synonyms text[] not null default '{}',

  -- Ordering within a category on the vehicle page. Lower sorts first; ties fall back to label.
  display_order integer not null default 100,

  created_at timestamptz not null default now()
);

create index if not exists idx_equipment_items_category
  on public.equipment_items (category, display_order);

-- Synonym matching is an array containment query on import, so it needs GIN rather than btree.
create index if not exists idx_equipment_items_synonyms
  on public.equipment_items using gin (synonyms);

-- ── Claims ───────────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.vehicle_equipment (
  -- `text`, not `uuid`, because `inventory_vehicles.id` is text. The ids look like UUIDs but the column
  -- was declared text in SFC-103, and several rows are not UUIDs at all — dealership and branch ids read
  -- `dealership-owner-<uuid>`. Declaring this uuid failed the foreign key at apply time; matching the
  -- referenced column is the only correct choice, and casting at the join would be worse.
  vehicle_id text not null references public.inventory_vehicles (id) on delete cascade,
  equipment_item_id uuid not null references public.equipment_items (id) on delete restrict,

  -- Denormalised owner, carried so row-level security can be expressed without a join.
  --
  -- This follows `inventory_vehicle_media`, which does the same for the same reason. A policy that joins
  -- back to `dealerships` re-enters that table's own RLS and recurses — the defect PCP-001J2 was written
  -- to fix, and one this table would have reintroduced. `has_dealership_access` is SECURITY DEFINER and
  -- takes the dealership directly, so the column is what makes the policy both correct and cheap.
  dealership_id text not null references public.dealerships (id) on delete cascade,

  -- How we know. Mirrors the ProvenanceKind union rendered to customers, so the label on screen is the
  -- value in the column rather than a mapping somebody has to keep in step.
  --
  --   dealer     the dealership recorded it
  --   verified   SURF4CARS confirmed it against the vehicle or its documentation
  --   imported   decoded from a VIN or a manufacturer specification feed
  provenance text not null default 'dealer'
    check (provenance in ('dealer', 'verified', 'imported')),

  -- Free text for the awkward cases: "fitted after delivery", "confirmed on inspection 12/2026".
  source_note text,

  recorded_at timestamptz not null default now(),

  -- A vehicle either has an item or it does not; asserting it twice is a data error, not a stronger
  -- claim. Upgrading confidence is an update of `provenance`, not a second row.
  primary key (vehicle_id, equipment_item_id)
);

-- The two directions this is read in: "what does this vehicle have" (detail page) and "which vehicles
-- have this" (search filter). The primary key serves the first; this index serves the second.
create index if not exists idx_vehicle_equipment_item
  on public.vehicle_equipment (equipment_item_id);

-- Every write is policy-checked on dealership_id, and the dealer portal lists a dealership's equipment
-- directly, so this predicate is on the hot path for both.
create index if not exists idx_vehicle_equipment_dealership
  on public.vehicle_equipment (dealership_id);

-- ── Vehicle history facts ────────────────────────────────────────────────────────────────────────────
--
-- "Full service history", "one owner" and "balance of warranty" are the highlights buyers look for
-- hardest, and none of them is equipment — they are facts about this particular car's past, not about
-- what is bolted to it. Modelling them as catalogue items would put "One Owner" in a list beside
-- "Leather Seats", and make "how many owners" unanswerable.
--
-- Each carries its own provenance for the same reason equipment does: a dealer's word that a service
-- history is complete is not the same claim as a stamped book someone has checked.

alter table public.inventory_vehicles
  add column if not exists service_history text
    check (service_history is null or service_history in ('full', 'partial', 'none', 'unknown'));

alter table public.inventory_vehicles
  add column if not exists service_history_provenance text
    check (service_history_provenance is null or service_history_provenance in ('dealer', 'verified', 'imported'));

alter table public.inventory_vehicles
  add column if not exists previous_owners smallint
    check (previous_owners is null or previous_owners >= 0);

alter table public.inventory_vehicles
  add column if not exists previous_owners_provenance text
    check (previous_owners_provenance is null or previous_owners_provenance in ('dealer', 'verified', 'imported'));

-- Null means "no warranty recorded", which is not the same as "no warranty" — the empty state on the
-- vehicle page says so rather than implying the car is out of cover.
alter table public.inventory_vehicles
  add column if not exists warranty_expires_on date;

alter table public.inventory_vehicles
  add column if not exists warranty_provenance text
    check (warranty_provenance is null or warranty_provenance in ('dealer', 'verified', 'imported'));

-- ── Row level security ───────────────────────────────────────────────────────────────────────────────
--
-- Equipment is public information about public listings: the marketplace has to read it anonymously, the
-- same as it reads titles and prices. Writes stay with the dealership that owns the vehicle, which is the
-- foundation the dealer portal will build on.

alter table public.equipment_items enable row level security;
alter table public.vehicle_equipment enable row level security;

drop policy if exists equipment_items_public_read on public.equipment_items;
create policy equipment_items_public_read
  on public.equipment_items for select
  using (true);

drop policy if exists vehicle_equipment_public_read on public.vehicle_equipment;
create policy vehicle_equipment_public_read
  on public.vehicle_equipment for select
  using (true);

-- Writes are scoped to the owning dealership, so a dealer can never record equipment against somebody
-- else's stock. Expressed with the same SECURITY DEFINER helper every other dealership-scoped table uses.
drop policy if exists vehicle_equipment_dealer_write on public.vehicle_equipment;
create policy vehicle_equipment_dealer_write
  on public.vehicle_equipment for all
  using (public.has_dealership_access(dealership_id))
  with check (public.has_dealership_access(dealership_id));

-- ── Catalogue seed ───────────────────────────────────────────────────────────────────────────────────
--
-- A starting vocabulary, not an exhaustive one. These are the items South African buyers filter on most,
-- and the set a dealer would expect to tick. It seeds the *catalogue* only — no vehicle is asserted to
-- have any of them, because nothing has been captured yet and inventing that is the one thing this
-- architecture exists to make unnecessary.

insert into public.equipment_items (slug, label, category, synonyms, display_order) values
  ('abs',                    'ABS',                          'safety',            array['anti-lock brakes'],                 10),
  ('airbags-front',          'Front airbags',                'safety',            array['driver airbag','passenger airbag'], 20),
  ('airbags-side',           'Side airbags',                 'safety',            array['curtain airbags'],                  30),
  ('isofix',                 'ISOFIX child seat anchors',    'safety',            array['isofix'],                           40),
  ('tyre-pressure-monitor',  'Tyre pressure monitoring',     'safety',            array['tpms'],                             50),

  ('adaptive-cruise',        'Adaptive cruise control',      'driver-assistance', array['acc','radar cruise'],               10),
  ('lane-keep-assist',       'Lane keep assist',             'driver-assistance', array['lane assist'],                      20),
  ('blind-spot-monitor',     'Blind spot monitoring',        'driver-assistance', array['blind spot'],                       30),
  ('reverse-camera',         'Reverse camera',               'driver-assistance', array['rear camera','backup camera'],      40),
  ('parking-sensors',        'Parking sensors',              'driver-assistance', array['park distance control','pdc'],      50),
  ('360-camera',             '360° camera',                  'driver-assistance', array['surround view'],                    60),

  ('climate-control',        'Climate control',              'comfort',           array['aircon','air conditioning'],        10),
  ('dual-zone-climate',      'Dual-zone climate control',    'comfort',           array['dual zone'],                        20),
  ('heated-seats',           'Heated seats',                 'comfort',           array['seat heating'],                     30),
  ('electric-seats',         'Electrically adjustable seats','comfort',           array['power seats'],                      40),
  ('panoramic-roof',         'Panoramic sunroof',            'comfort',           array['pano roof','sunroof'],              50),

  ('apple-carplay',          'Apple CarPlay',                'technology',        array['carplay','apple car play'],         10),
  ('android-auto',           'Android Auto',                 'technology',        array['android'],                          20),
  ('bluetooth',              'Bluetooth',                    'technology',        array['bt'],                               30),
  ('navigation',             'Satellite navigation',         'technology',        array['sat nav','gps','navigation'],       40),
  ('digital-cluster',        'Digital instrument cluster',   'technology',        array['virtual cockpit'],                  50),
  ('premium-audio',          'Premium sound system',         'technology',        array['harman kardon','bose','burmester'], 60),

  ('keyless-entry',          'Keyless entry',                'convenience',       array['smart key'],                        10),
  ('push-start',             'Push-button start',            'convenience',       array['start stop button'],                20),
  ('electric-tailgate',      'Electric tailgate',            'convenience',       array['power tailgate'],                   30),
  ('cruise-control',         'Cruise control',               'convenience',       array['cruise'],                           40),

  ('alloy-wheels',           'Alloy wheels',                 'exterior',          array['alloys','mags'],                    10),
  ('led-headlights',         'LED headlights',               'exterior',          array['led lights'],                       20),
  ('tow-bar',                'Tow bar',                      'exterior',          array['towbar','tow hitch'],               30),
  ('roof-rails',             'Roof rails',                   'exterior',          array['roof rack'],                        40),

  ('leather-upholstery',     'Leather upholstery',           'interior',          array['leather seats','leather'],          10),
  ('cloth-upholstery',       'Cloth upholstery',             'interior',          array['fabric seats'],                     20),
  ('multifunction-wheel',    'Multifunction steering wheel', 'interior',          array['steering controls'],                30),

  ('four-wheel-drive',       '4x4 / all-wheel drive',        'performance',       array['4wd','awd','4x4','quattro','xdrive'], 10),
  ('diff-lock',              'Differential lock',            'performance',       array['diff lock'],                        20),
  ('drive-modes',            'Selectable drive modes',       'performance',       array['drive select'],                     30),
  ('sport-suspension',       'Sport suspension',             'performance',       array['lowered suspension'],               40)
on conflict (slug) do nothing;
