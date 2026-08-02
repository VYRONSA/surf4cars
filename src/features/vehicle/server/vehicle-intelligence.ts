/**
 * Vehicle intelligence, computed from the marketplace's own stock.
 *
 * WHAT THIS IS ALLOWED TO SAY
 * ===========================
 * Only things a buyer could verify by running the same search. Every statement below is arithmetic
 * over vehicles genuinely published on SURF4CARS right now — no valuation model, no market feed, no
 * "estimated worth", no inference about condition. Where the comparison set is too small to support
 * a claim, the claim is not made and the section does not render.
 *
 * That constraint is the whole product. A confident wrong valuation costs a buyer money and costs
 * the platform the only asset it actually has, which is that its numbers can be checked.
 *
 * THE PEER SET IS THE HARD PART
 * =============================
 * Every comparative statement needs a defensible basis, and the basis has to be *tight enough to be
 * fair*. Comparing a 2026 Corolla Cross against a 2015 one on price is not a comparison, it is a
 * category error dressed as insight. So peers are drawn in tiers:
 *
 *   statistics       same make, model and a ±3-year window — or no claim at all
 *   similar cars     same make and model, any year, with every difference stated on the row
 *
 * The separation is not fussiness. A first version let statistics fall back to the looser set, and a
 * 2026 measured against 2018–2024 listings reported "R315 000 above the median, priced above 100% of
 * them" — true arithmetic, false insight. Price falls with age: that car is not overpriced, it is
 * eight years newer.
 *
 * Variant is deliberately *not* matched on: variants split the set into ones and twos, and a buyer
 * comparing an XC60 B4 against other XC60s is doing the thing they came to do.
 *
 * CONFIDENCE IS STATED, NOT IMPLIED
 * =================================
 * The sample size travels with every number, and the wording weakens as the sample shrinks. Four
 * comparable cars cannot establish a market position; saying "below market" off four listings is how
 * a trustworthy module becomes a misleading one.
 */
import type { UnifiedVehicleRecord } from "@/domain/vehicle";
import { createLogger } from "@/lib/observability/logger";
import { getVehicleEngine } from "@/services/vehicle-engine";
import { isMarketplaceVisible } from "@/services/vehicle-engine/vehicle-projection.service";

const log = createLogger("vehicle-intelligence");

/* ── Thresholds ───────────────────────────────────────────────────────────────────────────────
   Named rather than inlined, because these are the judgements the whole module rests on and they
   should be arguable in one place.
   ──────────────────────────────────────────────────────────────────────────────────────────── */

/** Below this, a percentile is noise and no price position is offered. */
const MIN_FOR_PRICE = 4;
/** Below this, a median mileage is one car's odometer wearing a statistic's clothes. */
const MIN_FOR_MILEAGE = 4;
/** A price or mileage must differ from the median by this much before it is worth a sentence. */
const MATERIAL_DIFFERENCE = 0.12;
const MATERIAL_MILEAGE_DIFFERENCE = 0.2;
/** "Added this week" means added this week. */
const NEW_ARRIVAL_DAYS = 7;
/** At or below this many of a model listed, scarcity is a real fact about the marketplace. */
const RARE_AT_OR_BELOW = 3;
const YEAR_WINDOW = 3;

export type Confidence = "high" | "moderate" | "low";

export interface PeerBasis {
  /** Written for a buyer: "2023–2026 Toyota Corolla Cross". */
  readonly label: string;
  readonly kind: "make-model-year" | "make-model";
  /** Comparable vehicles, excluding this one. */
  readonly count: number;
  readonly confidence: Confidence;
}

export interface PriceIntelligence {
  readonly basis: PeerBasis;
  readonly standing: "below" | "around" | "above";
  readonly medianPrice: number;
  readonly lowestPrice: number;
  readonly highestPrice: number;
  /** Signed rand difference from the median. */
  readonly differenceFromMedian: number;
  /** 0–100: the share of comparables priced below this one. */
  readonly percentile: number;
}

export interface IntelligenceSignal {
  readonly id: string;
  readonly label: string;
  /** The arithmetic behind the label, so the claim can be checked. */
  readonly detail: string;
  readonly tone: "positive" | "neutral" | "caution";
}

export interface SimilarVehicle {
  /* The record id, not the slug, is the identity. Two published vehicles can share a slug — the
     discriminator is eight characters of the id, and short ids collide — which made `key={slug}`
     produce React's duplicate-key warning on a real listing. */
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly price: string;
  readonly priceNumeric: number;
  readonly imageSrc: string | null;
  readonly year: number;
  readonly mileageKm: number;
  readonly priceDelta: number;
  readonly yearDelta: number;
  readonly mileageDelta: number;
}

