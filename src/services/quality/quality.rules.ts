/**
 * The Founder Quality Centre — the rules.
 *
 * Every rule, and the assembly of them into a report. Pure by construction: relative imports only, no
 * Supabase, no logger, no clock. `quality.service.ts` supplies the records; this decides what is wrong with
 * them.
 *
 * The purity is load-bearing rather than stylistic. It is what lets `scripts/pcp015c-quality-verify.mjs`
 * import this module directly under Node's TypeScript stripping and produce the identical report the page
 * produces — no `@/` alias resolution, no request context, no auth. One implementation, two front ends,
 * which is the only way the terminal output and the Quality Centre can be guaranteed to agree.
 *
 * WHY THIS READS THE DATABASE AND THE DATA QUALITY AUDIT DOES NOT
 * ==============================================================
 * `scripts/audit-data-quality.mjs` reads the running application on purpose, because what matters there is
 * what a customer is genuinely served after every presentation rule has run. This module is the complement:
 * it reads the records, because presentation rules are a safety net over a defect that still exists. The
 * dealer profile suppressed `https://example.com` for months while 128 records stayed wrong, and no page
 * scrape would ever have found them.
 *
 * Both are needed. A page audit finds what leaks through; a record audit finds what is waiting to.
 *
 * ON NOT INVENTING CERTAINTY
 * ==========================
 * Rules only fire where the platform can substantiate the claim. An address whose postal code falls in a
 * band this codebase cannot attribute to a province produces no finding — not a pass, not a warning. The
 * geography reference returns `null` for those and the rule skips them. Reporting a maybe as a defect is
 * the same failure as publishing a maybe as a fact.
 */
import { UNPRESENTABLE_VEHICLE_PHOTOGRAPHY } from "../../config/media/vehicle-photography-policy.ts";
import { buildVehicleSlug, slugify } from "../../utils/slugify.ts";

import {
  hasSuburb,
  isKnownProvince,
  provinceForCity,
  provinceForPostalCode,
} from "./south-africa-geography.ts";
import {
  SEVERITY_ORDER,
  type QualityCategory,
  type QualityDimension,
  type QualityCategorySummary,
  type QualityAction,
  type QualityFinding,
  type QualityReport,
  type QualitySeverity,
  type QualitySubject,
} from "./quality.types.ts";

const CATEGORY_LABELS: Readonly<Record<QualityCategory, string>> = {
  "dealer-contact": "Dealer contact",
  "dealer-address": "Dealer address",
  "dealer-verification": "Dealer verification",
  "vehicle-photography": "Photography",
  "vehicle-equipment": "Equipment",
  "vehicle-description": "Descriptions",
  "vehicle-duplicate": "Duplicates",
  administrative: "Administrative",
};

/**
 * Weights express customer harm, not rarity.
 *
 * A dealership a buyer cannot contact is the end of the journey — everything upstream of it was wasted. A
 * missing VAT number is invisible to every buyer who ever lived. Counting them equally would rank the
 * marketplace's most damaging defect below its most common one.
 */
const SEVERITY_WEIGHT: Readonly<Record<QualitySeverity, number>> = {
  critical: 10,
  high: 4,
  medium: 1,
};

/**
 * The declared rule set.
 *
 * Exists so that history can be trusted. A score is only comparable against a score produced by the same
 * rules: add a rule tomorrow and completeness falls, and the trend shows a marketplace going backwards on a
 * day when nothing about the marketplace changed. `ruleSetFingerprint()` hashes this list, every snapshot
 * records the hash, and two runs are comparable only when the hashes match.
 *
 * The registry is *enforced*, not merely documented — `assembleQualityReport` checks that every emitted
 * finding's rule appears here. A hand-maintained list that nobody validates is exactly the kind of thing
 * that drifts silently, and a fingerprint computed from a stale list would certify history as comparable
 * when it is not. Adding a rule without registering it fails loudly instead.
 */
