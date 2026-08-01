-- PCP-015D — Photography provenance.
--
-- Every image the marketplace shows a customer must declare where it came from. Until now none of them did,
-- and the consequence was not theoretical: all 1 000 media rows point at `/images/vehicles/library/`, a
-- generic photograph keyed on make and model, and every one of the 229 published listings presented one as
-- though it were the car for sale. A buyer judging colour, trim or condition was judging a different
-- vehicle, with nothing on the page to say so.
--
-- That is the same defect the dealer contact clean-up removed, in a more expensive place. A fabricated
-- website sends someone to the wrong site; a fabricated photograph sells them the wrong car.
--
-- THREE CATEGORIES, AND ONLY THREE
-- ================================
--   dealer         a photograph of the actual vehicle, taken by the dealership. The gold standard, and the
--                  only category that may be presented without qualification.
--   library        a generic image representing the make and model. Legitimate to show, illegitimate to show
--                  silently — the gallery labels it "Illustrative image" in the frame itself, not in fine
--                  print beneath it.
--   manufacturer   press or configurator imagery supplied by the marque. Same labelling obligation.
--
-- Absence is the fourth state and it is deliberately not a value here: a listing with no row renders an
-- honest "Photographs coming soon" placeholder rather than borrowing an image from somewhere.
--
-- The column is `not null` with no default on purpose. A default would let the next importer write rows
-- whose provenance nobody ever decided, which is precisely how 1 000 unlabelled images accumulated. Writing
-- media now requires stating where it came from.

begin;

alter table public.inventory_vehicle_media
  add column if not exists provenance text;

-- Backfill before the constraint: every existing row was verified to point at the library directory.
update public.inventory_vehicle_media
set provenance = 'library'
where provenance is null;

alter table public.inventory_vehicle_media
  alter column provenance set not null;

alter table public.inventory_vehicle_media
  drop constraint if exists inventory_vehicle_media_provenance_check;

alter table public.inventory_vehicle_media
  add constraint inventory_vehicle_media_provenance_check
  check (provenance in ('dealer', 'library', 'manufacturer'));

comment on column public.inventory_vehicle_media.provenance is
  'Where this image came from. ''dealer'' is a photograph of the actual vehicle and is the only category shown without qualification; ''library'' and ''manufacturer'' are illustrative and must be labelled as such in the gallery. No default: writing media requires deciding provenance.';

create index if not exists inventory_vehicle_media_provenance_idx
  on public.inventory_vehicle_media (provenance);

commit;
