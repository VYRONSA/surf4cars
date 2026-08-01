/**
 * The shape of the premium media library.
 *
 * The taxonomy itself is data — `scripts/media/library.sections.json` — because two very different
 * runtimes need it: these Node scripts, and the Founder's review dashboard inside the Next
 * application. Holding it as JSON means neither owns it and neither can drift, which matters
 * because a disagreement about where a brief is filed ends with two copies of the same approved
 * photograph and no way to tell which one production is serving.
 *
 * Sections divide on *how an asset gets here*, not on what it looks like:
 *
 *   curated  — chosen by the Founder from a candidate board. Reaches disk only via approval.
 *   uploaded — supplied by its owner (a dealer's logo, a manufacturer's mark, a vehicle's photos).
 *              Never sourced from a stock library: it is someone else's trademark or property.
 *   composed — a Founder-approved plate, with SURF typography rendered over it by the application.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const PREMIUM_DIR = join("public", "media", "premium");
export const MANIFEST_PATH = join(PREMIUM_DIR, "manifest.json");
export const SECTIONS_PATH = join("scripts", "media", "library.sections.json");

/** Public URL prefix for everything in the library. */
export const PREMIUM_URL = "/media/premium";

/** The library's directories, in the order they are presented for review. */
export const LIBRARY_SECTIONS = JSON.parse(readFileSync(SECTIONS_PATH, "utf8"));

const SECTION_BY_BRIEF = new Map(
  LIBRARY_SECTIONS.flatMap((section) => section.briefs.map((brief) => [brief, section])),
);

export const listSectionIds = () => LIBRARY_SECTIONS.map((section) => section.id);

/**
 * Which directory a brief's approved asset belongs in.
 *
 * Throws rather than defaulting. A brief with no home is a taxonomy bug, and quietly filing it at
 * the library root is how the flat layout this replaced came about in the first place.
 */
export function resolveSection(briefId) {
  const section = SECTION_BY_BRIEF.get(briefId);
  if (!section) {
    throw new Error(
      `Brief "${briefId}" has no section in the premium library. Add it to ${SECTIONS_PATH}.`,
    );
  }
  return section;
}

/** Filesystem path an approved asset is written to. */
export const assetFilePath = (briefId, extension = "webp") =>
  join(PREMIUM_DIR, resolveSection(briefId).id, `${briefId}.${extension}`);

/** Public path the application serves the approved asset from. */
export const assetPublicPath = (briefId, extension = "webp") =>
  `${PREMIUM_URL}/${resolveSection(briefId).id}/${briefId}.${extension}`;