export const RULE_SET: readonly {
  readonly rule: string;
  readonly dimension: QualityDimension;
  readonly severity: QualitySeverity;
}[] = [
  { rule: "dealer-uncontactable", dimension: "completeness", severity: "critical" },
  { rule: "dealer-contact-partial", dimension: "completeness", severity: "high" },
  { rule: "dealer-website-missing", dimension: "completeness", severity: "medium" },
  { rule: "address-province-unknown", dimension: "integrity", severity: "high" },
  { rule: "address-postal-province-mismatch", dimension: "integrity", severity: "high" },
  { rule: "address-city-province-mismatch", dimension: "integrity", severity: "high" },
  { rule: "address-suburb-missing", dimension: "completeness", severity: "medium" },
  { rule: "dealer-unverified-identity", dimension: "completeness", severity: "medium" },
  { rule: "photography-unpresentable", dimension: "integrity", severity: "critical" },
  { rule: "photography-stock-substituted", dimension: "completeness", severity: "critical" },
  { rule: "photography-absent", dimension: "completeness", severity: "critical" },
  { rule: "photography-no-exterior", dimension: "completeness", severity: "critical" },
  { rule: "photography-thin", dimension: "completeness", severity: "high" },
  { rule: "equipment-absent", dimension: "completeness", severity: "high" },
  { rule: "description-absent", dimension: "completeness", severity: "high" },
  { rule: "description-thin", dimension: "completeness", severity: "medium" },
  { rule: "vehicle-duplicate", dimension: "integrity", severity: "high" },
];

/** Bumped when the *shape* of the report changes, as opposed to the rules within it. */
export const ENGINE_VERSION = "prp002.1";

/**
 * A stable short hash of the rule set and its weights.
 *
 * FNV-1a rather than a crypto hash: this needs to be deterministic and dependency-free so the identical
 * value is produced by the server, by the capture script under Node's TypeScript stripping, and by CI.
 * Collision resistance is irrelevant — the question asked of it is only ever "is this the same rule set".
 */
export function ruleSetFingerprint(): string {
  const canonical = [...RULE_SET]
    .map((entry) => `${entry.rule}:${entry.dimension}:${entry.severity}:${SEVERITY_WEIGHT[entry.severity]}`)
    .sort()
    .join("|");

  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i += 1) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export interface DealerRow {
  id: string;
  business_name: string | null;
  trading_name: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  physical_address: string | null;
  telephone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  registration_number: string | null;
  vat_number: string | null;
  onboarding_status: string | null;
  is_demonstration: boolean | null;
}

export interface VehicleRow {
  id: string;
  dealership_id: string | null;
  title: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage_km: number | null;
  description: string | null;
  lifecycle_status: string | null;
}

export interface MediaRow {
  vehicle_id: string | null;
  file_url: string | null;
}

const dealerSubject = (row: DealerRow): QualitySubject => {
  const name = (row.trading_name ?? row.business_name ?? row.id).trim();
  return {
    kind: "dealer",
    id: row.id,
    name,
    href: name ? `/dealers/${slugify(name)}` : null,
    isDemonstration: row.is_demonstration === true,
  };
};

const finding = (
  subject: QualitySubject,
  rule: string,
  category: QualityCategory,
  dimension: QualityDimension,
  severity: QualitySeverity,
  problem: string,
  remedy: string,
  evidence: string | null = null,
): QualityFinding => ({
  id: `${subject.kind}:${subject.id}:${rule}`,
  rule,
  category,
  dimension,
  severity,
  subject,
  problem,
  remedy,
  evidence,
});

const blank = (value: string | null | undefined): boolean => String(value ?? "").trim().length === 0;

/* ── Dealer rules ────────────────────────────────────────────────────────────────────────────────────── */

