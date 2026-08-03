import { performanceBadge } from "@/config/merchandising/marque-standing";

import type { MediaIntegrityFlag } from "./media-review.types";

/**
 * SURF4CARS — vehicle/photograph integrity.
 *
 * Detects photographs that cannot be correct for the listings they lead.
 *
 * WHAT IT CAN HONESTLY SEE, AND WHAT IT CANNOT
 * ============================================
 * It does not look at pixels. Nothing here can tell that a frame shows a cabriolet, and pretending
 * otherwise would produce exactly the confident wrong answers the media scorer already produced when
 * it rated a brick-shopfront photograph 78 out of 100.
 *
 * What it can see is *disagreement*, and disagreement is enough for the cases that actually occur.
 * The demonstration library keys one photograph per model, so a single frame leads many listings —
 * and the moment two of those listings disagree about something the photograph must show, at least
 * one of them is being misrepresented. No pixel inspection required; the contradiction is in the
 * records.
 *
 *   model-mismatch       the file lives under a different model than the listing claims
 *   body-style-conflict  one photograph leads listings of two different body styles
 *   derivative-conflict  one photograph leads both a genuine performance model and an ordinary one
 *
 * The third is the Ranger case the Founder identified: `ford-ranger/front.webp` is a base double cab
 * with a canopy, and it leads both an XLT and a "3.0 V6 Raptor" — a different bumper, a different
 * body, and a million rand apart. The second catches the A3, whose single frame serves both the hatch
 * and the cabriolet.
 *
 * WHY A FLAG AND NOT A BLOCK
 * ==========================
 * Because the right answer differs per case and a rule cannot know which. The Ranger photograph is a
 * fine picture of a Ranger and a poor one of a Raptor; whether that matters depends on which listing
 * is in front of you. So this raises the disagreement and a person decides — which is the whole shape
 * of this sprint.
 */

/** Normalises "Mercedes-Benz C-Class" and "mercedes-benz-c-class" onto the same string. */
const slug = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** The model a library path claims: `/images/vehicles/library/<model>/<view>.webp`. */
export function modelFromPath(photograph: string): string | null {
  const match = /\/images\/vehicles\/library\/([^/]+)\//.exec(photograph);
  return match?.[1] ?? null;
}

export interface IntegrityCandidate {
  readonly id: string;
  readonly photograph: string;
  readonly make: string | null;
  readonly model: string | null;
  readonly variant: string | null;
  readonly bodyType: string | null;
  readonly title: string;
}

type Detected = Omit<MediaIntegrityFlag, "id" | "dismissed">;

/**
 * Every disagreement visible in a set of listings and the photographs leading them.
 *
 * Deterministic and order-independent: the same inventory produces the same flags, so a queue the
 * Founder half-worked through does not reshuffle itself overnight.
 */
export function detectIntegrityFlags(candidates: readonly IntegrityCandidate[]): readonly Detected[] {
  const flags: Detected[] = [];
  const byPhotograph = new Map<string, IntegrityCandidate[]>();

  for (const candidate of candidates) {
    if (!candidate.photograph) continue;
    const bucket = byPhotograph.get(candidate.photograph) ?? [];
    bucket.push(candidate);
    byPhotograph.set(candidate.photograph, bucket);
  }

  for (const [photograph, listings] of [...byPhotograph.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    /*
      1. The file claims a model. Does the listing agree?

      Compared as "does the path contain the listing's make and model" rather than by equality,
      because the library slugs are model-only (`bmw-x5`) while a listing carries make and model
      separately, and some models are recorded with a trim attached. A containment test is the
      conservative direction: it under-reports rather than crying wolf on every naming variation.
    */
    const pathModel = modelFromPath(photograph);
    if (pathModel) {
      for (const listing of listings) {
        const expected = slug(`${listing.make ?? ""} ${listing.model ?? ""}`);
        if (!expected) continue;
        const modelOnly = slug(listing.model ?? "");
        const agrees =
          expected.includes(pathModel)
          || pathModel.includes(expected)
          || (modelOnly.length > 2 && pathModel.includes(modelOnly));
        if (!agrees) {
          flags.push({
            photograph,
            rule: "model-mismatch",
            detail: `Filed under "${pathModel}" but leads "${listing.title}".`,
          });
        }
      }
    }

    if (listings.length < 2) continue;

    /* 2. One photograph, two body styles. Both cannot be right. */
    const bodies = [...new Set(listings.map((listing) => (listing.bodyType ?? "").trim()).filter(Boolean))];
    if (bodies.length > 1) {
      flags.push({
        photograph,
        rule: "body-style-conflict",
        detail: `Leads ${bodies.length} body styles at once: ${bodies.sort().join(", ")}.`,
      });
    }

    /*
      3. One photograph, a genuine performance model and an ordinary one.

      `performanceBadge` is the same marque-scoped rule the merchandising layer uses, so "M Sport"
      and "GT-Line" do not register here either — a trim package sharing a photograph with its own
      base model is not a defect, it is the same car.
    */
    const badged = listings.filter((listing) =>
      performanceBadge(listing.make, listing.model, listing.variant),
    );
    const leadBadged = badged[0];
    if (leadBadged && badged.length < listings.length) {
      const badge = performanceBadge(leadBadged.make, leadBadged.model, leadBadged.variant);
      flags.push({
        photograph,
        rule: "derivative-conflict",
        detail: `One frame leads a ${badge} and ${listings.length - badged.length} ordinary ${
          listings.length - badged.length === 1 ? "listing" : "listings"
        } of the same model.`,
      });
    }
  }

  return flags;
}
