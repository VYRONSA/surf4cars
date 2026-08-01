/**
 * Dealer onboarding readiness — one definition, several views.
 *
 * PRP-001 asks for an onboarding journey (Phase 1), a dealer health score (Phase 2), an inventory readiness
 * pipeline (Phase 3), a verification queue (Phase 5) and a Founder action centre (Phase 7). Built
 * separately those would be five scoring implementations of the same underlying question — *what does this
 * record have, what is missing, and who can supply it* — and they would disagree within a release. This
 * codebase already has the evidence: two spellings of `onboarding_status` left 50 dealerships invisible to
 * every consumer, and two copies of the slug builder produced a Founder report where all 76 links 404'd.
 *
 * So there is one list of requirements. The journey is that list per dealership; the health score is the
 * same list weighted; the action centre is the same list aggregated across dealerships. Adding a step means
 * adding one entry here, and all three surfaces gain it.
 *
 * WHAT A REQUIREMENT IS ALLOWED TO ASSERT
 * =======================================
 * A step is complete only when the platform can *substantiate* it. For fields carrying provenance that
 * means `dealer` or `verified` — never `seed`. This distinction is the whole reason the table exists: every
 * dealership already has a logo (`/images/branding/logo.png`, ours), a cover image (one stock hero) and
 * opening hours (five distinct strings across 128 branches). A naive "is the column populated" check would
 * report 128 dealerships fully onboarded, and the growth metric the Founder is trying to steer by would be
 * measuring seed data.
 */

export type ReadinessStatus = "complete" | "outstanding" | "unavailable";

/** Who can actually resolve the step. Determines which queue it belongs in, not merely how it is labelled. */
export type ReadinessOwner = "dealer" | "surf4cars" | "engineering";

export interface ReadinessStep {
  readonly id: string;
  readonly label: string;
  readonly status: ReadinessStatus;
  readonly owner: ReadinessOwner;
  /** What the dealership gains by completing it, in the terms they care about. */
  readonly why: string;
  /**
   * Weight toward the dealer health score. Reflects commercial consequence: a dealership nobody can phone
   * cannot trade at all, whereas a missing VAT number costs it nothing.
   */
  readonly weight: number;
}

export interface DealerReadiness {
  readonly dealershipId: string;
  readonly name: string;
  readonly isDemonstration: boolean;
  readonly steps: readonly ReadinessStep[];
  /** 0–100, weighted. Not a judgement — the list beneath it is the point. */
  readonly healthScore: number;
  readonly completedSteps: number;
  readonly totalSteps: number;
  /** The single most valuable next step, or null when nothing is outstanding. */
  readonly nextStep: ReadinessStep | null;
}

/** Everything the readiness model needs about one dealership. Assembled by the caller; this stays pure. */
export interface DealerReadinessInput {
  readonly id: string;
  readonly name: string;
  readonly isDemonstration: boolean;
  readonly onboardingStatus: string | null;
  readonly telephone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly registrationNumber: string | null;
  readonly vatNumber: string | null;
  /** Fields whose provenance is `dealer` or `verified`. Seed values are absent from this set. */
  readonly publishableFields: ReadonlySet<string>;
  readonly staffCount: number;
  readonly vehicleCount: number;
  readonly publishedCount: number;
  /** Listings carrying at least one photograph with provenance `dealer`. */
  readonly listingsWithDealerPhotography: number;
  readonly listingsWithEquipment: number;
}

const has = (value: string | null | undefined): boolean => String(value ?? "").trim().length > 0;

/**
 * The journey.
 *
 * Ordered as a dealership actually experiences it — identity, then reachability, then presentation, then
 * inventory — rather than by how easy each step is to measure. A console that lists work in measurement
 * order teaches nobody what to do next.
 */
