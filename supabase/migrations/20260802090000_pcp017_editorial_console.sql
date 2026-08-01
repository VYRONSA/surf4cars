-- PCP-017 — The Founder Editorial Console.
--
-- "No code changes should ever again be required to refresh the homepage."
--
--
-- WHY ONE TABLE AND NOT NINE
-- ==========================
-- The brief names eleven editorial surfaces: Featured Homepage, Homepage Hero, Hero Rotation, Editor's
-- Choice, Weekend Escapes, Performance Icons, Luxury Collection, Family Collection, Adventure Collection,
-- Convertible Collection, Collector Collection, Founder's Picks.
--
-- They are one idea. Every one of them is "an ordered, published list of subjects, chosen by a person, shown
-- in a named slot". Modelling them as separate tables would mean a new migration every time the Founder
-- invents a collection — which is the exact thing this console exists to stop. `editorial_slots` names the
-- surfaces, `editorial_placements` fills them, and a new collection is an INSERT.
--
-- The lesson is already recorded twice in this codebase: two spellings of `onboarding_status` hid 50
-- dealerships, and two copies of the slug builder produced 76 dead links. Eleven spellings of "a curated
-- list" would be the third.
--
--
-- WHY SUBJECTS ARE LOOSELY TYPED
-- ==============================
-- `subject_kind` + `subject_id` rather than a foreign key to `inventory_vehicles`. A slot holds vehicles
-- today; the brief also asks for category imagery, dealer spotlight and premium banners, whose subjects are
-- a media URL and a dealership. A vehicle-only foreign key would force a schema change for the second
-- surface, and a nullable-column-per-kind table is the shape that always rots.
--
-- The cost is honest and bounded: a placement can outlive its subject. The read path resolves subjects and
-- drops the ones that no longer exist, so a sold vehicle disappears from the homepage rather than 404ing
-- from it. `editorial_placements_orphaned` reports them so the Founder sees the gap instead of a silent hole.
--
--
-- WHY PUBLISHED IS A COLUMN AND NOT A DELETE
-- ==========================================
-- Unpublishing is the most common editorial action and the one most often regretted. A deleted row loses the
-- ordering, the story and the reason it was chosen; a flag keeps the whole decision recoverable. Draft work
-- is therefore the default: a placement is invisible to the marketplace until somebody publishes it.

create table if not exists editorial_slots (
  key           text primary key,
  title         text not null,
  -- Shown as the section heading on the marketplace. Nullable: a hero slot has no heading.
  headline      text,
  description   text,
  -- 'homepage-hero' | 'homepage-featured' | 'collection' | 'dealer-spotlight'
  kind          text not null,
  -- Order of the sections themselves down the homepage. Rule 6: "homepage ordering".
  position      integer not null default 0,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists editorial_placements (
  id            uuid primary key default gen_random_uuid(),
  slot_key      text not null references editorial_slots (key) on delete cascade,
  -- 'vehicle' | 'dealership' | 'media'
  subject_kind  text not null,
  subject_id    text not null,
  -- Rule 7. 40–80 words, editorial, written by a person. Never generated.
  story         text,
  position      integer not null default 0,
  published     boolean not null default false,
  -- Who chose this, so an editorial decision has an author.
  curated_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- One subject cannot appear twice in one slot; the second row would render as a duplicate card.
  unique (slot_key, subject_kind, subject_id)
);

create index if not exists editorial_placements_slot_idx
  on editorial_placements (slot_key, published, position);

--
-- READ ACCESS
-- ===========
-- The marketplace reads published editorial with the anonymous key, so both tables are readable to anyone
-- for published rows only. Draft curation — the Founder's working state — must not be visible to a visitor
-- who thinks to query the API directly, which is the whole reason `published` is enforced here rather than
-- only in the application's WHERE clause.
--
-- Writes are deliberately not granted to anon or authenticated. The console writes through the service role
-- behind the `/operations` middleware gate; a policy that let any signed-in buyer reorder the homepage would
-- be a worse hole than no console at all.

alter table editorial_slots enable row level security;
alter table editorial_placements enable row level security;

drop policy if exists editorial_slots_public_read on editorial_slots;
create policy editorial_slots_public_read
  on editorial_slots for select
  using (published = true);

drop policy if exists editorial_placements_public_read on editorial_placements;
create policy editorial_placements_public_read
  on editorial_placements for select
  using (
    published = true
    and exists (
      select 1 from editorial_slots s
      where s.key = editorial_placements.slot_key and s.published = true
    )
  );

--
-- SEED: the slots named in the brief.
--
-- Unpublished, and empty. A slot that shipped pre-filled would be the algorithm wearing an editor's byline —
-- the precise failure this console was commissioned to end. The homepage keeps its existing curated fallback
-- until a person publishes something here, and says which of the two it is rendering.
--
insert into editorial_slots (key, title, headline, description, kind, position, published) values
  ('homepage-hero',        'Homepage hero',       null,                    'The photograph on the first screen.',                    'homepage-hero',    0, false),
  ('homepage-featured',    'Featured vehicles',   'This week''s featured vehicles', 'The lead rail. Mix body styles.',               'homepage-featured', 10, false),
  ('editors-choice',       'Editor''s Choice',    'Editor''s Choice',      'Cars worth owning, chosen one at a time.',               'collection',       20, false),
  ('performance-icons',    'Performance Icons',   'Performance icons',     'The ones built to be driven.',                           'collection',       30, false),
  ('luxury-collection',    'Luxury Collection',   'Luxury without shouting', 'Restraint, and what it costs.',                        'collection',       40, false),
  ('adventure-collection', 'Adventure Collection','Built for the long way round', 'Where the tar ends.',                             'collection',       50, false),
  ('weekend-escapes',      'Weekend Escapes',     'Weekend escapes',       'For the drive you take because you want to.',            'collection',       60, false),
  ('family-collection',    'Family Collection',   'Designed for families that travel', 'Room, and the sense to use it.',             'collection',       70, false),
  ('cape-town',            'Cape Town Collection','The Cape collection',   'Cars that suit the pass, the coast and the wind.',       'collection',       80, false),
  ('future-classics',      'Future Classics',     'Future classics',       'Bought now, wanted later.',                              'collection',       90, false),
  ('founders-picks',       'Founder''s Picks',    'Founder''s picks',      'No algorithm involved.',                                 'collection',      100, false),
  ('dealer-spotlight',     'Dealer spotlight',    null,                    'One dealership, presented as a business.',               'dealer-spotlight',110, false)
on conflict (key) do nothing;

--
-- Placements whose subject no longer exists.
--
-- A view rather than a cleanup job: deleting them would silently shrink a rail the Founder believes is full.
-- Reported, then decided.
--
create or replace view editorial_placements_orphaned as
  select p.*
  from editorial_placements p
  where p.subject_kind = 'vehicle'
    and not exists (select 1 from inventory_vehicles v where v.id::text = p.subject_id);
