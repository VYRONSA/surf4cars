/**
 * Production health checks.
 *
 * Read-only reachability probes against configuration, database, storage and auth. Uses the anon
 * key only — no service-role credential is introduced, so the health endpoint cannot see more than
 * an unauthenticated visitor.
 */

import { env, validateEnvironment } from "@/config/env";
import {
  EXPECTED_MIGRATION_VERSION,
  MIGRATION_COUNT,
  REQUIRED_STORAGE_BUCKETS,
  REQUIRED_TABLES,
} from "@/config/migrations";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheck {
  readonly name: string;
  readonly status: HealthStatus;
  readonly latencyMs: number;
  readonly detail: string;
  readonly meta?: Record<string, unknown>;
}

export interface HealthReport {
  readonly status: HealthStatus;
  readonly checkedAt: string;
  readonly expectedMigrationVersion: string;
  readonly migrationCount: number;
  readonly checks: readonly HealthCheck[];
}

const PROBE_TIMEOUT_MS = 5000;

function worst(statuses: readonly HealthStatus[]): HealthStatus {
  if (statuses.includes("unhealthy")) return "unhealthy";
  if (statuses.includes("degraded")) return "degraded";
  return "healthy";
}

async function timed<T>(operation: () => Promise<T>): Promise<{ value: T | null; error: unknown; latencyMs: number }> {
  const startedAt = Date.now();
  try {
    const value = await operation();
    return { value, error: null, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { value: null, error, latencyMs: Date.now() - startedAt };
  }
}

function supabaseHeaders(): Record<string, string> {
  const key = env.supabaseAnonKey ?? "";
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function checkConfiguration(): HealthCheck {
  const startedAt = Date.now();
  const validation = validateEnvironment();
  const errors = validation.issues.filter((issue) => issue.severity === "error");
  const warnings = validation.issues.filter((issue) => issue.severity === "warning");

  return {
    name: "configuration",
    status: errors.length > 0 ? "unhealthy" : warnings.length > 0 ? "degraded" : "healthy",
    latencyMs: Date.now() - startedAt,
    detail: errors.length > 0
      ? `${errors.length} configuration error(s)`
      : warnings.length > 0
        ? `${warnings.length} configuration warning(s)`
        : "Configuration valid",
    meta: {
      // Variable names and messages only — never values.
      issues: validation.issues.map((issue) => ({ severity: issue.severity, variable: issue.variable, message: issue.message })),
    },
  };
}

/** Reachability plus schema presence: a reachable database that is not migrated is not healthy. */
async function checkDatabase(): Promise<HealthCheck> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return { name: "database", status: "unhealthy", latencyMs: 0, detail: "Supabase is not configured" };
  }

  const probe = await timed(async () => {
    const results = await Promise.all(
      REQUIRED_TABLES.map(async (table) => {
        const response = await fetch(`${env.supabaseUrl}/rest/v1/${table}?select=*&limit=0`, {
          headers: supabaseHeaders(),
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
          cache: "no-store",
        });

        /*
          A refusal is not an absence.

          This probe runs as `anon` and asked for `select=*`. PCP-038 replaced the table-wide SELECT
          grant on `dealerships` and `inventory_vehicles` with an explicit column allow-list, so `*`
          now returns 401 for those two — and this check reported the platform's two most important
          tables as *missing*, taking the whole deployment to `unhealthy`. On a host that gates
          traffic on health, a correct security change would have taken the site down.

          A 401 or 403 is positive evidence the table exists: PostgREST resolved the relation and
          then declined on privilege. Only a genuine "no such relation" — 404, or PostgREST's
          PGRST205 schema-cache miss — means unmigrated.
        */
        const present = response.ok || response.status === 401 || response.status === 403;
        return { table, ok: present, status: response.status };
      }),
    );
    return results;
  });

  if (probe.error || !probe.value) {
    return {
      name: "database",
      status: "unhealthy",
      latencyMs: probe.latencyMs,
      detail: "Database unreachable",
      meta: { reason: probe.error instanceof Error ? probe.error.name : "unknown" },
    };
  }

  const missing = probe.value.filter((row) => !row.ok).map((row) => row.table);

  if (missing.length === REQUIRED_TABLES.length) {
    return {
      name: "database",
      status: "unhealthy",
      latencyMs: probe.latencyMs,
      detail: "Reachable, but no expected tables exist — migrations have not been applied",
      meta: { presentTables: 0, requiredTables: REQUIRED_TABLES.length },
    };
  }

  if (missing.length > 0) {
    return {
      name: "database",
      status: "degraded",
      latencyMs: probe.latencyMs,
      detail: `${missing.length} of ${REQUIRED_TABLES.length} expected tables are missing`,
      meta: { missingTables: missing },
    };
  }

  return {
    name: "database",
    status: "healthy",
    latencyMs: probe.latencyMs,
    detail: `All ${REQUIRED_TABLES.length} expected tables present`,
  };
}

