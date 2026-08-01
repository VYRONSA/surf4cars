import { createHash } from "node:crypto";

import { createLogger } from "@/lib/observability/logger";
import { createDomainServerClient } from "@/lib/supabase";

import type { RateLimitStore } from "./rate-limit";

const log = createLogger("rate-limit-store");

/**
 * A rate limit that survives more than one server instance.
 *
 * The framework in `rate-limit.ts` was written with `configureRateLimitStore` waiting for exactly
 * this: its own note says the in-memory store "is per-instance and therefore only correct for a
 * single process". On a serverless host that means a limit of ten allows ten per instance, and the
 * real limit is whatever the platform's autoscaler decides.
 *
 * THE KEY IS HASHED BEFORE IT IS STORED
 * =====================================
 * The caller key is `publicEnquiry:address:<ip>`. Writing that to a table would create a durable log
 * of who visited, kept for no purpose beyond counting, which is personal information under POPIA and
 * a liability this platform gains nothing from holding. sha256 counts identically and cannot be read
 * back into a person.
 *
 * FAILING OPEN IS DELIBERATE
 * ==========================
 * If the database cannot be reached, the request is allowed. A rate limiter is a guard on a
 * secondary risk — spam and provider cost — while the endpoint it guards is the platform's only
 * conversion action. Refusing genuine buyers because a counter was unavailable would trade the
 * primary purpose for the secondary one. The failure is logged so it is visible rather than assumed.
 */
export function createPostgresRateLimitStore(): RateLimitStore {
  return {
    async hit(key: string, windowMs: number, now: number) {
      const supabase = createDomainServerClient();
      if (!supabase) return { count: 1, resetAt: now + windowMs };

      const hashed = createHash("sha256").update(key).digest("hex");

      const { data, error } = await supabase.rpc("rate_limit_hit", {
        p_key: hashed,
        p_window_ms: windowMs,
        p_now: new Date(now).toISOString(),
      });

      if (error || !data) {
        log.error("rate limit store unavailable — allowing the request", {
          message: error?.message,
        });
        return { count: 1, resetAt: now + windowMs };
      }

      const row = (Array.isArray(data) ? data[0] : data) as
        | { hit_count?: number; window_reset_at?: string }
        | undefined;

      if (!row || typeof row.hit_count !== "number") {
        log.error("rate limit store returned an unreadable row — allowing the request");
        return { count: 1, resetAt: now + windowMs };
      }

      return {
        count: row.hit_count,
        resetAt: row.window_reset_at ? new Date(row.window_reset_at).getTime() : now + windowMs,
      };
    },

    async reset(key: string) {
      const supabase = createDomainServerClient();
      if (!supabase) return;
      const hashed = createHash("sha256").update(key).digest("hex");
      await supabase.from("rate_limit_windows").delete().eq("key", hashed);
    },
  };
}
