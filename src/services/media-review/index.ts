/**
 * SURF4CARS — photograph review.
 *
 * The Founder decides what represents the marketplace. This is where that decision lives, and the
 * homepage reads it rather than a denylist.
 */
export {
  dismissIntegrityFlag,
  loadIntegrityFlags,
  loadMediaReviews,
  loadVehicleReviews,
  refreshIntegrityFlags,
  reviewStateOf,
  saveVehicleReview,
  setMediaReviewState,
  type MediaReviewIndex,
  type SetReviewInput,
  type VehicleReview,
} from "./media-review.service";

export {
  detectIntegrityFlags,
  modelFromPath,
  type IntegrityCandidate,
} from "./photograph-integrity";

export {
  MEDIA_REVIEW_LABELS,
  MEDIA_REVIEW_STATES,
  type MediaIntegrityFlag,
  type MediaReview,
  type MediaReviewState,
} from "./media-review.types";
