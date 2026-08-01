import type { SendOutcome } from "./types";

/**
 * The bits every HTTP email provider needs and none of them should write twice.
 *
 * The timeout is the reason this exists. `fetch` without a signal waits on the platform default,
 * which on a serverless host is long enough that the enquiry request finishes first and the buyer
 * sees a spinner resolve into nothing useful. Ten seconds is past the point where a healthy provider
 * would have answered, and a timeout is transient, so the retry queue picks it up.
 */

export const PROVIDER_TIMEOUT_MS = 10_000;

export async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number = PROVIDER_TIMEOUT_MS,
): Promise<{ status: number; body: unknown } | { timedOut: true } | { networkError: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const parsed = await response.json().catch(() => null);
    return { status: response.status, body: parsed };
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return { timedOut: true };
    }
    return { networkError: error instanceof Error ? error.message : "unknown network error" };
  }
}

/**
 * HTTP status to outcome, for providers that follow the usual conventions.
 *
 *   401/403  permanent — a wrong API key does not become right on the third attempt
 *   422/400  permanent — the address or payload is rejected, and we will send the same one again
 *   429      transient — that is what a rate limit means
 *   5xx      transient — theirs, not ours
 *
 * A provider with different semantics classifies its own; this is the default, not a rule.
 */
export function classifyStatus(status: number, detail: string, response: unknown): SendOutcome {
  if (status === 429 || status >= 500) {
    return { kind: "transient", error: `${status} ${detail}`, response };
  }
  return { kind: "permanent", error: `${status} ${detail}`, response };
}

export function describeResponse(body: unknown): string {
  if (!body) return "no response body";
  if (typeof body === "string") return body.slice(0, 300);
  const record = body as Record<string, unknown>;
  const message = record.message ?? record.error ?? record.errors;
  if (typeof message === "string") return message.slice(0, 300);
  return JSON.stringify(body).slice(0, 300);
}
