/**
 * Verification policy — what each claim type requires, and for how long a verification stands.
 *
 * Declarative and in code rather than in a table, for the same reason `RULE_SET` is: policy changes are
 * reviewable, diffable, type-checked, and versioned alongside the behaviour they govern. A policy row edited
 * in a database at 11pm has no reviewer and no history. Moving these to a table later is a data migration,
 * not a redesign — the shape is already serialisable.
 *
 * DESIGNED FOR VYRON, NOT ONLY SURF4CARS
 * ======================================
 * Nothing in the framework knows what a dealership is. `subject_kind`, `claimType` and `EvidenceKind` are
 * open vocabularies; a product supplies its own registry and gets queues, lifecycle, evidence and audit for
 * free. VYRON COST would register `supplier-tax-clearance`; Child Compass would register
 * `professional-registration`. Neither needs a schema change.
 *
 * THE PART THAT IS EASY TO GET WRONG
 * ==================================
 * `expiresAfterDays` is not housekeeping. A verification with no expiry is a statement about the past
 * presented as a statement about the present — "verified" on a dealership that moved premises two years ago
 * is worse than unverified, because it carries our authority. Opening hours change seasonally; a VAT
 * registration can be deregistered. Anything that can change in the world must expire.
 *
 * `null` means "does not expire", and it is reserved for claims about immutable historical facts. Reach for
 * it rarely and never for convenience.
 */

/** Open vocabulary. A product registers its own kinds; the framework treats them as opaque. */
export type EvidenceKind =
  | "business-registration"
  | "vat-certificate"
  | "utility-bill"
  | "dealer-photograph"
  | "manufacturer-feed"
  | "vehicle-registration"
  | "identity-document"
  | "signed-declaration"
  | "dealer-confirmation"
  | "staff-inspection";

export type VerificationMethod =
  | "manual-review"
  | "dealer-confirmation"
  | "document-check"
  | "manufacturer-feed"
  | "automated-validation";

export interface ClaimPolicy {
  readonly claimType: string;
  readonly subjectKind: string;
  /** What a customer would understand this claim to assert. Rendered in the workspace and the queue. */
  readonly label: string;
  /**
   * Any one of these satisfies the claim. Expressed as alternatives rather than a checklist because
   * verification routes differ in cost: a dealer confirming their own opening hours is legitimate and cheap,
   * whereas a VAT registration needs a document.
   */
  readonly acceptableEvidence: readonly EvidenceKind[];
  readonly methods: readonly VerificationMethod[];
  /** Null only for claims about facts that cannot change. See the module note. */
  readonly expiresAfterDays: number | null;
  /**
   * What a customer loses if this claim is wrong. Drives queue priority — not how hard it is to verify, and
   * not how many are waiting.
   */
  readonly customerImpact: "critical" | "high" | "medium";
  /** True where the claim is rendered on a public page. Wrong *and* visible outranks wrong and internal. */
  readonly marketplaceVisible: boolean;
}

/**
 * SURF4CARS' registry.
 *
 * Claim types match the vocabulary already in `verification_claims.claim_type`, which came from the
 * migrated provenance fields. Deliberately claim-shaped rather than column-shaped: `address` is one claim
 * across four columns, because "this dealership's address has been verified" is what a customer understands.
 */
