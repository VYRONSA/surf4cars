/**
 * SURF FOR CARS — vehicle photography policy.
 *
 * Which demonstration photographs are fit to be seen by a customer, anywhere on the platform.
 *
 * This began as a list inside the homepage's stock loader, which was the wrong place for it the moment
 * it existed: the marketplace, the "similar vehicles" rail and every dealer surface read their listings
 * by other routes, so a photograph banned from the homepage was still leading a card one click later.
 * The collision photograph was visible on the search page while the homepage was clean.
 *
 * A single policy, applied wherever listings are projected. There is one rule, and it is the founder's:
 * **the platform shows its best-looking inventory, not a representative sample of every marque.**
 *
 * WHY A LIST AND NOT A HEURISTIC
 * ==============================
 * PCP-006A built an image scorer for exactly this. It rated the Volvo's brick-shopfront frame 78 out of
 * 100 — mid-pack — because measuring pixels cannot tell you the car is a grey smudge in front of a
 * signboard. The scorer earns its keep on faults it can genuinely see: portrait frames, blurred frames,
 * photographs of a gearbox. Judging whether a photograph embarrasses the brand is not one of those, and
 * a confident wrong answer is worse than no answer.
 *
 * So these were chosen by looking at every frame the platform can draw from, on one contact sheet. Each
 * entry names a specific file, because the file is what is wrong — the make and model are fine, and a
 * dealer's own photograph of the same car would be welcome tomorrow.
 *
 * Every entry disappears when real dealer photography or the approved premium library lands. Removing
 * one is a one-line change that needs no reasoning about the rest.
 */

/**
 * Frames that must never lead a card, a gallery or a hero.
 *
 * Ordered by how badly each one would damage a first impression.
 */