export function buildDealerReadiness(input: DealerReadinessInput): DealerReadiness {
  const step = (
    id: string,
    label: string,
    complete: boolean,
    owner: ReadinessOwner,
    why: string,
    weight: number,
    unavailable = false,
  ): ReadinessStep => ({
    id,
    label,
    status: unavailable ? "unavailable" : complete ? "complete" : "outstanding",
    owner,
    why,
    weight,
  });

  const contactable = has(input.telephone) || has(input.whatsapp) || has(input.email);

  const steps: readonly ReadinessStep[] = [
    step(
      "account",
      "Account created",
      has(input.onboardingStatus),
      "dealer",
      "The dealership exists on the platform.",
      1,
    ),
    step(
      "business-verified",
      "Business verified",
      has(input.registrationNumber) || has(input.vatNumber),
      "surf4cars",
      "Buyers see a verified trading identity rather than an unknown name.",
      3,
    ),
    step(
      "contact-verified",
      "Contact details verified",
      contactable && input.publishableFields.has("contact"),
      "surf4cars",
      "Enquiries reach the dealership. Without this every listing is a dead end.",
      10,
    ),
    step(
      "logo",
      "Logo uploaded",
      input.publishableFields.has("logo"),
      "dealer",
      "The dealership appears as itself rather than as a set of initials.",
      2,
    ),
    step(
      "hero",
      "Hero image uploaded",
      input.publishableFields.has("cover_image"),
      "dealer",
      "The profile opens with the forecourt instead of a blank panel.",
      2,
    ),
    /*
      Two steps with nowhere to store their answer. Reported as `unavailable` rather than `outstanding`,
      because the dealership cannot complete them and listing them as dealer work would be blaming somebody
      for our gap. They belong to engineering until the column exists.
    */
    step(
      "story",
      "Dealership story completed",
      false,
      "engineering",
      "Buyers choosing between two dealerships read the story. No column exists to hold one yet.",
      2,
      true,
    ),
    step(
      "opening-hours",
      "Opening hours completed",
      input.publishableFields.has("opening_hours"),
      "dealer",
      "Buyers know when they can visit. Stored on the branch record and published as soon as provenance is dealer-supplied.",
      4,
    ),
    step(
      "staff",
      "Staff invited",
      input.staffCount > 0,
      "dealer",
      "Enquiries reach a person rather than an inbox nobody owns.",
      2,
    ),
    step(
      "inventory",
      "Inventory imported",
      input.vehicleCount > 0,
      "dealer",
      "There is something to sell.",
      8,
    ),
    step(
      "equipment",
      "Equipment captured",
      input.vehicleCount > 0 && input.listingsWithEquipment >= input.vehicleCount,
      "dealer",
      "Listings answer what each vehicle actually has, instead of leaving buyers to guess from the model name.",
      4,
    ),
    step(
      "photography",
      "Photography uploaded",
      input.vehicleCount > 0 && input.listingsWithDealerPhotography >= input.vehicleCount,
      "dealer",
      "Buyers see the actual vehicle. Until then listings carry an 'Illustrative image' label and convert poorly.",
      10,
    ),
    step(
      "first-listing",
      "First listing published",
      input.publishedCount > 0,
      "dealer",
      "The dealership is live in the marketplace.",
      6,
    ),
  ];

  /*
    Unavailable steps are excluded from the denominator.

    Scoring a dealership down for a field the platform cannot store would make the health score a measure of
    our backlog rather than of their readiness — and it would never reach 100 no matter what they did.
  */
  const scorable = steps.filter((item) => item.status !== "unavailable");
  const earned = scorable
    .filter((item) => item.status === "complete")
    .reduce((total, item) => total + item.weight, 0);
  const available = scorable.reduce((total, item) => total + item.weight, 0);

  const outstanding = steps
    .filter((item) => item.status === "outstanding")
    .sort((a, b) => b.weight - a.weight);

  return {
    dealershipId: input.id,
    name: input.name,
    isDemonstration: input.isDemonstration,
    steps,
    healthScore: available === 0 ? 100 : Math.round((earned / available) * 100),
    completedSteps: steps.filter((item) => item.status === "complete").length,
    totalSteps: scorable.length,
    nextStep: outstanding[0] ?? null,
  };
}

/**
 * Where a listing sits in the readiness pipeline (PRP-001 Phase 3).
 *
 * Derived rather than stored. A `stage` column would be a second source of truth that drifts the moment a
 * photograph is added without the column being updated — and the stage is always computable from what the
 * record holds, so storing it buys nothing and costs correctness.
 */
export type ListingStage =
  | "draft"
  | "needs-photos"
  | "needs-equipment"
  | "needs-description"
  | "ready-to-publish"
  | "published"
  | "featured-candidate";

export interface ListingStageInput {
  readonly lifecycleStatus: string | null;
  readonly hasDealerPhotography: boolean;
  readonly photographCount: number;
  readonly equipmentCount: number;
  readonly descriptionLength: number;
}

/** The first unmet requirement, in the order a buyer notices them. */
export function resolveListingStage(input: ListingStageInput): ListingStage {
  if (input.lifecycleStatus !== "published") return "draft";

  /* Published listings are ordered by what most damages the listing, not by workflow convenience: a buyer
     abandons over photography long before they notice a thin description. */
  if (!input.hasDealerPhotography) return "needs-photos";
  if (input.equipmentCount === 0) return "needs-equipment";
  if (input.descriptionLength < 120) return "needs-description";
  if (input.photographCount >= 6) return "featured-candidate";
  return "published";
}

export const LISTING_STAGE_LABELS: Readonly<Record<ListingStage, string>> = {
  draft: "Draft",
  "needs-photos": "Needs photos",
  "needs-equipment": "Needs equipment",
  "needs-description": "Needs description",
  "ready-to-publish": "Ready to publish",
  published: "Published",
  "featured-candidate": "Featured candidate",
};
