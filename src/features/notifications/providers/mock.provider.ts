import type { EmailMessage, EmailProvider, SendOutcome } from "./types";

/**
 * A provider that does not send, for exercising the paths that matter.
 *
 * Every interesting behaviour in this subsystem is a failure behaviour — a timeout that retries, a
 * rejected address that does not, a queue that gives up at the limit. None of those can be produced
 * on demand from Resend, and waiting for them to happen naturally means shipping the retry engine
 * untested. This provider produces them on demand.
 *
 * WHY IT IS NOT A LIABILITY
 * =========================
 * It is selected only by `EMAIL_PROVIDER=mock`, and `resolveEmailProvider` refuses that value when
 * `NODE_ENV=production`. A test double that can be switched on in production is a way to silently
 * stop sending email, which is the exact failure this whole programme exists to prevent.
 *
 * The behaviour is driven by the recipient address so a single run can cover several cases:
 *
 *   timeout@…    transient — "provider timed out"
 *   bounce@…     permanent — address rejected
 *   throttle@…   transient — rate limited
 *   anything else  sent
 */
export function createMockProvider(): EmailProvider {
  return {
    kind: "provider",
    name: "mock",
    async send(message: EmailMessage): Promise<SendOutcome> {
      const local = message.to.split("@")[0]?.toLowerCase() ?? "";

      if (local.startsWith("timeout")) {
        return { kind: "transient", error: "provider timed out" };
      }
      if (local.startsWith("throttle")) {
        return { kind: "transient", error: "429 rate limited" };
      }
      if (local.startsWith("bounce")) {
        return { kind: "permanent", error: "422 recipient address rejected" };
      }

      return {
        kind: "sent",
        messageId: `mock-${message.to}`,
        response: { provider: "mock", note: "nothing was actually sent" },
      };
    },
  };
}