function auditDealer(row: DealerRow): QualityFinding[] {
  const subject = dealerSubject(row);
  const out: QualityFinding[] = [];

  const noPhone = blank(row.telephone) && blank(row.whatsapp);
  const noEmail = blank(row.email);

  /*
    Contactability is the marketplace's whole purpose. A listing that cannot end in a conversation has
    wasted every rand spent bringing the buyer to it, so this is the one dealer defect that is critical on
    its own rather than in aggregate.
  */
  if (noPhone && noEmail) {
    out.push(
      finding(
        subject,
        "dealer-uncontactable",
        "dealer-contact",
        "completeness",
        "critical",
        "A buyer cannot reach this dealership by any means — no telephone, no WhatsApp, no email address.",
        "Capture at least one verified contact method, or unpublish the dealership until one exists.",
      ),
    );
  } else if (noPhone || noEmail) {
    out.push(
      finding(
        subject,
        "dealer-contact-partial",
        "dealer-contact",
        "completeness",
        "high",
        noPhone
          ? "No telephone or WhatsApp number. Buyers who prefer to call have no route to this dealership."
          : "No email address. Buyers who prefer to write have no route to this dealership.",
        noPhone ? "Capture a verified telephone or WhatsApp number." : "Capture a verified email address.",
      ),
    );
  }

  if (blank(row.website)) {
    out.push(
      finding(
        subject,
        "dealer-website-missing",
        "dealer-contact",
        "completeness",
        "medium",
        "No website recorded. Buyers researching a dealership before visiting find nothing.",
        "Ask the dealership for its website. Never derive one from the business name — generated domains have resolved to unrelated real businesses.",
      ),
    );
  }

  /*
    Address consistency.

    These fire only where the geography reference can substantiate the claim; an indeterminate postal band
    yields nothing at all. See `south-africa-geography.ts` — a false accusation here costs more trust in the
    report than the defect it would have caught.
  */
  const statedProvince = row.province;
  const postalProvince = provinceForPostalCode(row.postal_code);
  const cityProvince = provinceForCity(row.city);

  if (!isKnownProvince(statedProvince)) {
    out.push(
      finding(
        subject,
        "address-province-unknown",
        "dealer-address",
        "integrity",
        "high",
        "The province on this record is not one of South Africa's nine.",
        "Correct the province.",
        String(statedProvince ?? "(empty)"),
      ),
    );
  } else {
    if (postalProvince && postalProvince !== statedProvince) {
      out.push(
        finding(
          subject,
          "address-postal-province-mismatch",
          "dealer-address",
          "integrity",
          "high",
          `Postal code ${row.postal_code} is allocated to ${postalProvince}, but the record says ${statedProvince}. One of the two is wrong, so the address cannot be trusted for directions or delivery.`,
          "Confirm the physical address with the dealership and correct whichever field is wrong.",
          `${row.postal_code} · ${statedProvince}`,
        ),
      );
    }

    if (cityProvince && cityProvince !== statedProvince) {
      out.push(
        finding(
          subject,
          "address-city-province-mismatch",
          "dealer-address",
          "integrity",
          "high",
          `${row.city} is in ${cityProvince}, but the record says ${statedProvince}.`,
          "Confirm the physical address with the dealership and correct whichever field is wrong.",
          `${row.city} · ${statedProvince}`,
        ),
      );
    }
  }

  if (!hasSuburb(row.physical_address)) {
    out.push(
      finding(
        subject,
        "address-suburb-missing",
        "dealer-address",
        "completeness",
        "medium",
        "The street address names no suburb. In a metro this is not enough for a buyer to find the forecourt.",
        "Ask the dealership for the suburb and append it to the address.",
        String(row.physical_address ?? "(empty)"),
      ),
    );
  }

  /*
    Opening hours have no column anywhere in the schema, so every dealership is missing them and reporting
    128 identical findings would bury everything else. Raised once, as a platform gap, by the caller.
  */

  if (blank(row.registration_number) && blank(row.vat_number)) {
    out.push(
      finding(
        subject,
        "dealer-unverified-identity",
        "dealer-verification",
        "completeness",
        "medium",
        "Neither a company registration number nor a VAT number is recorded, so the trading identity is unverified.",
        "Capture the CIPC registration number during verification. Note that a sole proprietor legitimately has neither — record the verification outcome rather than inventing an identifier.",
      ),
    );
  }

  return out;
}

/* ── Vehicle rules ───────────────────────────────────────────────────────────────────────────────────── */

/* The single source of truth for what the presentation layer refuses to publish, reused rather than
   restated — a second copy of this list would drift and the report would stop describing the site. */