export interface BuyingEvidence {
  readonly id: string;
  readonly label: string;
  readonly present: boolean;
  readonly detail: string;
}

export interface VehicleIntelligence {
  readonly price: PriceIntelligence | null;
  readonly signals: readonly IntelligenceSignal[];
  readonly similar: readonly SimilarVehicle[];
  /** Why those vehicles and not others. Rendered beside them — never show unexplained cars. */
  readonly similarBasis: string | null;
  readonly evidence: readonly BuyingEvidence[];
}

/* ── Helpers ─────────────────────────────────────────────────────────────────────────────────── */

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
    : (sorted[middle] ?? 0);
};

const rand = (value: number) => `R ${Math.round(value).toLocaleString("en-ZA").replace(/,/g, " ")}`;
const km = (value: number) => `${Math.round(value).toLocaleString("en-ZA").replace(/,/g, " ")} km`;

/**
 * Sample size to stated confidence.
 *
 * The boundaries are judgement, not statistics — there is no significance test that makes twelve
 * used cars authoritative. They are set where the wording stops overstating: at twelve a median is
 * stable enough to lead with, at six it is worth mentioning with the count attached, and below that
 * it is an observation about a handful of cars and is described as one.
 */
const confidenceFor = (count: number): Confidence =>
  count >= 12 ? "high" : count >= 6 ? "moderate" : "low";

const priceOf = (record: UnifiedVehicleRecord) => Math.round(record.pricing.sellingPriceCents / 100);

/* ── Peer selection ──────────────────────────────────────────────────────────────────────────── */

interface PeerSelection {
  /**
   * The set every *statistic* is computed from: same model, within the year window.
   *
   * Null when fewer than `MIN_FOR_PRICE` exist, and that is the whole point of separating it from
   * `comparable` below: a median across an eight-year spread is not a market position, and dressing
   * one up as the other is the failure this module exists to avoid. See the note at the top.
   */
  readonly statistical: { readonly peers: readonly UnifiedVehicleRecord[]; readonly basis: PeerBasis } | null;
  /**
   * The looser set, used only for the *similar vehicles* list.
   *
   * Showing an older car alongside is useful when the age difference is stated beside it — and it is,
   * as a signed year delta on every row. A number in a sentence has no such qualifier, which is why
   * statistics may not use this set.
   */
  readonly comparable: readonly UnifiedVehicleRecord[];
  readonly comparableLabel: string | null;
}

function selectPeers(
  subject: UnifiedVehicleRecord,
  corpus: readonly UnifiedVehicleRecord[],
): PeerSelection {
  const make = subject.core.make?.trim();
  const model = subject.core.model?.trim();
  if (!make || !model) return { statistical: null, comparable: [], comparableLabel: null };

  const sameModel = corpus.filter(
    (record) =>
      record.id !== subject.id &&
      record.core.make?.trim() === make &&
      record.core.model?.trim() === model,
  );

  const withinYears = sameModel.filter(
    (record) => Math.abs((record.core.year ?? 0) - (subject.core.year ?? 0)) <= YEAR_WINDOW,
  );

  const statistical =
    withinYears.length >= MIN_FOR_PRICE
      ? (() => {
          const years = [...withinYears, subject].map((r) => r.core.year).filter(Boolean) as number[];
          const lowest = Math.min(...years);
          const highest = Math.max(...years);
          return {
            peers: withinYears,
            basis: {
              /* "2024–2024 BMW X5" is what a range reads as when every peer shares a year. */
              label: `${lowest === highest ? lowest : `${lowest}–${highest}`} ${make} ${model}`,
              kind: "make-model-year" as const,
              count: withinYears.length,
              confidence: confidenceFor(withinYears.length),
            },
          };
        })()
      : null;

  return {
    statistical,
    comparable: sameModel,
    comparableLabel: sameModel.length > 0 ? `${make} ${model}` : null,
  };
}

/* ── The module ──────────────────────────────────────────────────────────────────────────────── */

export interface VehicleIntelligenceInput {
  readonly id: string;
  readonly priceNumeric: number;
  readonly equipmentCount: number;
}

