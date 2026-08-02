import type { UnifiedVehicleRecord } from "@/domain/vehicle";

/**
 * How complete a listing is, measured from what is actually on the record.
 *
 * WHAT THIS IS NOT
 * ================
 * Not a quality score, not an AI rating, and not a prediction of how well the car will sell. It
 * counts facts that are either present or absent, and every point is attributable to a field a
 * dealer can go and fill in. `listingScore` already exists on the record and is derived from photo
 * count alone dressed as a 0–100 figure; this replaces the guesswork with an itemised list.
 *
 * REWARD COMPLETENESS, NEVER PUNISH INCOMPLETENESS
 * ================================================
 * The brief's rule, and it changes the wording rather than the arithmetic. A missing item reads as
 * the next thing worth doing — "Add photographs — buyers filter them out without" — not as a fault.
 * A dealer who lists forty cars a week does not need to be told off; they need to know which of the
 * forty is costing them enquiries.
 *
 * ONLY WHAT EXISTS IS SCORED
 * ==========================
 * Service history, previous owners and warranty are recorded for **zero** of the 229 published
 * vehicles — the columns exist and nothing populates them. Scoring them would give every dealership
 * on the platform an unreachable ceiling and make the score meaningless on arrival. They are named
 * in the report as the next thing to capture, not scored here.
 */

export type ReadinessImpact = "high" | "medium" | "low";

export interface ReadinessItem {
  readonly id: string;
  /** What the dealer has done, or the thing to do next. */
  readonly label: string;
  readonly present: boolean;
  /** Why it matters to a buyer, in the buyer's terms rather than the platform's. */
  readonly why: string;
  readonly impact: ReadinessImpact;
}

export interface ListingReadiness {
  /** 0–100, weighted by impact. Round numbers only; false precision helps nobody. */
  readonly score: number;
  readonly items: readonly ReadinessItem[];
  /** The single highest-impact missing item, or null when nothing is outstanding. */
  readonly nextBest: ReadinessItem | null;
}

/* Weights, not equal points. A listing with no photographs is unsellable; one with no colour
   recorded is merely thinner. Equal weighting would let a dealer reach 80% without a single
   photograph, which would make the score actively misleading. */
const WEIGHT: Record<ReadinessImpact, number> = { high: 3, medium: 2, low: 1 };

/** Six or more is the point at which a gallery stops looking like an afterthought. */
const GOOD_PHOTO_COUNT = 6;

export function buildListingReadiness(
  record: UnifiedVehicleRecord,
  equipmentCount: number,
): ListingReadiness {
  const photoCount = record.media.photos.length;
  const hasDescription = record.core.description.some((section) =>
    section.paragraphs.some((paragraph) => paragraph.trim().length > 60),
  );

  const items: ReadinessItem[] = [
    {
      id: "photos",
      label:
        photoCount >= GOOD_PHOTO_COUNT
          ? `${photoCount} photographs`
          : photoCount > 0
            ? `Add more photographs — ${photoCount} so far`
            : "Add photographs",
      present: photoCount >= GOOD_PHOTO_COUNT,
      why: "Listings without photographs are filtered out before a buyer reads anything else.",
      impact: "high",
    },
    {
      id: "description",
      label: hasDescription ? "Description written" : "Write a description",
      present: hasDescription,
      why: "Your own words are the only part of the listing a competitor cannot copy.",
      impact: "high",
    },
    {
      id: "price",
      label: record.pricing.sellingPriceCents > 0 ? "Price set" : "Set an asking price",
      present: record.pricing.sellingPriceCents > 0,
      why: "Buyers filter by price before anything else. A listing without one is invisible to them.",
      impact: "high",
    },
    {
      id: "equipment",
      label: equipmentCount > 0 ? `${equipmentCount} equipment items` : "List the equipment",
      present: equipmentCount > 0,
      why: "Specification is the most common question a dealer answers by telephone.",
      impact: "medium",
    },
    {
      id: "specification",
      label:
        record.core.fuel?.trim() && record.core.transmission?.trim() && record.core.bodyType?.trim()
          ? "Fuel, gearbox and body recorded"
          : "Complete fuel, gearbox and body type",
      present: Boolean(
        record.core.fuel?.trim() && record.core.transmission?.trim() && record.core.bodyType?.trim(),
      ),
      why: "These three are search filters. A gap here removes the car from those results entirely.",
      impact: "high",
    },
    {
      id: "engine-colour",
      label:
        record.core.engine?.trim() && record.core.colour?.trim()
          ? "Engine and colour recorded"
          : "Add engine and colour",
      present: Boolean(record.core.engine?.trim() && record.core.colour?.trim()),
      why: "Both appear in the specification table buyers scan before enquiring.",
      impact: "low",
    },
    {
      id: "vin",
      label: record.core.vin?.trim() ? "VIN on file" : "Add the VIN",
      present: Boolean(record.core.vin?.trim()),
      why: "Shown to buyers as a sign the listing describes one specific vehicle.",
      impact: "medium",
    },
  ];

  const earned = items.reduce((total, item) => total + (item.present ? WEIGHT[item.impact] : 0), 0);
  const available = items.reduce((total, item) => total + WEIGHT[item.impact], 0);

  /* Highest impact first, then the order above — which runs roughly in the order a dealer would
     naturally work through a listing. */
  const outstanding = items
    .filter((item) => !item.present)
    .sort((a, b) => WEIGHT[b.impact] - WEIGHT[a.impact]);

  return {
    score: available > 0 ? Math.round((earned / available) * 100) : 0,
    items,
    nextBest: outstanding[0] ?? null,
  };
}
