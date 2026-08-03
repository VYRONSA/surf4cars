/**
 * SURF4CARS — photograph review states.
 *
 * Four states, because "may a customer see this" and "may it lead the shop window" are different
 * questions and collapsing them is what produced two sprints of denylist archaeology. A forecourt
 * photograph of the right car is exactly what a buyer searching that model should see, and exactly
 * what must not be the cover.
 */

export type MediaReviewState =
  /** Fit to lead the marketplace. The premium homepage rails show only these. */
  | "approved_homepage"
  /** A true, usable photograph of the car — search and detail pages, never the cover. */
  | "approved_search"
  /** Must not be shown anywhere: wrong car, unsafe, or embarrassing. */
  | "rejected"
  /**
   * Nobody has looked yet.
   *
   * Stored as the *absence* of a row rather than as a value, so the queue cannot drift out of step
   * with the library: a photograph that exists and has no review is by definition unreviewed. It is
   * never treated as approval.
   */
  | "needs_review";

export const MEDIA_REVIEW_STATES: readonly MediaReviewState[] = [
  "approved_homepage",
  "approved_search",
  "rejected",
  "needs_review",
];

/** How each state reads to the person doing the reviewing. */
export const MEDIA_REVIEW_LABELS: Readonly<Record<MediaReviewState, string>> = {
  approved_homepage: "Approved for homepage",
  approved_search: "Approved for search only",
  rejected: "Rejected",
  needs_review: "Needs review",
};

export interface MediaReview {
  readonly photograph: string;
  readonly state: MediaReviewState;
  readonly note: string | null;
  readonly reviewedAt: string | null;
}

/** A disagreement between a listing and the photograph leading it. Raised by a rule, never by a person. */
export interface MediaIntegrityFlag {
  readonly id: string;
  readonly photograph: string;
  readonly rule: "model-mismatch" | "body-style-conflict" | "derivative-conflict";
  readonly detail: string;
  readonly dismissed: boolean;
}
