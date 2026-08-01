/**
 * SURF4CARS — the editorial curation registry.
 *
 * "The Founder decides. Algorithms assist. They never decide."
 *
 * This is where that is expressed. It is a plain data file, deliberately: it can be read at a glance,
 * changed in one line, reviewed in a diff, and it has no dependency on a dashboard existing. The
 * brief asked for curation "without touching code" — this is not quite that, and the gap is named at
 * the bottom of this file rather than hidden.
 *
 * TWO MODES, AND THE SECOND ONE IS THE POINT
 * ==========================================
 * `APPROVED_FOR_HOMEPAGE` is an allowlist. While it is empty the shop window falls back to the
 * editorial photography standard — everything that is not visibly a forecourt, a motor show or a
 * street kerb. That fallback is a stopgap and it behaves like one: it can only ever remove the
 * failures somebody has already spotted.
 *
 * The moment a single slug is added here, the homepage inverts: it shows *only* what has been
 * approved. That is the difference between "curated" and "generated", and it is one line away.
 *
 * WHY IT IS EMPTY TODAY
 * =====================
 * Because nothing in the current library honestly earns a place, and seeding it with my own guesses
 * would defeat the purpose of the file. Fifteen candidate lead frames were examined one by one
 * against the standard. The results are recorded in `NOT_EDITORIAL_GRADE` and in
 * `docs/reports/photography-audit.md`, and the pattern is not a handful of bad photographs — it is
 * that the demonstration library is *reference* photography (Wikipedia-style: identify the car,
 * record the trim, plate visible, whatever light there was) rather than *editorial* photography.
 * Only one frame examined would print across a spread: the Ford Ranger fording a river.
 *
 * No curation logic turns reference photography into a magazine cover. That is a commissioning
 * decision, not a code change, and pretending otherwise by auto-approving the least-bad frames is
 * exactly the convincing-placeholder failure this platform keeps paying for.
 */

/**
 * Vehicle slugs approved to represent the marketplace on curated surfaces.
 *
 * Add a slug and it becomes eligible for the homepage. Add none and the editorial standard applies.
 * Order is not significant — the shop window still mixes body styles and marques across whatever is
 * approved, so an approved set that is all SUVs will still read as all SUVs.
 */
export const APPROVED_FOR_HOMEPAGE: ReadonlySet<string> = new Set<string>([
  // "2026-ford-ranger-3-0-v6-raptor-s1-veh-0",
]);

/**
 * Vehicles approved to carry a full-bleed hero.
 *
 * A stricter bar than the homepage: a hero frame is displayed at 1440px across and 80% of the
 * viewport's height, where every reflection, plate and background object is legible. A photograph
 * that survives a 460px card can fall apart here.
 */
export const APPROVED_AS_HERO: ReadonlySet<string> = new Set<string>();

/** True while curation has not begun, in which case the editorial standard is the fallback. */
export const isCurationEmpty = (): boolean => APPROVED_FOR_HOMEPAGE.size === 0;

/**
 * Is this vehicle allowed on a curated surface?
 *
 * Returns `true` for everything while the allowlist is empty, so the marketplace keeps working
 * before anybody has curated it. The caller still applies the editorial photography standard.
 */
export const isApprovedForHomepage = (slug: string): boolean =>
  isCurationEmpty() || APPROVED_FOR_HOMEPAGE.has(slug);

/*
  THE INTERFACE NOW EXISTS — AND THIS FILE IS THE SECOND-BEST WAY TO USE IT
  ========================================================================
  This file was written when the claim was "there is no staff gate, so an editing surface cannot be
  shipped safely". That claim was wrong twice over, and both corrections matter more than the file.

  The gate was always written — `src/proxy.ts` checks `operations:view` on every `/operations` route.
  It was simply never running: with the application under `src/`, Next resolves the convention at
  `src/` only, and the file sat at the repository root being silently ignored. Every operations,
  dealer and buyer route answered 200 to anybody until PCP-017 moved it.

  With that fixed, the Founder Editorial Console at `/operations/editorial` is the real answer to
  "curate without touching code": it writes to `editorial_slots` and `editorial_placements`, and the
  homepage reads them ahead of anything decided here.

  So this file keeps a narrower job than it was given. `APPROVED_FOR_HOMEPAGE` remains as a
  deployment-time override for the case where the database is unreachable or unmigrated and the shop
  window still has to be trustworthy. Day-to-day curation belongs in the console.
*/