export const UNPRESENTABLE_VEHICLE_PHOTOGRAPHY: ReadonlySet<string> = new Set([
  /* A collision on a pedestrian crossing, with bystanders inspecting the damage. */
  "/images/vehicles/library/honda-fit/front.webp",
  /* A liveried rally car mid-corner in dirt. Not a vehicle anybody can buy. */
  "/images/vehicles/library/hyundai-i20/front.webp",
  /* A liveried DTM touring car on a circuit. Correct for a Performance collection, wrong for a listing. */
  "/images/vehicles/library/mercedes-benz-c-class/front.webp",
  /* Grey XC90 parked small and low in front of a brick shopfront hung with "BARRETT" signage. */
  "/images/vehicles/library/volvo-xc90/front.webp",
  /* White bakkie in "SECURITY" livery against construction scaffolding. */
  "/images/vehicles/library/toyota-hilux/front.webp",
  /* Flatbed truck with a livestock cage, under a "CHICKEN KING" sign. */
  "/images/vehicles/library/mahindra-pik-up/front.webp",
  /* Dark X1 against a cluttered shopfront hung with SALE banners. */
  "/images/vehicles/library/bmw-x1/front.webp",
  /* Rear-only press shot of a hydrogen prototype, photographers in frame. */
  "/images/vehicles/library/bmw-x5/front.webp",
  /* Motor-show stand: red Magnite behind a crowd in face masks. */
  "/images/vehicles/library/nissan-magnite/front.webp",
  /* An instrument cluster. A dial is not a car, and this was leading a search result. */
  "/images/vehicles/library/toyota-corolla/front.webp",

  /*
    ── Second pass, from the premium review ─────────────────────────────────────────────────────
    Every entry below was leading a card on /search at the time it was added. Four of them are the
    *fallback* frame — the projection had already skipped a denied `front.webp` and landed on the
    vehicle's next photograph, which is how a policy written one frame at a time quietly stops
    working. Skipping a bad photograph only helps if the next one is good.
  */

  /* A close-up of a tow-bar mount and an exhaust tip, filling the frame. No car is visible at all.
     This was leading every Hilux Raider on the marketplace after `front.webp` was denied. */
  "/images/vehicles/library/toyota-hilux/rear.webp",

  /* Dashboard shot taken from the back seat inside a shopping mall — protective film still on the
     pillars, dealer paperwork taped to the windscreen, shoppers walking past outside. It is a car in
     a showroom rather than a car for sale, and it is categorised exterior, so it led the card. */
  "/images/vehicles/library/mitsubishi-triton/front.webp",

  /* A J100 Land Cruiser, tail-down on a desert dune. Two generations and roughly twenty-five years
     older than the "Land Cruiser 300" listings it was leading, and unmistakably a dune-safari
     vehicle rather than something on a South African forecourt. */
  "/images/vehicles/library/toyota-land-cruiser/front.webp",

  /* An early-2000s Corolla Altis on gravel with a Thai registration plate and a bystander in frame,
     leading a 2026 Corolla. The plate is the tell: a listing photograph that cannot have been taken
     in this market undoes the claim that somebody checked the listing. */
  "/images/vehicles/library/toyota-corolla/rear.webp",

  /*
    ── Denying one frame is not enough for these two ────────────────────────────────────────────
    Both were caught by checking what the projection actually fell *through* to, rather than by
    assuming the next photograph was better. Both replacements were worse than the frame they
    replaced, which is the failure this list exists to prevent and the reason to re-probe after
    every edit to it rather than trusting the change.
  */

  /* A 1990s Hilux in Thai Ministry of Energy fleet livery, parked at a public event under Thai
     signage. Government-liveried, foreign, and thirty years older than the Raider it was leading —
     comfortably worse than the tow-bar close-up it replaced. */
  "/images/vehicles/library/toyota-hilux/side.webp",

  /* A 1970s Corolla coupé on cobblestones. A handsome photograph of the wrong car by five decades,
     leading "2026 Toyota Corolla 2.0 XR". */
  "/images/vehicles/library/toyota-corolla/side.webp",

  /*
    ── Two competition cars, found on the launch walk ────────────────────────────────────────────
    Both were leading cards on the homepage and both are still reachable from search, which is why
    they are denied here rather than only marked rejected in `media_reviews`: this list is the gate
    search applies, and a competition car captioned as a road car is a factual misrepresentation of
    what is for sale, not a matter of taste.

    They surfaced because PCP-042 taught the lead-image chooser to prefer editorial-grade frames,
    which promoted the *third* photograph of several vehicles for the first time. The rally car's
    front frame was already denied; nobody had ever looked at its side.
  */

  /* A Hyundai Motorsport WRC car: Shell Helix livery, competition number 7, the crew's names on the
     glass, Michelin gravel tyres. It was leading "2019 Hyundai i20 1.0T Fluid" at R95 000. */
  "/images/vehicles/library/hyundai-i20/side.webp",

  /* A Group 5 BMW 320i turbo on a circuit — Castrol livery, race number 39, "EDDIE CHEEVER" on the
     door, roll cage visible through the glass, rear wing. Leading "2019 BMW 320i M Sport". */
  "/images/vehicles/library/bmw-320i/rear.webp",
]);

/** True when a photograph is fit to be shown to a customer. */
export const isPresentablePhotograph = (src: string | null | undefined): boolean =>
  Boolean(src) && !UNPRESENTABLE_VEHICLE_PHOTOGRAPHY.has(src as string);

/**
 * Keep only the listings whose lead photograph is fit to be seen.
 *
 * Deliberately filters on the photograph rather than dropping the vehicle from the platform. These cars
 * are really for sale and remain findable, counted and reachable by direct link — what is curated is
 * which of them get to *represent* the marketplace in a grid, a rail or a shop window.
 */
export function withPresentablePhotography<T extends { readonly imageSrc: string }>(
  listings: readonly T[],
): readonly T[] {
  return listings.filter((listing) => isPresentablePhotograph(listing.imageSrc));
}