const UNPRESENTABLE = UNPRESENTABLE_VEHICLE_PHOTOGRAPHY;

/**
 * May this frame lead a card?
 *
 * The same question `resolvePrimaryImageUrl` asks, answered from the only signal available here: the
 * file name. This audit reads media rows rather than projected records, so it has a URL and no
 * category column — and deriving from the name is what the projection now does too, because the
 * category the database carried was the literal `"exterior"` on every photograph ever written.
 *
 * Kept deliberately conservative. A name this cannot classify counts as *not* lead-eligible, so the
 * failure mode is a finding a Founder dismisses rather than a broken listing nobody is told about.
 */
const LEAD_ELIGIBLE_VIEWS = ["front", "rear", "side", "exterior", "profile", "three-quarter"];
const NON_LEAD_VIEWS = ["interior", "dashboard", "dash", "cabin", "engine", "motor", "wheel", "rim", "tyre", "boot", "trunk", "cargo", "seat"];

function isLeadEligiblePhoto(url: string): boolean {
  const haystack = url.toLowerCase();
  if (NON_LEAD_VIEWS.some((view) => haystack.includes(view))) return false;
  return LEAD_ELIGIBLE_VIEWS.some((view) => haystack.includes(view));
}

function auditVehicles(
  vehicles: readonly VehicleRow[],
  mediaByVehicle: ReadonlyMap<string, readonly string[]>,
  equipmentCounts: ReadonlyMap<string, number>,
  dealerById: ReadonlyMap<string, DealerRow>,
): QualityFinding[] {
  const out: QualityFinding[] = [];

  const subjectFor = (row: VehicleRow): QualitySubject => {
    const dealer = row.dealership_id ? dealerById.get(row.dealership_id) : undefined;
    const title = (row.title ?? `${row.year ?? ""} ${row.make ?? ""} ${row.model ?? ""}`).trim();
    return {
      kind: "vehicle",
      id: row.id,
      name: title || row.id,
      /* buildVehicleSlug, never a hand-rolled concatenation: the id is truncated to eight characters in
         the real route, so `${slugify(title)}-${row.id}` produces a URL that 404s. */
      href: title ? `/vehicle/${buildVehicleSlug(title, row.id)}` : null,
      isDemonstration: dealer?.is_demonstration === true,
    };
  };

  for (const row of vehicles) {
    const subject = subjectFor(row);
    const photos = mediaByVehicle.get(row.id) ?? [];

    const banned = photos.filter((url) => UNPRESENTABLE.has(url));
    if (banned.length > 0) {
      out.push(
        finding(
          subject,
          "photography-unpresentable",
          "vehicle-photography",
          "integrity",
          "critical",
          `Holds ${banned.length} photograph(s) the presentation layer refuses to publish. The listing is being shown with fewer images than the record claims.`,
          "Replace the file on the record. Suppression is a safety net, not a fix.",
          banned[0] ?? null,
        ),
      );
    }

    const publishable = photos.filter((url) => !UNPRESENTABLE.has(url));

    /*
      Stock photography presented as the vehicle.

      Every image under /images/vehicles/library/ is a generic photograph keyed on make and model, not a
      photograph of the car being sold. Nothing on the listing says so, which makes it the same defect class
      as the fabricated dealer websites: plausible, customer-facing, and believed. A buyer deciding on
      condition from a picture of a different car is the most expensive way this platform can mislead
      someone.

      Counted as critical whether or not the record also has "real" media, because the harm is the
      substitution itself rather than the absence.
    */
    const stock = photos.filter((url) => url.startsWith("/images/vehicles/library/"));
    const showsOnlyStock = photos.length === 0 || (stock.length > 0 && stock.length === photos.length);

    if (showsOnlyStock) {
      out.push(
        finding(
          subject,
          "photography-stock-substituted",
          "vehicle-photography",
          "completeness",
          "critical",
          photos.length === 0
            ? "No photograph of this vehicle exists. The listing shows an honest \"Photographs coming soon\" placeholder, so nobody is misled — but a buyer cannot assess a car they cannot see."
            : "Every photograph is generic library stock for the make and model, not the vehicle being sold. The gallery labels it \"Illustrative image\", so the listing is honest — but the buyer still cannot judge this car's colour, trim or condition.",
          "Capture photographs of the actual vehicle and store them with provenance 'dealer'. The label is a disclosure, not a substitute.",
          stock[0] ?? "(render-time library fallback)",
        ),
      );
    }

    /* `photography-absent` is deliberately not raised for the fallback case: those listings do render an
       image, just the wrong one, and that is `photography-stock-substituted` above. Raising both would
       double-count the same customer experience. */
    if (publishable.length === 0 && photos.length > 0) {
      out.push(
        finding(
          subject,
          "photography-absent",
          "vehicle-photography",
          "completeness",
          "critical",
          "Every photograph on the record is suppressed by the presentation layer. The card and the page both render \"Photographs to follow\" — honest, and unsellable.",
          "Replace the suppressed files with usable photographs of the vehicle.",
        ),
      );
    } else if (publishable.length > 0 && !publishable.some(isLeadEligiblePhoto)) {
      /*
        Publishable photographs, none of which may lead.

        A card's lead image has to be a picture of the car, so the projection will not promote an
        interior, a dashboard or a wheel into that slot — it renders "Photographs to follow" instead.
        The listing therefore looks unphotographed on every grid on the platform while its record
        holds four or five perfectly good frames, and no other rule here sees it: the photographs are
        neither suppressed, nor absent, nor thin.

        This is how the defect was actually found. Two of the marketplace's best-known models — the
        Hilux Raider and the Corolla — had every exterior frame denied by the photography policy and
        silently fell through to an instrument cluster, which the lead-image rule then refused. The
        cars vanished visually from a marketplace that was still counting them.
      */
      out.push(
        finding(
          subject,
          "photography-no-exterior",
          "vehicle-photography",
          "completeness",
          "critical",
          `Holds ${publishable.length} publishable photograph(s) but not one exterior, so no frame is eligible to lead. Every card for this vehicle renders "Photographs to follow" while the gallery is full.`,
          "Add a front three-quarter or side view. One exterior frame restores the listing everywhere it appears.",
          publishable[0] ?? null,
        ),
      );
    } else if (publishable.length > 0 && publishable.length < 4) {
      out.push(
        finding(
          subject,
          "photography-thin",
          "vehicle-photography",
          "completeness",
          "high",
          `Only ${publishable.length} publishable photograph(s). Buyers treat a thin gallery as something being hidden.`,
          "Capture the standard set: front three-quarter, rear three-quarter, interior, dashboard.",
        ),
      );
    }

    if ((equipmentCounts.get(row.id) ?? 0) === 0) {
      out.push(
        finding(
          subject,
          "equipment-absent",
          "vehicle-equipment",
          "completeness",
          "high",
          "No equipment recorded, so the listing cannot answer what the vehicle actually has.",
          "Capture equipment against the catalogue. Never infer specification from the model name.",
        ),
      );
    }

    const description = String(row.description ?? "").trim();
    if (description.length === 0) {
      out.push(
        finding(
          subject,
          "description-absent",
          "vehicle-description",
          "completeness",
          "high",
          "No description. The listing gives a buyer nothing beyond the specification table.",
          "Write a description covering condition, history and what the vehicle is good at.",
        ),
      );
    } else if (description.length < 120) {
      out.push(
        finding(
          subject,
          "description-thin",
          "vehicle-description",
          "completeness",
          "medium",
          "The description is too short to answer a buyer's questions.",
          "Expand to cover condition, service history and why this example is worth seeing.",
        ),
      );
    }
  }

  /*
    Duplicates.

    Keyed on the attributes a buyer would use to decide two listings are the same car — same dealer, make,
    model, year and mileage. Mileage is what makes this safe: two genuinely different cars of the same model
    and year almost never share an odometer reading to the kilometre.
  */
  const byFingerprint = new Map<string, VehicleRow[]>();
  for (const row of vehicles) {
    if (row.mileage_km === null || row.mileage_km === undefined) continue;
    const key = [row.dealership_id, row.make, row.model, row.year, row.mileage_km].join("|").toLowerCase();
    byFingerprint.set(key, [...(byFingerprint.get(key) ?? []), row]);
  }

  for (const group of byFingerprint.values()) {
    if (group.length < 2) continue;
    for (const row of group.slice(1)) {
      out.push(
        finding(
          subjectFor(row),
          "vehicle-duplicate",
          "vehicle-duplicate",
          "integrity",
          "high",
          `Indistinguishable from ${group.length - 1} other listing(s) at the same dealership — same make, model, year and odometer reading. Buyers reading a marketplace that repeats itself assume the stock is padded.`,
          "Confirm whether these are genuinely separate vehicles. If so, differentiate them by VIN and photography; if not, archive the duplicates.",
          `${row.make} ${row.model} ${row.year} · ${row.mileage_km} km`,
        ),
      );
    }
  }

  return out;
}

