-- PCP-043 — two competition cars, found on the Founder launch walk.
--
-- Both were leading cards on the homepage at the moment the approval gate landed, and both are
-- factual misrepresentations of the vehicle for sale rather than matters of taste:
--
--   a Hyundai Motorsport WRC car — Shell Helix livery, competition number 7, the crew's names on the
--   glass, gravel tyres — captioned "2019 Hyundai i20 1.0T Fluid" at R95 000;
--
--   a Group 5 BMW 320i turbo on a circuit, Castrol livery, race number 39, roll cage and rear wing,
--   captioned "2019 BMW 320i M Sport".
--
-- They appeared because PCP-042 taught the lead-image chooser to prefer editorial-grade frames,
-- which promoted several vehicles' *third* photograph for the first time. The rally car's front
-- frame had been denied a sprint earlier; nobody had ever looked at its side.
--
-- Recorded here so the decision has a home and a reason, and denied in
-- `src/config/media/vehicle-photography-policy.ts` as well, because that list is the gate the search
-- page applies and these must not be reachable there either.

insert into media_reviews (photograph, state, note) values
  ('/images/vehicles/library/hyundai-i20/side.webp', 'rejected',
   'A Hyundai Motorsport WRC car in Shell Helix livery with competition number 7. Not a road car.'),
  ('/images/vehicles/library/bmw-320i/rear.webp', 'rejected',
   'A Group 5 320i turbo race car on a circuit, Castrol livery, number 39, roll cage and wing.')
on conflict (photograph) do update
  set state = excluded.state,
      note = excluded.note,
      updated_at = now();
