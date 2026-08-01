/**
 * What a notification provider is, from the platform's side.
 *
 * WHY AN INTERFACE AND NOT A RESEND CALL
 * ======================================
 * The brief is explicit that the provider must be swappable and must never be hardcoded, and the
 * reason is not architectural neatness. Email providers are the part of this stack most likely to
 * be changed under pressure — a domain gets suspended, a free tier runs out, a region needs a local
 * sender. When that happens the platform should need one environment variable, not a code change
 * and a deploy, because the thing that broke is by definition the thing that is currently losing
 * enquiries.
 *
 * THE OUTCOME TYPE IS THE IMPORTANT PART
 * ======================================
 * A provider does not return "worked" or "didn't". It returns one of three things, and the
 * difference between the last two is the whole retry engine:
 *
 *   sent       the provider accepted the message
 *   transient  it might work later — timeout, 429, 5xx, socket reset
 *   permanent  it will never work — invalid address, rejected domain, 401 on the key
 *
 * Retrying a permanent failure four times produces four identical errors, four log lines and a
 * dashboard that looks busy while nothing is happening. Not retrying a transient one throws away a
 * real enquiry because a provider had a bad thirty seconds. Providers classify their own errors
 * because only they know what their status codes mean.
 */

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  /** Where a dealer's reply should land — the buyer, not us. */
  readonly replyTo?: string;
}

export type SendOutcome =
  | { readonly kind: "sent"; readonly messageId: string | null; readonly response: unknown }
  | { readonly kind: "transient"; readonly error: string; readonly response?: unknown }
  | { readonly kind: "permanent"; readonly error: string; readonly response?: unknown };

export interface EmailProvider {
  readonly kind: "provider";
  /** Recorded on every attempt, so history survives a provider change. */
  readonly name: string;
  send(message: EmailMessage): Promise<SendOutcome>;
}

/**
 * A provider that could not be built, and why.
 *
 * Returned rather than thrown so a misconfiguration surfaces as a row with a readable status on the
 * Founder card, instead of a 500 on the enquiry request. The buyer's enquiry is already persisted by
 * the time a provider is resolved; losing it to a missing API key would invert the whole priority.
 */
export interface ProviderUnavailable {
  readonly kind: "unavailable";
  readonly name: "none";
  readonly reason: string;
}

export type ProviderResolution = EmailProvider | ProviderUnavailable;

/*
  `kind` exists purely so this narrows in both directions.
  =======================================================
  Discriminating on `name` narrows the true branch and leaves the false branch as the whole union,
  because `EmailProvider["name"]` is `string` and TypeScript cannot subtract a type from it. The
  false branch is the one that reads `reason` — the branch that has to explain why nothing can be
  sent — so getting it wrong would have meant casting at exactly the point where the code is
  reporting a failure honestly.
*/
export function isProviderAvailable(resolution: ProviderResolution): resolution is EmailProvider {
  return resolution.kind === "provider";
}