/**
 * Bucket enumeration is a privileged operation: the anon key returns an empty list rather than an
 * error, which would make every bucket look missing. The service key is read only here, never
 * leaves the server, and is only used for this check. Without it the probe degrades to public
 * bucket detection and reports the private buckets as unverifiable rather than missing.
 */
async function checkStorage(): Promise<HealthCheck> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return { name: "storage", status: "unhealthy", latencyMs: 0, detail: "Supabase is not configured" };
  }

  const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!serviceKey) {
    const probePublic = await timed(async () => {
      const found: string[] = [];
      for (const bucket of REQUIRED_STORAGE_BUCKETS) {
        const response = await fetch(`${env.supabaseUrl}/storage/v1/object/public/${bucket}/__healthcheck__`, {
          headers: { apikey: env.supabaseAnonKey ?? "" },
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
          cache: "no-store",
        });
        const body = await response.text();
        // "Object not found" proves the bucket exists; "Bucket not found" proves it does not.
        if (!/Bucket not found/i.test(body)) found.push(bucket);
      }
      return found;
    });

    const found = probePublic.value ?? [];
    return {
      name: "storage",
      status: found.length === 0 ? "unhealthy" : "degraded",
      latencyMs: probePublic.latencyMs,
      detail: `${found.length} public bucket(s) confirmed; private buckets unverifiable without SUPABASE_SECRET_KEY`,
      meta: { confirmed: found },
    };
  }

  const probe = await timed(async () => {
    const response = await fetch(`${env.supabaseUrl}/storage/v1/bucket`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`storage responded ${response.status}`);
    return (await response.json()) as ReadonlyArray<{ readonly name?: string; readonly id?: string }>;
  });

  if (probe.error || !probe.value) {
    return {
      name: "storage",
      status: "unhealthy",
      latencyMs: probe.latencyMs,
      detail: "Storage unreachable",
      meta: { reason: probe.error instanceof Error ? probe.error.message : "unknown" },
    };
  }

  const present = new Set(probe.value.map((bucket) => bucket.id ?? bucket.name ?? ""));
  const missing = REQUIRED_STORAGE_BUCKETS.filter((bucket) => !present.has(bucket));

  return {
    name: "storage",
    status: missing.length === REQUIRED_STORAGE_BUCKETS.length
      ? "unhealthy"
      : missing.length > 0 ? "degraded" : "healthy",
    latencyMs: probe.latencyMs,
    detail: missing.length === 0
      ? `All ${REQUIRED_STORAGE_BUCKETS.length} buckets provisioned`
      : `${missing.length} of ${REQUIRED_STORAGE_BUCKETS.length} buckets missing`,
    meta: missing.length > 0 ? { missingBuckets: missing } : undefined,
  };
}

async function checkAuth(): Promise<HealthCheck> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return { name: "auth", status: "unhealthy", latencyMs: 0, detail: "Supabase is not configured" };
  }

  const probe = await timed(async () => {
    const response = await fetch(`${env.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: env.supabaseAnonKey ?? "" },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`auth responded ${response.status}`);
    return true;
  });

  return {
    name: "auth",
    status: probe.error ? "unhealthy" : "healthy",
    latencyMs: probe.latencyMs,
    detail: probe.error ? "Auth service unreachable" : "Auth service reachable",
  };
}

export async function getHealthReport(): Promise<HealthReport> {
  const [database, storage, auth] = await Promise.all([checkDatabase(), checkStorage(), checkAuth()]);
  const checks = [checkConfiguration(), database, storage, auth];

  return {
    status: worst(checks.map((check) => check.status)),
    checkedAt: new Date().toISOString(),
    expectedMigrationVersion: EXPECTED_MIGRATION_VERSION,
    migrationCount: MIGRATION_COUNT,
    checks,
  };
}

/** Cheap liveness signal for load balancers — no outbound calls. */
export function getLivenessReport(): { readonly status: "ok"; readonly checkedAt: string } {
  return { status: "ok", checkedAt: new Date().toISOString() };
}
