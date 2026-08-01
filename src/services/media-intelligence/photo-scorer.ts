/**
 * SURF FOR CARS — vehicle photograph scoring.
 *
 * Ranks the photographs of one vehicle so the strongest leads the listing, instead of whichever file
 * happened to be uploaded first. The Volvo XC90 is the case that motivated it: its primary frame is a
 * red-brick shopfront with "BARRETT" signage across the top and the car small and low in the frame.
 *
 * WHAT THIS DOES, AND WHAT IT REFUSES TO PRETEND
 * ==============================================
 * The first version of this file tried to infer subject prominence from where a frame's detail lived —
 * central edge energy against peripheral edge energy. Measured against the XC90's own photographs, it
 * recommended the frame containing police officers in a car park and ranked the good frame second-last.
 * Two reasons, both instructive:
 *
 *   a car that fills the frame puts *its own* contours in the periphery, so "centre busier than edges"
 *   actively penalises the composition it was meant to reward;
 *
 *   a glossy car body is *smooth* — low edge energy — while grass, trees and gravel are not. Edge
 *   statistics rank a distant flat car park above a close, well-lit car.
 *
 * Reliably answering "does the vehicle fill the frame, and is all of it visible" needs object detection.
 * There is none here, and curve-fitting six thresholds to six photographs would have produced a scorer
 * that was confident and wrong — the worst possible property for something that picks what customers see.
 *
 * So the design changed to use what is actually *known*. Every media record carries the category the
 * photograph was uploaded under: exterior, interior, wheels, engine, boot, dashboard. Whether a frame
 * shows the whole car or its gearbox is therefore a fact, not an inference. Category decides eligibility;
 * pixel measurements only rank the frames that are already eligible, and only on properties pixels can
 * honestly report — busyness, acuity, exposure, contrast, shape and resolution.
 *
 * The remaining gap is stated rather than hidden: among two well-formed exterior photographs, this ranks
 * on background calm and technical quality, which is a weaker signal than a person's eye. When the top
 * two are close the confidence value collapses, and the review report asks a human. That is the correct
 * behaviour, not a shortfall — see `resolvePrimaryPhoto`.
 *
 * Every factor is pure arithmetic over `PhotoFeatures`. No I/O, no image codec, no environment, so the
 * dealer's upload screen, the Founder's review report and any future test all reach the same verdict.
 */
import type {
  PhotoCategory,
  PhotoFactorScore,
  PhotoFeatures,
  PhotoScore,
  PrimaryPhotoDecision,
} from "./photo-features.types";

/**
 * Categories that may lead a listing. A gearbox is a useful photograph and a terrible first one.
 *
 * `unknown` is included deliberately: an uncategorised photograph might be an exterior, and silently
 * ruling it out of contention would be worse than admitting we cannot tell. It loses on the note rather
 * than on the score.
 *
 * Kept here rather than beside the types because it is policy, not a shape — and because keeping the
 * types module free of runtime exports lets Node import this scorer directly, which is how the offline
 * report and the application come to share one implementation instead of two that drift.
 */
export const LEAD_ELIGIBLE_CATEGORIES: readonly PhotoCategory[] = ["exterior", "unknown"];

/**
 * Factor weights.
 *
 * Eligibility dominates because it is the only factor backed by a recorded fact rather than a
 * measurement. Background calm leads the rest: of everything pixels can report, "how much is competing
 * with the car" is the one that maps to the actual complaint.
 */
const WEIGHTS = {
  leadEligibility: 0.34,
  backgroundCalm: 0.22,
  sharpness: 0.16,
  orientation: 0.14,
  exposure: 0.08,
  contrast: 0.03,
  resolution: 0.03,
} as const;

const ramp = (value: number, floor: number, ceiling: number): number =>
  ceiling === floor ? 0 : Math.min(1, Math.max(0, (value - floor) / (ceiling - floor)));

const nearness = (value: number, ideal: number, tolerance: number): number =>
  Math.min(1, Math.max(0, 1 - Math.abs(value - ideal) / tolerance));

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * May this photograph lead the listing at all?
 *
 * Categorical, and the highest-weighted factor. A photograph of a gearbox can be perfectly exposed,
 * pin-sharp and beautifully composed and still be the wrong first thing a buyer sees.
 */
