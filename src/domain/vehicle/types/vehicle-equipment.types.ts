/**
 * SURF FOR CARS — vehicle equipment model.
 *
 * The code expression of `supabase/migrations/20260731090000_pcp011a_equipment_architecture.sql`. Kept in step
 * with it deliberately: the check constraints in that migration and the unions here are the same
 * vocabulary, and a value that is legal in one must be legal in the other.
 *
 * The shape exists to serve five things at once, which is why it is a catalogue plus a join rather than a
 * list of strings on the vehicle:
 *
 *   the vehicle page      group by category, render in display order
 *   search filters        exact match on slug, index-supported
 *   comparison            set intersection between two vehicles
 *   dealer editing        tick a known item rather than type free text
 *   recommendations       equipment as features, without normalising text at query time
 */

/** Presentation grouping on the vehicle page. Fixed vocabulary — dealers do not extend it. */
export type EquipmentCategory =
  | "safety"
  | "driver-assistance"
  | "comfort"
  | "technology"
  | "convenience"
  | "exterior"
  | "interior"
  | "performance";

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  safety: "Safety",
  "driver-assistance": "Driver assistance",
  comfort: "Comfort",
  technology: "Technology",
  convenience: "Convenience",
  exterior: "Exterior",
  interior: "Interior",
  performance: "Performance",
};

/**
 * Order the categories are presented in.
 *
 * Safety first, then the assistance systems buyers increasingly shop on, then the comfort and technology
 * that sell a car, then the rest. Not alphabetical: "Convenience" should not open the list.
 */
export const EQUIPMENT_CATEGORY_ORDER: readonly EquipmentCategory[] = [
  "safety",
  "driver-assistance",
  "comfort",
  "technology",
  "convenience",
  "interior",
  "exterior",
  "performance",
];

/**
 * How a claim about this vehicle came to be made.
 *
 * Mirrors the customer-facing `ProvenanceKind`, minus `calculated` and `platform` — equipment is never
 * derived or counted, it is asserted by somebody. "Adaptive cruise control" typed by a dealer and the same
 * feature decoded from a VIN are different levels of confidence about the same car, and a buyer paying for
 * that feature is entitled to know which they are reading.
 */
export type EquipmentProvenance =
  /** The dealership recorded it. True as far as we know; we did not witness it. */
  | "dealer"
  /** SURF4CARS confirmed it against the vehicle or its documentation. */
  | "verified"
  /** Decoded from a VIN or a manufacturer specification feed. */
  | "imported";

/** A definition — one row in the catalogue. Says nothing about any particular car. */
export interface EquipmentItem {
  readonly id: string;
  /** Stable machine key, used in filter URLs. Survives relabelling. */
  readonly slug: string;
  readonly label: string;
  readonly category: EquipmentCategory;
  readonly displayOrder: number;
}

/** An assertion — this vehicle has this item, and here is how we know. */
export interface VehicleEquipmentEntry extends EquipmentItem {
  readonly provenance: EquipmentProvenance;
  /** For the awkward cases: "fitted after delivery", "confirmed on inspection". */
  readonly sourceNote: string | null;
}

/** What a vehicle's past establishes, as opposed to what is bolted to it. */
export type ServiceHistoryStatus = "full" | "partial" | "none" | "unknown";

export interface VehicleHistoryFacts {
  readonly serviceHistory: ServiceHistoryStatus | null;
  readonly serviceHistoryProvenance: EquipmentProvenance | null;
  readonly previousOwners: number | null;
  readonly previousOwnersProvenance: EquipmentProvenance | null;
  readonly warrantyExpiresOn: string | null;
  readonly warrantyProvenance: EquipmentProvenance | null;
}

/** Groups a vehicle's equipment for rendering, dropping categories it has nothing in. */
export function groupEquipmentByCategory(
  entries: readonly VehicleEquipmentEntry[],
): readonly { readonly category: EquipmentCategory; readonly label: string; readonly items: readonly VehicleEquipmentEntry[] }[] {
  return EQUIPMENT_CATEGORY_ORDER.map((category) => ({
    category,
    label: EQUIPMENT_CATEGORY_LABELS[category],
    items: entries
      .filter((entry) => entry.category === category)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)),
  })).filter((group) => group.items.length > 0);
}

/**
 * The facts worth pulling out as highlights.
 *
 * Highlights are not a separate dataset — they are the subset of equipment and history a buyer scans for
 * first. Deriving them rather than storing them means a dealer who records adaptive cruise control gets it
 * in their highlights automatically, with no second place to keep in step.
 *
 * Returns nothing when nothing has been recorded. There is no fallback set: a highlights strip that
 * appears whether or not the data exists is how "Full Service History" ends up on a car nobody checked.
 */
const HIGHLIGHT_SLUGS: readonly string[] = [
  "adaptive-cruise",
  "panoramic-roof",
  "leather-upholstery",
  "apple-carplay",
  "android-auto",
  "reverse-camera",
  "heated-seats",
  "navigation",
  "four-wheel-drive",
  "premium-audio",
];

export interface VehicleHighlight {
  readonly label: string;
  readonly provenance: EquipmentProvenance;
}

export function deriveHighlights(
  equipment: readonly VehicleEquipmentEntry[],
  history: VehicleHistoryFacts,
  limit = 6,
): readonly VehicleHighlight[] {
  const highlights: VehicleHighlight[] = [];

  if (history.serviceHistory === "full" && history.serviceHistoryProvenance) {
    highlights.push({ label: "Full service history", provenance: history.serviceHistoryProvenance });
  }

  if (history.previousOwners === 1 && history.previousOwnersProvenance) {
    highlights.push({ label: "One owner", provenance: history.previousOwnersProvenance });
  }

  if (history.warrantyExpiresOn && history.warrantyProvenance) {
    const expires = new Date(history.warrantyExpiresOn);
    if (!Number.isNaN(expires.valueOf()) && expires > new Date()) {
      highlights.push({ label: "Balance of warranty", provenance: history.warrantyProvenance });
    }
  }

  for (const slug of HIGHLIGHT_SLUGS) {
    if (highlights.length >= limit) break;
    const match = equipment.find((entry) => entry.slug === slug);
    if (match) highlights.push({ label: match.label, provenance: match.provenance });
  }

  return highlights.slice(0, limit);
}
