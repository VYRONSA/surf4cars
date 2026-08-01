import { createMockProvider } from "./mock.provider";
import { createResendProvider } from "./resend.provider";
import { createSendGridProvider } from "./sendgrid.provider";
import type { ProviderResolution } from "./types";

/**
 * Which provider this deployment uses, decided entirely by environment.
 *
 * NO SECRET REACHES THIS FILE
 * ===========================
 * Nothing here has a default key, a fallback account or a committed sender address. If the
 * variables are absent the answer is "no provider", not "the developer's account" — a hardcoded
 * credential that works is worse than one that does not, because it works quietly, from every
 * environment, until it is rotated.
 *
 *   EMAIL_PROVIDER      resend | sendgrid | ses | mock
 *   EMAIL_API_KEY       the provider's key
 *   EMAIL_FROM          the sender, e.g. "SURF4CARS <enquiries@surf4cars.co.za>"
 *
 * A single `EMAIL_API_KEY` rather than `RESEND_API_KEY` and `SENDGRID_API_KEY` is deliberate:
 * switching provider should be one variable to change, and two half-configured providers is a state
 * where the wrong one can win silently.
 */

export type ProviderName = "resend" | "sendgrid" | "ses" | "mock";

export function resolveEmailProvider(): ProviderResolution {
  const configured = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();

  if (!configured) {
    return {
      kind: "unavailable",
      name: "none",
      reason: "EMAIL_PROVIDER is not set. Enquiries are recorded; no notification is sent.",
    };
  }

  if (configured === "mock") {
    if (process.env.NODE_ENV === "production") {
      return {
        kind: "unavailable",
        name: "none",
        reason: "EMAIL_PROVIDER=mock is refused in production. Set a real provider.",
      };
    }
    return createMockProvider();
  }

  if (configured === "ses") {
    /*
      Not implemented, and said so rather than shipped.
      ================================================
      SES needs SigV4 request signing, which is sixty lines of cryptography I have no way to verify
      against live AWS from here. An unverified signer fails at send time, in production, on a real
      buyer's enquiry, with an error that reads like a credentials problem. A resolution failure
      fails at configuration time, on the Founder's screen, with a sentence that says what to do.

      Choosing the second is the same rule the rest of this codebase follows about plausible data:
      an obviously absent thing gets fixed, a convincing broken one gets trusted.
    */
    return {
      kind: "unavailable",
      name: "none",
      reason:
        "Amazon SES is not implemented — it needs SigV4 request signing that has never been run against AWS. Set EMAIL_PROVIDER=resend or sendgrid.",
    };
  }

  const apiKey = (process.env.EMAIL_API_KEY ?? "").trim();
  const from = (process.env.EMAIL_FROM ?? "").trim();

  if (!apiKey) {
    return { kind: "unavailable", name: "none", reason: `EMAIL_PROVIDER is "${configured}" but EMAIL_API_KEY is not set.` };
  }
  if (!from) {
    return { kind: "unavailable", name: "none", reason: `EMAIL_PROVIDER is "${configured}" but EMAIL_FROM is not set.` };
  }

  if (configured === "resend") return createResendProvider({ apiKey, from });
  if (configured === "sendgrid") return createSendGridProvider({ apiKey, from });

  return {
    kind: "unavailable",
    name: "none",
    reason: `EMAIL_PROVIDER "${configured}" is not a provider this build knows. Use resend, sendgrid or ses.`,
  };
}
