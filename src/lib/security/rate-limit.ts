/**
 * Rate limiting framework.
 *
 * PCP-001J1 delivers the mechanism only — no endpoint is wired to it in this sprint, so request
 * handling behaviour is unchanged. Endpoint integration is a later decision.
 *
 * The in-memory store is per-instance and therefore only correct for a single process. A shared
 * backend (Redis, Upstash, or Postgres) must be supplied via `configureRateLimitStore` before
 * limits are enforced across a multi-instance deployment.
 */

import { RATE_LIMIT_POLICIES } from "@/config/protection/protection-policy";

export interface RateLimitRule {
  /** Maximum requests permitted inside the window. */
  readonly limit: number;
  /** Rolling window length in milliseconds. */
  readonly windowMs: number;
}

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  /** Epoch milliseconds at which the current window resets. */
  readonly resetAt: number;
  readonly retryAfterSeconds: number;
}

export interface RateLimitStore {
  /** Records a hit and returns the running count plus the window reset time. */
  hit(key: string, windowMs: number, now: number): Promise<{ readonly count: number; readonly resetAt: number }>;
  reset(key: string): Promise<void>;
}

/**
 * Production limits — derived, never written here.
 *
 * PCP-048 moved every number to `src/config/protection/protection-policy.ts`, which is the single
 * place the platform's limits are configured. These names stay because callers already reference
 * them and a rename would be a change to request handling dressed up as a refactor; what changed is
 * that the values now have exactly one home. A limit edited in the policy takes effect here, and a
 * limit edited here does not exist.
 */
export const RATE_LIMIT_RULES = {
  publicApi: RATE_LIMIT_POLICIES.publicApi,
  dealerApi: RATE_LIMIT_POLICIES.dealerApi,
  buyerApi: RATE_LIMIT_POLICIES.buyerApi,
  /** Deliberately tight: unauthenticated and writes to dealer CRMs. */
  publicEnquiry: RATE_LIMIT_POLICIES.enquiry,
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitRuleName = keyof typeof RATE_LIMIT_RULES;

interface WindowState {
  count: number;
  resetAt: number;
}

/** Per-instance store. Correct for a single process only — see the note above. */
export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly windows = new Map<string, WindowState>();

  async hit(key: string, windowMs: number, now: number): Promise<{ count: number; resetAt: number }> {
    const existing = this.windows.get(key);

    if (!existing || existing.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.windows.set(key, fresh);
      this.evictExpired(now);
      return { count: fresh.count, resetAt: fresh.resetAt };
    }

    existing.count += 1;
    return { count: existing.count, resetAt: existing.resetAt };
  }

  async reset(key: string): Promise<void> {
    this.windows.delete(key);
  }

  /** Bounded cleanup so a long-lived process cannot accumulate expired windows indefinitely. */
  private evictExpired(now: number): void {
    if (this.windows.size < 1000) return;
    for (const [key, state] of this.windows) {
      if (state.resetAt <= now) this.windows.delete(key);
    }
  }
}

let activeStore: RateLimitStore = new InMemoryRateLimitStore();

export function configureRateLimitStore(store: RateLimitStore): void {
  activeStore = store;
}

/**
 * Derives a caller identity for limiting. Prefers an explicit subject (dealership or buyer id);
 * otherwise falls back to the forwarded client address.
 */
export function resolveRateLimitKey(input: {
  readonly rule: RateLimitRuleName;
  readonly subject?: string | null;
  readonly request?: Request;
}): string {
  if (input.subject?.trim()) return `${input.rule}:subject:${input.subject.trim()}`;

  const forwarded = input.request?.headers.get("x-forwarded-for") ?? "";
  const address = forwarded.split(",")[0]?.trim()
    || input.request?.headers.get("x-real-ip")?.trim()
    || "unknown";

  return `${input.rule}:address:${address}`;
}

export async function evaluateRateLimit(
  rule: RateLimitRuleName,
  key: string,
  now: number = Date.now(),
): Promise<RateLimitDecision> {
  const { limit, windowMs } = RATE_LIMIT_RULES[rule];
  const { count, resetAt } = await activeStore.hit(key, windowMs, now);

  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfterSeconds: Math.max(0, Math.ceil((resetAt - now) / 1000)),
  };
}

/** Standard response headers for a limited endpoint. */
export function buildRateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  const headers: Record<string, string> = {
    "ratelimit-limit": String(decision.limit),
    "ratelimit-remaining": String(decision.remaining),
    "ratelimit-reset": String(Math.ceil(decision.resetAt / 1000)),
  };
  if (!decision.allowed) headers["retry-after"] = String(decision.retryAfterSeconds);
  return headers;
}
