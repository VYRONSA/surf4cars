/**
 * SURF4CARS — editorial photography standards.
 *
 * THE THIRD TIER
 * ==============
 * The platform now answers three different questions about a photograph, and conflating any two of
 * them has already cost us something:
 *
 *   1. May a customer see this frame at all?          `UNPRESENTABLE_VEHICLE_PHOTOGRAPHY`
 *   2. May it lead a card?                            the exterior-only rule in the projection
 *   3. May it lead the shop window?                   this file
 *
 * Tier 2 was carved out of tier 1 because denying an interior photograph to keep it off a card also
 * removed it from the gallery, where it belongs. Tier 3 exists for the same reason one level up: the
 * Volvo XC60's forecourt shot is a perfectly serviceable picture of the right car on a results page,
 * and it is not a photograph anybody would print across a magazine spread.
 *
 * WHAT FAILS
 * ==========
 * The Founder's standard, applied literally. Reject parking lots, dealership forecourts, crowds,
 * traffic, road signs, shop signs, advertising boards, security gates, construction, low light, poor
 * crops, tiny vehicles and background clutter. Accept the whole vehicle, good light, premium
 * composition, clean background, confident stance — the vehicle dominating the frame.
 *
 * Every entry below was looked at, and the note names which reject it trips. That matters because
 * the alternative — a score — is the thing that failed: the media scorer rates all five of the
 * homepage's former featured frames as fine, because sharpness and exposure cannot see a "CAR TYRE
 * STORE" van parked behind a BMW.
 *
 * WHAT THIS DOES NOT DO
 * =====================
 * It does not hide a vehicle. A car whose only frames are non-editorial is still searchable, still
 * counted, still reachable, and still leads its own card and page. It is only kept out of the
 * homepage and the editorial collections — the surfaces that speak for the marketplace rather than
 * list it.
 */

/**
 * Frames that may appear, but must never lead a curated surface.
 *
 * Ordered by where they were caught. Every one of these was leading the homepage's featured grid.
 */