/* ── Engine ──────────────────────────────────────────────────────────────────────────────────────────── */

function summarise(findings: readonly QualityFinding[]): QualityCategorySummary[] {
  const byCategory = new Map<QualityCategory, QualityCategorySummary>();

  for (const item of findings) {
    const existing = byCategory.get(item.category) ?? {
      category: item.category,
      label: CATEGORY_LABELS[item.category],
      critical: 0,
      high: 0,
      medium: 0,
      total: 0,
    };
    byCategory.set(item.category, {
      ...existing,
      [item.severity]: existing[item.severity] + 1,
      total: existing.total + 1,
    } as QualityCategorySummary);
  }

  return [...byCategory.values()].sort((a, b) => b.critical - a.critical || b.total - a.total);
}

/**
 * Trust score.
 *
 * Harm is capped per record before it is summed. The first version summed every finding against a flat
 * budget and returned 0 for a marketplace that was bad but not uniformly bad — once the total exceeded the
 * budget the number stopped moving, so fixing a hundred listings would have shown no improvement at all. A
 * score that cannot register progress is worse than no score, because it gets trusted for one release and
 * then ignored.
 *
 * Capping at the critical weight encodes the real ceiling: a single record can be completely untrustworthy,
 * and no further defect on that same record makes the marketplace worse than that. So the denominator is
 * "every record is as bad as it can be", and the score is the distance from it.
 *
 * 100 means every rule the platform currently knows how to check passes. It never means the data is beyond
 * improvement, which is why the page shows the next actions beside it rather than the score alone.
 */
