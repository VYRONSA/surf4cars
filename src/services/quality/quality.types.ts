/**
 * The Founder Quality Centre's vocabulary.
 *
 * This module is not analytics. Analytics tells you what happened; this tells you what to fix. Every value
 * here exists to answer one question — *what should I change next to make SURF4CARS more trustworthy?* — so
 * a finding that cannot be acted on does not belong in it.
 *
 * Three properties follow from that, and they are the ones to preserve when adding rules:
 *
 *   every finding names a record   a count of "12 incomplete dealers" is a statistic. A link to the dealer,
 *                                  the field, and the correction is work. Only the second changes anything.
 *   severity means customer harm   not "how broken is the data" but "what does a buyer experience". A
 *                                  dealership nobody can contact outranks a missing VAT number by a distance,
 *                                  even though both are one empty column.
 *   demonstration rows are visible Excluded from the score, listed in the report. Filtering them away is how
 *                                  a fixture becomes invisible and ends up in production — which is exactly
 *                                  what happened with the largest dealer on the platform.
 */

/** What a buyer experiences, not how broken the record is. */
export type QualitySeverity =
  /** A customer is actively misled, blocked, or shown something internal. */
  | "critical"
  /** The listing works but reads as unfinished, or a claim cannot be substantiated. */
  | "high"
  /** Thin but honest. Worth improving; nobody is harmed today. */
  | "medium";

export const SEVERITY_ORDER: Readonly<Record<QualitySeverity, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
};

/**
 * The two questions a marketplace has to answer separately.
 *
 *   integrity     is the platform *honest*? Provenance present, nothing fabricated, illustrative content
 *                 labelled, links that resolve, claims that hold. A platform can score 100 here while
 *                 holding almost no content.
 *   completeness  is the platform *commercially ready*? Dealer photography, contact details, equipment,
 *                 verification. This improves as onboarding progresses and cannot be fixed by engineering.
 *
 * Collapsing them into one number was actively misleading. "25%" reads as a broken platform; "100% honest,
 * 25% complete" reads as a trustworthy platform early in its content life — and only the second tells you
 * whether the next hire is an engineer or a dealer success manager.
 *
 * The distinction also moves as the product improves. Unlabelled stock photography was an integrity failure:
 * the platform implied a photograph was of the car. Labelled stock photography is an honest statement of an
 * incomplete listing, so the same records now count against completeness instead. Disclosure genuinely
 * changed what the defect is.
 */
export type QualityDimension = "integrity" | "completeness";

/** Groups findings into the thing a person would sit down and work on. */
export type QualityCategory =
  | "dealer-contact"
  | "dealer-address"
  | "dealer-verification"
  | "vehicle-photography"
  | "vehicle-equipment"
  | "vehicle-description"
  | "vehicle-duplicate"
  | "administrative";

export interface QualitySubject {
  readonly kind: "dealer" | "vehicle";
  readonly id: string;
  readonly name: string;
  /** Where the Founder goes to see it as a customer would. Null when there is no public page. */
  readonly href: string | null;
  /** True where the subject exists to demonstrate the product. Scored separately, never hidden. */
  readonly isDemonstration: boolean;
}

export interface QualityFinding {
  /** Stable across runs, so a finding can be tracked rather than merely counted. */
  readonly id: string;
  readonly rule: string;
  readonly category: QualityCategory;
  readonly dimension: QualityDimension;
  readonly severity: QualitySeverity;
  readonly subject: QualitySubject;
  /** What is wrong, in the terms a customer would notice. */
  readonly problem: string;
  /** The specific change that resolves it. Never "review this". */
  readonly remedy: string;
  /** The offending value, where showing it helps. Omitted when it would leak something internal. */
  readonly evidence: string | null;
}

/** One rule's worth of work, across every record it affects. */
export interface QualityAction {
  readonly rule: string;
  readonly category: QualityCategory;
  readonly dimension: QualityDimension;
  readonly severity: QualitySeverity;
  /** How many records carry this defect. */
  readonly affected: number;
  readonly problem: string;
  readonly remedy: string;
  /** A handful of named records, so the Founder can see the shape of it without a full list. */
  readonly examples: readonly QualitySubject[];
}

export interface QualityCategorySummary {
  readonly category: QualityCategory;
  readonly label: string;
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly total: number;
}

export interface QualityReport {
  readonly generatedAt: string;
  /**
   * Production findings only — demonstration records are excluded, which is the whole point of tagging
   * them. `demonstrationFindings` carries those separately so they stay visible.
   */
  readonly findings: readonly QualityFinding[];
  readonly demonstrationFindings: readonly QualityFinding[];
  readonly categories: readonly QualityCategorySummary[];
  readonly dealersAudited: number;
  readonly vehiclesAudited: number;
  readonly demonstrationDealers: number;
  /**
   * Is the platform honest? 0–100, weighted by customer harm rather than by count.
   *
   * This is the score engineering owns and the one that must never be softened.
   */
  readonly integrityScore: number;
  /**
   * Is the platform commercially ready? 0–100, same weighting.
   *
   * Owned by onboarding and dealer success rather than by engineering. A low number here is a young
   * marketplace, not a broken one.
   */
  readonly completenessScore: number;
  /**
   * The highest-value work, grouped by rule and already ordered. This is the module's actual output.
   *
   * Grouped rather than listed, and the difference matters. The first build returned the top twelve
   * findings, which turned out to be twelve alphabetically-adjacent dealerships with the identical defect —
   * technically the highest-severity items, and useless as a plan. "126 dealerships cannot be contacted" is
   * one decision; 126 rows of the same sentence is a wall that gets scrolled past.
   */
  readonly nextActions: readonly QualityAction[];
  /** Set when a data source could not be read, so an empty report is never mistaken for a clean one. */
  readonly incomplete: string | null;
}
