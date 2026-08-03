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

  /*
    ── Caught by PCP-041A, when merchandising changed which cars lead ────────────────────────────
    Ranking the homepage by aspiration rather than by listing completeness promoted the premium end
    of the inventory to the front page for the first time — and the premium end is exactly where
    this library is weakest, because expensive cars are photographed at motor shows and dealerships
    rather than on driveways.

    Every frame below was leading a homepage card within minutes of that change. That is the founder
    rule firing as intended: *never feature poor-quality photography simply because a vehicle is
    expensive*. The rail is shorter for it, which is the preferred outcome.
  */

  /* A dealership forecourt, and it advertises a *different* dealership: "Audi Zentrum Stuttgart"
     decals on the subject car's door and across the black car parked behind it, German plate, block
     paving, grey wall. Putting a live third-party business's branding on the SURF4CARS shop window
     is the same fault as the "MILITARY AUTOSOURCE" and `autoloewen.de` frames already denied. */
  "/images/vehicles/library/audi-q3/front.webp",

  /* A red Q5 with a blue emergency light bar on the roof and an "FW" (Feuerwehr) plate, parked
     outside a municipal building. A fire-service command vehicle, leading a R940 000 listing —
     the same fault as the "SECURITY"-liveried bakkie and the government-fleet Hilux. */
  "/images/vehicles/library/audi-q5/front.webp",

  /* A street in China: blue Chinese plates, red signage propped inside the windscreen, moving
     traffic, kerb markings and a harbour behind. `bmw-x1/front.webp` was already denied outright,
     so this is the frame the projection falls through to — and it is no better. */
  "/images/vehicles/library/bmw-x1/rear.webp",

  /* A motor show stand: crowd, exhibition lighting, an "AMG" wall sign, another car on a plinth
     behind, and a "Classe C" display board where the registration should be. It is also an estate,
     leading saloon listings. `mercedes-benz-c-class/front.webp` is denied outright as a liveried
     DTM car, so this is the fallback — a second reminder that skipping a bad frame only helps if
     the next one is good. */
  "/images/vehicles/library/mercedes-benz-c-class/rear.webp",

  /* The worst of the set, and the least obvious: a silver crossover on a show stand under a NISSAN
     sign, with "LF-NX" where the number plate goes. It is the Lexus LF-NX **concept car** — a
     design study that was never sold — and it was leading a R1 170 000 listing for an NX 350h.
     Nobody can buy this vehicle. Same fault as the denied hydrogen prototype on the X5. */
  "/images/vehicles/library/lexus-nx/front.webp",

  /*
    ── Second pass, after the first shifted which cars lead ──────────────────────────────────────
    Re-probed rather than assumed, which is the discipline this file has needed twice before: the
    frames promoted by a denial are not necessarily better than the ones denied.
  */

  /* Moving traffic. Chinese plate, a bus filling the left third, cars crowding both sides, road
     markings across the bottom. */
  "/images/vehicles/library/bmw-x3/front.webp",

  /* Also moving traffic, and worse: the driver, a passenger and a child are clearly identifiable
     through the windscreen, in face masks. Photographing strangers is not something to put on the
     front page of a marketplace, whatever the licence says. */
  "/images/vehicles/library/mercedes-benz-v-class/front.webp",

  /* Inside a dealership showroom — polished tiled floor, a Fortuner and a second Land Cruiser
     either side, window stickers still on the glass, Arabic signage, and a "LAND CRUISER" display
     board where the registration should be. It is also a 200-series V8 5.7 VXS leading "Land
     Cruiser 300 3.3 ZX": wrong generation and wrong engine, the same fault that denied the J100
     dune photograph. */
  "/images/vehicles/library/toyota-land-cruiser/rear.webp",

  /*
    ── Third pass, and the last one taken frame-by-frame ─────────────────────────────────────────
    These three were the next to reach the cover. All three fail plainly, and denying them is the
    correct call — but the pattern is now conclusive rather than incremental, and it is recorded at
    the foot of this file: ten frames were examined in this pass and eight failed, for the same
    handful of reasons every time. The library is reference photography and no further subtraction
    turns it into editorial photography.
  */

  /* A brand pop-up stand behind glass: a "Sportage GT-line" display board where the registration
     should be, a second Kia on a placard behind, an information kiosk, a BOSCH sign, and passers-by
     on the pavement outside. The same motor-show fault as the Magnite, the C-Class and the CX-5. */
  "/images/vehicles/library/kia-sportage/front.webp",

  /* A street outside a row of shops: "AVTO STOP" signage, a "LIQUI MOLY" advertising board, clothing
     hung in a shop window, a bystander, parked cars and a graffitied wall. It is also the three-door
     short-wheelbase Prado, leading five-door listings. */
  "/images/vehicles/library/toyota-prado/front.webp",

  /* A dealership forecourt — rows of unregistered stock either side, a delivery truck behind, and no
     number plate fitted at all. A good photograph of a car that is not for sale by us. */
  "/images/vehicles/library/volkswagen-amarok/front.webp",

  /*
    ── PCP-042, after the lead-image chooser began preferring editorial-grade frames ─────────────
    That change let a vehicle lead with a *different* exterior than before, which put roughly thirty
    previously-unused frames onto the homepage at once — including, at last, the premium stock the
    rails had been unable to reach. These three were leading the top two rails within a minute of it.

    They are the last frames denied by inspection. The reason is recorded in the note below: the
    default is backwards for a cover, and the remedy is an allowlist rather than a longer denylist.
  */

  /* A motor show stand — people in suits, exhibition lighting, display flooring, and a "Macan S"
     display board where the registration should be. It is also a Macan S leading a Macan GTS. The
     front frame of this same car was already denied for the same show. */
  "/images/vehicles/library/porsche-macan/rear.webp",

  /* A wet car park outside a row of shops: a "T.K Seafood Centre" board with a crab logo, a "KLINIK"
     sign, further shop signage, parked cars, disabled-bay markings and rain on the paint. Malaysian
     plate. It was leading the Sports & Performance rail. */
  "/images/vehicles/library/bmw-m340i/rear.webp",

  /* Inside a dealership showroom again — tiled floor, glass office partitions, ceiling spots, a
     windscreen sticker and another car behind the glass. */
  "/images/vehicles/library/bmw-x5/side.webp",
]);

/*
  WHY THIS LIST SHOULD STOP GROWING, AND WHAT REPLACES IT
  ======================================================
  Across PCP-041A and PCP-042 roughly fourteen further frames were examined one at a time as
  merchandising promoted them to the homepage. Twelve failed, for the same five reasons every time:
  motor show stands, dealership forecourts and showrooms, foreign street furniture, third-party
  advertising, and vehicles that are not the model in the listing.

  That ratio is not a backlog to work through. `isEditorialGrade` answers "has anybody objected to
  this frame yet", and on a library of several hundred reference photographs the honest answer for
  almost all of them is "nobody has looked". A denylist therefore approves by default, which is the
  wrong default for the one page that speaks for the marketplace: every improvement to merchandising
  promotes another batch of unreviewed frames to the cover, and the list has to chase it.

  The inversion already exists and is deliberately empty — `APPROVED_FOR_HOMEPAGE` in
  `src/config/editorial/editorial-curation.ts`, or an `editorial_slots` placement from the Founder
  Editorial Console. Adding one slug there flips the homepage from "everything not yet objected to"
  to "only what a person chose". That is a curation decision and cannot be made from here.
*/

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