function scoreDimension(findings: readonly QualityFinding[], subjectsAudited: number): number {
  if (subjectsAudited === 0) return 100;

  const harmBySubject = new Map<string, number>();
  for (const item of findings) {
    const key = `${item.subject.kind}:${item.subject.id}`;
    const next = (harmBySubject.get(key) ?? 0) + SEVERITY_WEIGHT[item.severity];
    harmBySubject.set(key, Math.min(next, SEVERITY_WEIGHT.critical));
  }

  const harm = [...harmBySubject.values()].reduce((total, value) => total + value, 0);
  const worstCase = subjectsAudited * SEVERITY_WEIGHT.critical;
  return Math.max(0, Math.round(100 - (harm / worstCase) * 100));
}

/**
 * Groups findings into decisions.
 *
 * One entry per rule, carrying how many records it affects and a few named examples. Ordered by total harm
 * — severity multiplied by reach — so the top of the list is genuinely the most valuable afternoon's work
 * and not merely the most severe single row.
 */
function toActions(findings: readonly QualityFinding[]): QualityAction[] {
  const byRule = new Map<string, QualityFinding[]>();
  for (const item of findings) {
    byRule.set(item.rule, [...(byRule.get(item.rule) ?? []), item]);
  }

  return [...byRule.values()]
    .map((group) => {
      const head = group[0]!;
      return {
        rule: head.rule,
        category: head.category,
        dimension: head.dimension,
        severity: head.severity,
        affected: group.length,
        problem: head.problem,
        remedy: head.remedy,
        examples: group.slice(0, 3).map((item) => item.subject),
      };
    })
    .sort(
      (a, b) =>
        SEVERITY_WEIGHT[b.severity] * b.affected - SEVERITY_WEIGHT[a.severity] * a.affected ||
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );
}

