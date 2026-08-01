/**
 * SURF FOR CARS — Vehicle Media Intelligence
 *
 * What a photograph measurably is, separated from what we conclude about it.
 *
 * The split matters. Extracting these numbers needs an image codec and a file, which is a different
 * concern in a Node script than in a route handler — but the *judgement* must be one implementation,
 * or the recommendation a dealer sees at upload time will disagree with the one on the review report,
 * and nobody will trust either. So features are extracted per environment and scored in exactly one
 * place: `scorePhoto` in ./photo-scorer.
 */

/**
 * What a photograph is *of*.
 *
 * This is recorded when the photograph is uploaded — it is not inferred from pixels — and it is the
 * single most useful thing the system knows. Whether a frame shows the whole car or its gearbox is a
 * fact, and no amount of image analysis should be spent rediscovering it.
 */
export type PhotoCategory =
  | "exterior"
  | "interior"
  | "dashboard"
  | "wheels"
  | "engine"
  | "boot"
  | "rear-seats"
  | "detail"
  | "unknown";

/** Measurements taken from the pixels. No opinions, no thresholds. */
export interface PhotoFeatures {
  /** Stable identifier — a media record id, or a filename for offline runs. */
  readonly id: string;
  /** From the media record. `unknown` is treated as possibly-exterior rather than excluded. */
  readonly category: PhotoCategory;
  readonly width: number;
  readonly height: number;
  /** Mean WCAG relative luminance, 0–1. Exposure. */
  readonly meanLuminance: number;
  /** Standard deviation of luminance, 0–1. Global contrast. */
  readonly rmsContrast: number;
  /**
   * Mean edge magnitude over the whole frame, 0–1.
   *
   * Reads as *busyness*, not as quality. Brickwork, signage, railings and rows of parked traffic all
   * push this up; sky, tarmac, grass and a car's own panels do not. High values mean a frame with a lot
   * competing for attention.
   */
  readonly edgeEnergy: number;
  /**
   * 95th-percentile edge magnitude, 0–1. Acuity: a sharp photograph has strong contours *somewhere*,
   * even when most of the frame is smooth. Separating this from the mean is what stops a soft, cluttered
   * frame and a crisp, simple one being scored alike.
   */
  readonly edgePeak: number;
  /**
   * Share of the frame that is near-black or blown out, 0–1. Distinguishes a moody photograph from an
   * underexposed one — the first has detail in the shadows, the second has none to recover.
   */
  readonly clippedShare: number;
}

/** One factor's contribution, kept separately so a score can always be explained. */
export interface PhotoFactorScore {
  readonly id: PhotoFactorId;
  readonly label: string;
  /** 0–1, before weighting. */
  readonly score: number;
  readonly weight: number;
  /** What this factor observed, in words a person would use. */
  readonly note: string;
}

export type PhotoFactorId =
  | "leadEligibility"
  | "orientation"
  | "resolution"
  | "backgroundCalm"
  | "sharpness"
  | "exposure"
  | "contrast";

export interface PhotoScore {
  readonly id: string;
  /** 0–100. Comparable only between photographs of the same vehicle. */
  readonly score: number;
  readonly factors: readonly PhotoFactorScore[];
  /** The one or two things that decided it, for a report column. */
  readonly reason: string;
  /** Anything disqualifying — an unusable frame rather than merely a weak one. */
  readonly disqualifiers: readonly string[];
}

/** Why a particular photograph ended up primary. Precedence is deliberate and auditable. */
export type PrimarySource =
  /** A Founder decision. Outranks everything, permanently. */
  | "founder"
  /** The dealer's own choice for their own listing. */
  | "dealer"
  /** The scorer's recommendation. */
  | "scored"
  /** No scores and no choice — whatever arrived first. */
  | "upload-order";

export interface PrimaryPhotoDecision {
  readonly id: string;
  readonly source: PrimarySource;
  /** 0–1. Low means the top candidates were close, or the signals disagreed — look at it yourself. */
  readonly confidence: number;
  readonly reason: string;
  /** The next-best candidate, where one exists. Useful in a review report. */
  readonly runnerUpId: string | null;
}