export async function loadVehicleIntelligence(
  input: VehicleIntelligenceInput,
): Promise<VehicleIntelligence | null> {
  try {
    const all = await getVehicleEngine().listPublishable();
    const corpus = all.filter(isMarketplaceVisible);
    const subject = corpus.find((record) => record.id === input.id);
    if (!subject) return null;

    const selection = selectPeers(subject, corpus);
    /* Statistics come from the year-windowed set only. Everything below that reads `peers` is making
       a numerical claim, and a numerical claim needs a like-for-like basis. */
    const peers = selection.statistical?.peers ?? [];
    const basis = selection.statistical?.basis ?? null;

    /* ── Price ───────────────────────────────────────────────────────────────────────────────── */
    let price: PriceIntelligence | null = null;
    if (basis && peers.length >= MIN_FOR_PRICE) {
      const prices = peers.map(priceOf);
      const medianPrice = median(prices);
      const ratio = medianPrice > 0 ? input.priceNumeric / medianPrice : 1;
      price = {
        basis,
        standing:
          ratio < 1 - MATERIAL_DIFFERENCE ? "below" : ratio > 1 + MATERIAL_DIFFERENCE ? "above" : "around",
        medianPrice,
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices),
        differenceFromMedian: input.priceNumeric - medianPrice,
        percentile: Math.round((prices.filter((p) => p < input.priceNumeric).length / prices.length) * 100),
      };
    }

    /* ── Signals ─────────────────────────────────────────────────────────────────────────────── */
    const signals: IntelligenceSignal[] = [];
    const make = subject.core.make?.trim() ?? "";
    const model = subject.core.model?.trim() ?? "";
    const modelName = [make, model].filter(Boolean).join(" ");

    if (basis && peers.length >= MIN_FOR_MILEAGE) {
      const mileages = peers.map((r) => r.core.mileageKm).filter((n) => Number.isFinite(n) && n > 0);
      const medianMileage = median(mileages);
      const mine = subject.core.mileageKm;
      if (medianMileage > 0 && mileages.length >= MIN_FOR_MILEAGE) {
        const delta = (mine - medianMileage) / medianMileage;
        if (delta <= -MATERIAL_MILEAGE_DIFFERENCE) {
          signals.push({
            id: "mileage-low",
            label: "Lower mileage than similar vehicles",
            detail: `${km(mine)} against a median of ${km(medianMileage)} across ${mileages.length} comparable listings.`,
            tone: "positive",
          });
        } else if (delta >= MATERIAL_MILEAGE_DIFFERENCE) {
          /*
            Shown, not hidden.
            =================
            A module that only ever says flattering things is advertising. The buyer is the one
            taking the risk, and higher mileage is exactly the fact they are on this page to find.
          */
          signals.push({
            id: "mileage-high",
            label: "Higher mileage than similar vehicles",
            detail: `${km(mine)} against a median of ${km(medianMileage)} across ${mileages.length} comparable listings.`,
            tone: "caution",
          });
        }
      }

      const cheaperPeers = peers.filter((r) => priceOf(r) < input.priceNumeric).length;
      if (cheaperPeers === 0) {
        signals.push({
          id: "price-lowest",
          label: `Lowest priced ${modelName} listed`,
          detail: `No other ${basis.label} on SURF4CARS is priced below this one — ${peers.length} compared.`,
          tone: "positive",
        });
      }

      const years = peers.map((r) => r.core.year).filter(Boolean) as number[];
      if (years.length > 0 && (subject.core.year ?? 0) > Math.max(...years)) {
        signals.push({
          id: "year-newest",
          label: `Newest ${modelName} listed`,
          detail: `A ${subject.core.year}, against ${years.length} others from ${Math.min(...years)} to ${Math.max(...years)}.`,
          tone: "positive",
        });
      }

      const mileagesAll = peers.map((r) => r.core.mileageKm).filter((n) => Number.isFinite(n) && n > 0);
      if (mileagesAll.length > 0 && subject.core.mileageKm > 0 && subject.core.mileageKm < Math.min(...mileagesAll)) {
        signals.push({
          id: "mileage-lowest",
          label: `Lowest mileage ${modelName} listed`,
          detail: `${km(subject.core.mileageKm)}, against a next-lowest of ${km(Math.min(...mileagesAll))}.`,
          tone: "positive",
        });
      }
    }

    /* Scarcity is a fact about the marketplace and needs no peer threshold — it *is* the count. */
    const sameModelCount =
      corpus.filter(
        (record) =>
          record.core.make?.trim() === make && record.core.model?.trim() === model,
      ).length;
    if (make && model && sameModelCount <= RARE_AT_OR_BELOW) {
      signals.push({
        id: "rare",
        label: sameModelCount === 1 ? `The only ${modelName} listed` : `One of only ${sameModelCount} listed`,
        detail: `SURF4CARS currently has ${sameModelCount} ${modelName}${sameModelCount === 1 ? "" : "s"} published.`,
        tone: "neutral",
      });
    }

    const addedAt = Date.parse(subject.dealer.dateAdded ?? "");
    if (Number.isFinite(addedAt)) {
      const days = Math.floor((Date.now() - addedAt) / 86_400_000);
      if (days >= 0 && days <= NEW_ARRIVAL_DAYS) {
        signals.push({
          id: "new-arrival",
          label: "New arrival",
          detail: days === 0 ? "Listed today." : `Listed ${days} day${days === 1 ? "" : "s"} ago.`,
          tone: "neutral",
        });
      }
    }

    /* ── Similar vehicles ────────────────────────────────────────────────────────────────────── */
    /* Ranked by closeness on the axes a buyer actually trades off, not by "relevance". */
    const similar: SimilarVehicle[] = selection.comparable
      .map((record) => ({
        record,
        distance:
          Math.abs(priceOf(record) - input.priceNumeric) / Math.max(input.priceNumeric, 1) +
          Math.abs((record.core.year ?? 0) - (subject.core.year ?? 0)) * 0.05 +
          Math.abs(record.core.mileageKm - subject.core.mileageKm) / 200_000,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(({ record }) => ({
        id: record.id,
        slug: record.slug,
        title: record.core.title,
        price: rand(priceOf(record)),
        priceNumeric: priceOf(record),
        imageSrc:
          record.media.photos.find((p) => p.isPrimary)?.url ?? record.media.photos[0]?.url ?? null,
        year: record.core.year ?? 0,
        mileageKm: record.core.mileageKm,
        priceDelta: priceOf(record) - input.priceNumeric,
        yearDelta: (record.core.year ?? 0) - (subject.core.year ?? 0),
        mileageDelta: record.core.mileageKm - subject.core.mileageKm,
      }));

    /* ── Buying evidence ─────────────────────────────────────────────────────────────────────── */
    /*
      Each row is a fact about *this listing's record*, not an assessment of the car.
      =============================================================================
      "VIN recorded", not "VIN decoded" — nothing here decodes it. "Registration number on file",
      not "registration verified" — nobody has checked it against a registry. The distinction is the
      entire difference between evidence and a trust badge, and it is exactly where a platform starts
      inventing confidence.

      Response time is absent rather than unknown: nothing on this platform measures it, so a row
      reading "Response time: not recorded" would imply a metric that does not exist.
    */
    const photoCount = subject.media.photos.length;
    const evidence: BuyingEvidence[] = [
      {
        id: "photos",
        label: "Photography",
        present: photoCount >= 6,
        detail:
          photoCount === 0
            ? "No photographs supplied yet."
            : `${photoCount} photograph${photoCount === 1 ? "" : "s"} supplied by the dealership.`,
      },
      {
        id: "equipment",
        label: "Equipment list",
        present: input.equipmentCount > 0,
        detail:
          input.equipmentCount > 0
            ? `${input.equipmentCount} item${input.equipmentCount === 1 ? "" : "s"} captured.`
            : "The dealership has not captured an equipment list.",
      },
      {
        id: "description",
        label: "Dealer description",
        present: subject.core.description.some((section) =>
          section.paragraphs.some((p) => p.trim().length > 40),
        ),
        detail: subject.core.description.some((s) => s.paragraphs.some((p) => p.trim().length > 40))
          ? "Written by the dealership."
          : "No description written.",
      },
      {
        id: "vin",
        label: "VIN recorded",
        present: Boolean(subject.core.vin?.trim()),
        detail: subject.core.vin?.trim()
          ? "On file with SURF4CARS. Not independently decoded."
          : "No VIN on file.",
      },
      {
        id: "specification",
        label: "Full specification",
        present: Boolean(subject.core.fuel?.trim() && subject.core.transmission?.trim() && subject.core.engine?.trim()),
        detail: [
          subject.core.fuel?.trim() ? null : "fuel",
          subject.core.transmission?.trim() ? null : "transmission",
          subject.core.engine?.trim() ? null : "engine",
        ].filter(Boolean).length
          ? `Missing: ${[
              subject.core.fuel?.trim() ? null : "fuel",
              subject.core.transmission?.trim() ? null : "transmission",
              subject.core.engine?.trim() ? null : "engine",
            ]
              .filter(Boolean)
              .join(", ")}.`
          : "Fuel, transmission and engine all recorded.",
      },
    ];

    return {
      price,
      signals,
      similar,
      similarBasis: similar.length > 0 ? selection.comparableLabel : null,
      evidence,
    };
  } catch (error) {
    /* Intelligence is an enhancement. A failure here must never take a listing down with it. */
    log.error("vehicle intelligence failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