const orderFindings = (findings: readonly QualityFinding[]): QualityFinding[] =>
  [...findings].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.category.localeCompare(b.category) ||
      a.subject.name.localeCompare(b.subject.name),
  );

/**
 * The rules, applied to records already in hand.
 *
 * Pure on purpose: no Supabase, no request context, no clock. That is what lets
 * `scripts/pcp015c-quality-verify.mjs` run the identical logic from the command line without an operations
 * login — the Founder Quality Centre is behind portal auth, and a quality engine nobody can run outside a
 * browser session is one nobody checks. The page and the script cannot drift, because there is one
 * implementation and both call it.
 */
export function assembleQualityReport(input: {
  readonly dealers: readonly DealerRow[];
  readonly vehicles: readonly VehicleRow[];
  readonly media: readonly MediaRow[];
  readonly equipment: readonly { vehicle_id: string | null }[];
  readonly generatedAt: string;
}): QualityReport {
  const { dealers, vehicles, media, equipment, generatedAt } = input;

  const dealerById = new Map(dealers.map((row) => [row.id, row]));

  const mediaByVehicle = new Map<string, string[]>();
  for (const row of media) {
    if (!row.vehicle_id) continue;
    const list = mediaByVehicle.get(row.vehicle_id) ?? [];
    if (row.file_url) list.push(row.file_url);
    mediaByVehicle.set(row.vehicle_id, list);
  }

  const equipmentCounts = new Map<string, number>();
  for (const row of equipment) {
    if (!row.vehicle_id) continue;
    equipmentCounts.set(row.vehicle_id, (equipmentCounts.get(row.vehicle_id) ?? 0) + 1);
  }

  /*
    Published listings only.

    The first run audited all 330 vehicle records and reported 125 listings with no photograph — but 101 of
    those were `deleted`, `archived` or `draft`, which no customer can reach. A quality centre that sends the
    Founder to fix invisible records burns the credibility it needs, and buries the findings that matter
    underneath. Only what a buyer can actually be served is scored.
  */
  const publishedVehicles = vehicles.filter((row) => row.lifecycle_status === "published");

  const all = [
    ...dealers.flatMap(auditDealer),
    ...auditVehicles(publishedVehicles, mediaByVehicle, equipmentCounts, dealerById),
  ];

  /* Registry enforcement. An unregistered rule means the fingerprint no longer describes the rules that
     actually ran, which would silently certify two incomparable runs as comparable. */
  const registered = new Set(RULE_SET.map((entry) => entry.rule));
  const unregistered = [...new Set(all.map((item) => item.rule))].filter((rule) => !registered.has(rule));
  if (unregistered.length > 0) {
    throw new Error(
      `Quality rules missing from RULE_SET: ${unregistered.join(", ")}. ` +
        "Register them, or the rule-set fingerprint will misrepresent this run's comparability.",
    );
  }

  const production = orderFindings(all.filter((item) => !item.subject.isDemonstration));
  const demonstration = orderFindings(all.filter((item) => item.subject.isDemonstration));

  const productionDealers = dealers.filter((row) => row.is_demonstration !== true);
  const productionVehicles = publishedVehicles.filter(
    (row) => !(row.dealership_id && dealerById.get(row.dealership_id)?.is_demonstration),
  );

  return {
    generatedAt,
    findings: production,
    demonstrationFindings: demonstration,
    categories: summarise(production),
    dealersAudited: productionDealers.length,
    vehiclesAudited: productionVehicles.length,
    demonstrationDealers: dealers.length - productionDealers.length,
    integrityScore: scoreDimension(
      production.filter((item) => item.dimension === "integrity"),
      productionDealers.length + productionVehicles.length,
    ),
    completenessScore: scoreDimension(
      production.filter((item) => item.dimension === "completeness"),
      productionDealers.length + productionVehicles.length,
    ),
    nextActions: toActions(production).slice(0, 10),
    incomplete: null,
  };
}