export const NOT_EDITORIAL_GRADE: ReadonlySet<string> = new Set([
  /* Parking lot. Previous-generation XC90 in flat overcast light, parked between two other cars,
     bare winter trees and apartment blocks behind, plate whited out. It was the homepage's lead
     card — the largest photograph on the site. */
  "/images/vehicles/library/volvo-xc90/rear.webp",

  /* Dealership forecourt, and it says so: an "Approved Used Cars Display" board in the window
     behind, a "CAR TYRE STORE" van with a phone number parked alongside, brick, block paving,
     overcast. Shop signs and advertising boards in one frame. */
  "/images/vehicles/library/bmw-x5/rear.webp",

  /* Motor show stand — crowd of people in suits, red carpet, exhibition signage, flat stand
     lighting. The same fault already denied outright on the Magnite and the C-Class, and equally
     wrong here: nobody is selling this car. */
  "/images/vehicles/library/porsche-macan/front.webp",

  /* Suburban street kerb. Telegraph pole, brick balustrade, bare trees, litter at the gutter, a US
     dealer plate, flat grey light. */
  "/images/vehicles/library/jaguar-f-pace/front.webp",

  /* Dealership forecourt again, and the busiest of the five: rows of parked stock either side, a
     "MILITARY AUTOSOURCE" sign, a speed-limit road sign, and a dealer plate surround advertising a
     third-party website across the number plate. */
  "/images/vehicles/library/volvo-xc60/front.webp",

  /* ── Caught on the next pass, after diversification changed which cars led ──────────────────── */

  /* Motor show hall. Crowd, other stands, an "EN WIN EEN FORD FOCUS RS!" advertising board, dark
     exhibition lighting, a white i20 parked a metre behind it. It became the homepage's lead card
     the moment body-style diversity promoted a hatchback. */
  "/images/vehicles/library/hyundai-i20/rear.webp",

  /* Suburban driveway. Another car cut off at the left edge, bare trees, grass verge, flat overcast
     light, US state plate. */
  "/images/vehicles/library/bmw-320i/front.webp",

  /* Street kerb against a timber fence, and the number plate is a dealer advertising board —
     "FORTNR / MILES TOYOTA". Competent reference photograph, not a magazine page. */
  "/images/vehicles/library/toyota-fortuner/front.webp",

  /* A petrol station forecourt: Petron pumps, bollards, a fire extinguisher, a bystander, a "50%
     OFF" board, a pharmacy sign and a red car behind. Trade plate reading "RSA MOTORS". */
  "/images/vehicles/library/bmw-m340i/front.webp",

  /* An industrial yard — chain-link fence, orange shipping container, a skip, wet tarmac, window
     sticker still on the glass, no plate fitted, flat grey light. */
  "/images/vehicles/library/toyota-corolla-cross/front.webp",

  /* ── Applied under the cover test ─────────────────────────────────────────────────────────────
     "Would this vehicle be on the cover? Is this the strongest image available? Does it create
     desire? If not, do not show it on the homepage."

     That instruction resolves a tension recorded above. The earlier note stopped this list at ten
     entries on the reasoning that denying more would empty the shop window and replace it with
     nothing. The Founder has since answered that directly: fewer cards is the preferred outcome. A
     homepage showing three cars worth wanting is stronger than one showing five, two of which were
     photographed at a trade stand. */

  /* A motor show stand. A woman in a cocktail dress and a man on a telephone stand behind the car,
     a spec board on a stanchion beside it, black drape and polished show flooring. It was the lead
     card — the largest photograph on the homepage. */
  "/images/vehicles/library/mazda-cx-5/front.webp",

  /* Inside a workshop. Another vehicle cropped at the frame edge, a bystander in a red shirt, roller
     door and strip lighting. */
  "/images/vehicles/library/isuzu-d-max/front.webp",

  /* A clean press photograph, and still wrong for a cover — the number plate surround advertises
     `www.autoloewen.de`, a live German dealership, and at lead-card width it is plainly legible.

     This frame was reviewed once before and kept, on the judgement that the URL was too small to
     read on a results tile. That was true there and false here: promoting it to the homepage lead
     tripled its width. A photograph is not fit or unfit in the abstract — it is fit at a size, and
     the cover is the one place that has to be re-checked. */
  "/images/vehicles/library/peugeot-2008/front.webp",
]);

/*
  WHY THE LIST KEEPS GROWING, AND WHAT THAT ACTUALLY MEANS
  =======================================================
  Nineteen candidate lead frames have now been examined one at a time against the standard. Eighteen
  failed. The single pass was the Ford Ranger fording a river.

  That ratio is not a photography problem to be fixed by denying more files — it is what the library
  *is*. These are reference photographs: taken to identify a model, record a trim and show a plate,
  in whatever light there was, wherever the car happened to be standing. Motor show halls, dealership
  forecourts, petrol stations, suburban kerbs and industrial yards are not accidents in that genre,
  they are the genre.

  An earlier version of this note argued for stopping, on the grounds that denying more would empty
  the shop window. That reasoning is superseded: the Founder's cover test says a homepage showing
  three cars worth wanting beats one showing five, and a shorter grid is the intended outcome rather
  than a cost. `tileableCount` shrinks the row cleanly, so nothing strands.

  What has not changed is where the fix lives. Every entry added here improves the homepage by
  subtraction, and subtraction has a floor. Commissioning photography is the only thing that raises
  the ceiling, and that is a decision rather than a commit.
*/

/**
 * True when a photograph is fit to lead a curated surface — the homepage, an editorial collection,
 * a hero.
 *
 * Deliberately *not* the inverse of a score. There is no threshold to tune here and no way for a
 * frame to creep back in by improving its contrast; a photograph leaves this list when a person
 * takes it off, which is the only judgement that has ever been reliable about this question.
 */
export const isEditorialGrade = (src: string | null | undefined): boolean =>
  Boolean(src) && !NOT_EDITORIAL_GRADE.has(src as string);