function scoreLeadEligibility(features: PhotoFeatures): PhotoFactorScore {
  const eligible = LEAD_ELIGIBLE_CATEGORIES.includes(features.category);

  return {
    id: "leadEligibility",
    label: "Suitable as lead",
    score: eligible ? 1 : 0,
    weight: WEIGHTS.leadEligibility,
    note: eligible
      ? features.category === "unknown"
        ? "uncategorised — treated as a possible exterior"
        : "exterior view"
      : `${features.category} view — never a listing's lead image`,
  };
}

/**
 * Card and hero slots are landscape everywhere in this product, and `object-cover` on a source narrower
 * than its container crops the sides — which removes the nose and tail of the car.
 */
function scoreOrientation(features: PhotoFeatures): PhotoFactorScore {
  const aspect = features.width / features.height;
  const score = aspect < 1 ? 0 : aspect < 1.25 ? 0.25 : nearness(aspect, 1.62, 0.85);

  return {
    id: "orientation",
    label: "Orientation",
    score,
    weight: WEIGHTS.orientation,
    note:
      aspect < 1
        ? `portrait ${round2(aspect)}:1 — the layout will crop the car's sides`
        : aspect < 1.25
          ? `nearly square ${round2(aspect)}:1 — little room for a landscape crop`
          : `landscape ${round2(aspect)}:1`,
  };
}

function scoreResolution(features: PhotoFeatures): PhotoFactorScore {
  return {
    id: "resolution",
    label: "Resolution",
    score: ramp(features.width, 900, 2400),
    weight: WEIGHTS.resolution,
    note: `${features.width}×${features.height}`,
  };
}

/**
 * How much of the frame is competing with the car.
 *
 * Mean edge magnitude across the whole frame. Brickwork, shopfront signage, railings and rows of parked
 * traffic raise it; sky, tarmac, grass and the car's own panels do not. This is the factor that demotes
 * the XC90's shopfront frame, which is measurably the busiest of its six.
 *
 * It is a busyness measure and nothing more. A calm frame is not necessarily a good one — an empty car
 * park is very calm — which is why eligibility outranks it and why confidence exists.
 */
function scoreBackgroundCalm(features: PhotoFeatures): PhotoFactorScore {
  const score = 1 - ramp(features.edgeEnergy, 0.035, 0.085);

  return {
    id: "backgroundCalm",
    label: "Visual noise",
    score,
    weight: WEIGHTS.backgroundCalm,
    note:
      features.edgeEnergy >= 0.065
        ? "busy frame — a lot competing with the vehicle"
        : features.edgeEnergy >= 0.05
          ? "some competing detail"
          : "calm frame",
  };
}

/**
 * Acuity, measured on the strongest contours rather than the average.
 *
 * A well-shot car against sky is mostly smooth; judging sharpness by mean edge energy would call it soft
 * and call a blurry photograph of a brick wall crisp.
 */
function scoreSharpness(features: PhotoFeatures): PhotoFactorScore {
  return {
    id: "sharpness",
    label: "Sharpness",
    score: ramp(features.edgePeak, 0.12, 0.34),
    weight: WEIGHTS.sharpness,
    note: features.edgePeak < 0.16 ? "soft or motion-blurred" : "crisp contours",
  };
}

/**
 * Exposure, judged on two things rather than one.
 *
 * Mean luminance alone would reject every night photograph, and night is the brand's own register. A dark
 * frame is only penalised when it is also clipped — when the shadows hold nothing to see.
 */
function scoreExposure(features: PhotoFeatures): PhotoFactorScore {
  const level = nearness(features.meanLuminance, 0.32, 0.36);
  const intact = 1 - ramp(features.clippedShare, 0.1, 0.42);

  return {
    id: "exposure",
    label: "Exposure",
    score: level * 0.4 + intact * 0.6,
    weight: WEIGHTS.exposure,
    note:
      features.clippedShare >= 0.3
        ? `${Math.round(features.clippedShare * 100)}% of the frame is crushed or blown`
        : features.meanLuminance < 0.12
          ? "dark, but holding detail"
          : "well exposed",
  };
}

function scoreContrast(features: PhotoFeatures): PhotoFactorScore {
  return {
    id: "contrast",
    label: "Contrast",
    score: nearness(features.rmsContrast, 0.22, 0.22),
    weight: WEIGHTS.contrast,
    note: features.rmsContrast < 0.1 ? "flat" : "good separation",
  };
}

/**
 * Faults that make a frame unusable as a lead image whatever else is good about it.
 *
 * Kept out of the weighted sum because they are not trade-offs: a portrait photograph does not become
 * acceptable by being sharp. These are the judgements the scorer is genuinely reliable at.
 */