export const SURF4CARS_CLAIM_POLICIES: readonly ClaimPolicy[] = [
  {
    claimType: "address",
    subjectKind: "dealer",
    label: "Dealership address",
    acceptableEvidence: ["business-registration", "utility-bill", "staff-inspection"],
    methods: ["document-check", "manual-review"],
    /* Premises move. Two years is long enough not to harass dealers, short enough that a stale address is
       caught before a buyer drives to it. */
    expiresAfterDays: 730,
    customerImpact: "high",
    marketplaceVisible: true,
  },
  {
    claimType: "contact",
    subjectKind: "dealer",
    label: "Contact details",
    acceptableEvidence: ["dealer-confirmation", "staff-inspection"],
    methods: ["dealer-confirmation", "manual-review", "automated-validation"],
    /* The highest-impact claim on the platform: every listing at an uncontactable dealership is a dead end.
       One year, because numbers change and a dead line is invisible until a buyer hits it. */
    expiresAfterDays: 365,
    customerImpact: "critical",
    marketplaceVisible: true,
  },
  {
    claimType: "opening_hours",
    subjectKind: "dealer",
    label: "Opening hours",
    acceptableEvidence: ["dealer-confirmation"],
    methods: ["dealer-confirmation"],
    /* Seasonal. A buyer who drives to a closed forecourt on our word does not blame the record. */
    expiresAfterDays: 180,
    customerImpact: "medium",
    marketplaceVisible: true,
  },
  {
    claimType: "logo",
    subjectKind: "dealer",
    label: "Dealer logo",
    acceptableEvidence: ["dealer-confirmation"],
    methods: ["dealer-confirmation", "manual-review"],
    expiresAfterDays: null, // A supplied logo does not go stale.
    customerImpact: "medium",
    marketplaceVisible: true,
  },
  {
    claimType: "cover_image",
    subjectKind: "dealer",
    label: "Dealer hero image",
    acceptableEvidence: ["dealer-confirmation", "dealer-photograph"],
    methods: ["dealer-confirmation", "manual-review"],
    expiresAfterDays: null,
    customerImpact: "medium",
    marketplaceVisible: true,
  },
  {
    claimType: "company_registration",
    subjectKind: "dealer",
    label: "Company registration",
    acceptableEvidence: ["business-registration"],
    methods: ["document-check", "automated-validation"],
    /* CIPC status can lapse. Annual re-check matches the filing cycle. */
    expiresAfterDays: 365,
    customerImpact: "high",
    marketplaceVisible: false,
  },
  {
    claimType: "vat_registration",
    subjectKind: "dealer",
    label: "VAT registration",
    acceptableEvidence: ["vat-certificate"],
    methods: ["document-check", "automated-validation"],
    expiresAfterDays: 365,
    customerImpact: "medium",
    marketplaceVisible: false,
  },
  {
    claimType: "vehicle_photographs",
    subjectKind: "listing",
    label: "Vehicle photographs",
    acceptableEvidence: ["dealer-photograph", "manufacturer-feed"],
    methods: ["dealer-confirmation", "manufacturer-feed", "manual-review"],
    /* Tied to the listing's life, not the calendar: photographs of a car that is still for sale remain
       accurate. Expiry here would generate work without improving anything. */
    expiresAfterDays: null,
    customerImpact: "critical",
    marketplaceVisible: true,
  },
  {
    claimType: "vehicle_equipment",
    subjectKind: "listing",
    label: "Vehicle equipment",
    acceptableEvidence: ["dealer-confirmation", "manufacturer-feed", "vehicle-registration"],
    methods: ["dealer-confirmation", "manufacturer-feed", "manual-review"],
    expiresAfterDays: null,
    customerImpact: "high",
    marketplaceVisible: true,
  },
  {
    claimType: "vehicle_mileage",
    subjectKind: "listing",
    label: "Odometer reading",
    acceptableEvidence: ["vehicle-registration", "staff-inspection", "signed-declaration"],
    methods: ["document-check", "manual-review"],
    /* Mileage rises while a car is in stock. A reading verified six months ago is no longer the reading. */
    expiresAfterDays: 90,
    customerImpact: "critical",
    marketplaceVisible: true,
  },
  {
    claimType: "service_history",
    subjectKind: "listing",
    label: "Service history",
    acceptableEvidence: ["signed-declaration", "vehicle-registration", "staff-inspection"],
    methods: ["document-check", "manual-review"],
    expiresAfterDays: null, // A statement about the past.
    customerImpact: "high",
    marketplaceVisible: true,
  },
];

const BY_TYPE = new Map(SURF4CARS_CLAIM_POLICIES.map((p) => [`${p.subjectKind}:${p.claimType}`, p]));

/**
 * The policy for a claim, or null where none is registered.
 *
 * Null is meaningful and must not be defaulted away: an unregistered claim type is a claim nobody has
 * decided how to verify, and quietly treating it as "manual review, never expires" would invent a policy.
 * The queue surfaces these as unroutable rather than guessing.
 */
export function policyFor(subjectKind: string, claimType: string): ClaimPolicy | null {
  return BY_TYPE.get(`${subjectKind}:${claimType}`) ?? null;
}

/** Verification expiry for a claim verified now, or null where the policy says it does not expire. */
export function expiryFor(policy: ClaimPolicy, verifiedAt: Date): Date | null {
  if (policy.expiresAfterDays === null) return null;
  const expires = new Date(verifiedAt);
  expires.setUTCDate(expires.getUTCDate() + policy.expiresAfterDays);
  return expires;
}
