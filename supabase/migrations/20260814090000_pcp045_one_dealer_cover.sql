-- PCP-045 — one spelling of "dealership cover", and the reason recorded in the data.
--
--
-- WHAT WENT WRONG
-- ===============
-- PCP-043 added `dealerships.cover_image_url` for the Dealer Spotlight. `dealerships.cover_data_url`
-- already existed, populated on all 128 rows, and is what the dealer profile page reads. Two columns
-- for one idea, added by somebody who did not look — which is the failure this codebase has now paid
-- for three times: two spellings of `onboarding_status` hid fifty dealerships, two copies of the slug
-- builder produced seventy-six dead links, and this would have been the spotlight and the profile
-- page disagreeing about whether a dealership has a cover photograph.
--
-- It was caught building the Founder Dashboard, because a dashboard has to ask "how many dealerships
-- are missing a cover" and there were two possible answers. That is the value of one number in one
-- place: it forces the question.
--
-- `cover_image_url` is dropped. Nothing populated it and nothing read it but the spotlight.
--
--
-- WHY THE PROVENANCE COLUMN SURVIVES
-- ==================================
-- Because it is the part that was genuinely missing. Every one of the 128 `cover_data_url` values
-- points at the same shared file, `/images/dealers/dealer-profile-hero.webp`, and the dealer profile
-- handles that with `genuineCover()` — a function that compares against a hardcoded list of known
-- placeholder paths and returns null.
--
-- That is behaviourally right and structurally the exact pattern AGENTS.md names: *when something
-- cannot be published, record the reason in the data model rather than in an `if` statement.* A
-- hardcoded list is invisible to the Founder, uncountable by the dashboard, and silently withholds a
-- real dealer's genuine photograph the day they supply one that happens to sit at a listed path.
--
-- So the reason moves into the row. `demonstration` says what these 128 are; a dealership that
-- uploads its own gets `dealer`, and the read paths publish on provenance rather than on a filename.

alter table dealerships drop column if exists cover_image_url;

-- Backfill: every row currently pointing at the shared library frame is demonstration data, and says
-- so. Written as a match on the known placeholder rather than "everything with a cover", so a row
-- that already carries a genuine photograph is left alone.
update dealerships
   set cover_image_provenance = 'demonstration'
 where cover_image_provenance is null
   and cover_data_url in (
     '/images/dealers/dealer-profile-hero.webp',
     '/images/dealers/join-dealer-hero.webp'
   );

comment on column dealerships.cover_data_url is
  'The dealership cover photograph. Publishable only where cover_image_provenance is dealer or surf4cars-verified.';
comment on column dealerships.cover_image_provenance is
  'Who supplied the cover. NULL means nobody has said, which is not the same as the dealer supplying it.';
