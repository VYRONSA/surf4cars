/**
 * Dealership verification, as a state rather than a claim.
 *
 * The platform used to ship `verified: true` for every dealership. This is the type that makes that
 * impossible to write again: there is no boolean to set, and the only value that earns a badge is
 * one an operator has to put in the database deliberately.
 *
 * See `db/migrations/20260806090000_pcp032_dealer_verification.sql` for why six states rather than
 * two, and why nothing is backfilled.
 */

export const DEALER_VERIFICATION_STATUSES = [
  "unknown",
  "pending",
  "documents_submitted",
  "verified",
  "rejected",
  "expired",
] as const;

export type DealerVerificationStatus = (typeof DEALER_VERIFICATION_STATUSES)[number];

export function isDealerVerificationStatus(value: unknown): value is DealerVerificationStatus {
  return (
    typeof value === "string" &&
    (DEALER_VERIFICATION_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Anything not stored, or stored as something we do not recognise, is `unknown`.
 *
 * Defaulting an unreadable value to `unknown` rather than to the previous row's value or to a
 * neutral-sounding "pending" matters: `pending` implies somebody started, and nobody did.
 */
export function toDealerVerificationStatus(value: unknown): DealerVerificationStatus {
  return isDealerVerificationStatus(value) ? value : "unknown";
}

/**
 * The single question every customer-facing surface should ask.
 *
 * Exported as a function rather than left to each component to compare strings, because the moment
 * two components decide for themselves what counts as verified, one of them will decide that
 * `documents_submitted` is close enough.
 */
export function isVerifiedDealer(status: DealerVerificationStatus): boolean {
  return status === "verified";
}

/**
 * How a state is described to a *customer* — and for most states, the answer is not at all.
 *
 * Returning null for everything except `verified` is deliberate. "Not verified" or "Verification
 * pending" beside a dealership's name is a claim about that business we also cannot defend, and it
 * would penalise every dealership on the platform for a queue they did not create. Silence is the
 * honest rendering of "we have not checked yet".
 *
 * Operations sees the full state — see `describeVerificationForOperations`.
 */
export function describeVerificationForCustomer(status: DealerVerificationStatus): string | null {
  return status === "verified" ? "Verified by SURF4CARS" : null;
}

/** The internal view, where every state has to be visible and actionable. */
export function describeVerificationForOperations(status: DealerVerificationStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "pending":
      return "Pending verification";
    case "documents_submitted":
      return "Documents submitted";
    case "rejected":
      return "Rejected";
    case "expired":
      return "Verification expired";
    case "unknown":
    default:
      return "Not assessed";
  }
}