function findDisqualifiers(features: PhotoFeatures): string[] {
  const faults: string[] = [];
  const aspect = features.width / features.height;

  if (!LEAD_ELIGIBLE_CATEGORIES.includes(features.category)) faults.push(`${features.category} view`);
  if (aspect < 1) faults.push("portrait orientation");
  if (features.width < 900) faults.push("below 900px wide");
  if (features.clippedShare > 0.55) faults.push("more than half the frame has no recoverable detail");
  if (features.edgePeak < 0.09) faults.push("no discernible contours — likely blurred");

  return faults;
}

export function scorePhoto(features: PhotoFeatures): PhotoScore {
  const factors: PhotoFactorScore[] = [
    scoreLeadEligibility(features),
    scoreBackgroundCalm(features),
    scoreSharpness(features),
    scoreOrientation(features),
    scoreExposure(features),
    scoreContrast(features),
    scoreResolution(features),
  ];

  const weighted = factors.reduce((total, factor) => total + factor.score * factor.weight, 0);
  const disqualifiers = findDisqualifiers(features);

  /* A disqualified frame is pushed below every usable one rather than removed, so a vehicle whose
     photographs are all flawed still gets a primary and the report still explains why. */
  const score = Math.round((disqualifiers.length > 0 ? weighted * 0.4 : weighted) * 100);

  /** The reason column: the two factors that moved the result most, not all seven. */
  const reason = [...factors]
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .slice(0, 2)
    .map((factor) => factor.note)
    .join("; ");

  return { id: features.id, score, factors, reason, disqualifiers };
}

export interface ResolvePrimaryInput {
  /** Every photograph of one vehicle, in upload order. */
  readonly photos: readonly { readonly id: string }[];
  /** Scores, where they have been computed. Missing scores are tolerated. */
  readonly scores?: readonly PhotoScore[];
  /** A Founder decision. Outranks everything. */
  readonly founderPinnedId?: string | null;
  /** The dealer's own choice for their listing. Outranks the scorer. */
  readonly dealerPinnedId?: string | null;
}

/**
 * Which photograph leads the listing.
 *
 * Precedence, highest first: Founder, dealer, scorer, upload order. Both overrides are honoured even when
 * the scorer disagrees, and the scorer never revises them — the whole point of an override is that it is
 * not advice. A pinned id that no longer matches a photograph is ignored rather than trusted, so deleting
 * a photograph cannot leave a listing with no lead image.
 */
export function resolvePrimaryPhoto({
  photos,
  scores = [],
  founderPinnedId = null,
  dealerPinnedId = null,
}: ResolvePrimaryInput): PrimaryPhotoDecision | null {
  if (photos.length === 0) return null;

  const exists = (id: string | null): id is string =>
    Boolean(id) && photos.some((photo) => photo.id === id);

  if (exists(founderPinnedId)) {
    return {
      id: founderPinnedId,
      source: "founder",
      confidence: 1,
      reason: "Chosen by the Founder.",
      runnerUpId: null,
    };
  }

  if (exists(dealerPinnedId)) {
    return {
      id: dealerPinnedId,
      source: "dealer",
      confidence: 1,
      reason: "Chosen by the dealer.",
      runnerUpId: null,
    };
  }

  const ranked = [...scores]
    .filter((score) => photos.some((photo) => photo.id === score.id))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) {
    return {
      id: photos[0]!.id,
      source: "upload-order",
      confidence: 0,
      reason: "No scores available — first uploaded photograph.",
      runnerUpId: photos[1]?.id ?? null,
    };
  }

  const runnerUp = ranked[1];

  /**
   * Confidence is the margin, not the score.
   *
   * A 90 that beat an 88 is a coin toss worth escalating; a 55 that beat a 20 is not, even though both
   * frames are mediocre. Ten points is treated as decisive — beyond that the factor notes stop
   * contradicting each other in practice. Among equally eligible exterior frames this will often be low,
   * and it is *supposed* to be: composition is where the scorer's honest reach ends and a person's begins.
   */
  const margin = runnerUp ? best.score - runnerUp.score : best.score;

  return {
    id: best.id,
    source: "scored",
    confidence: round2(Math.min(1, Math.max(0, margin / 10))),
    reason: best.reason,
    runnerUpId: runnerUp?.id ?? null,
  };
}
