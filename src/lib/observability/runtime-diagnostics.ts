/**
 * Startup diagnostics and unhandled exception capture.
 *
 * Registered once per server process from instrumentation.ts. This is diagnostic only: it logs and
 * never alters control flow, so application behaviour is identical with or without it.
 */

import { validateEnvironment } from "@/config/env";
import { EXPECTED_MIGRATION_VERSION, MIGRATION_COUNT } from "@/config/migrations";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("runtime");

declare global {
  var __surf4carsDiagnosticsRegistered: boolean | undefined;
}

/** Logs the configuration the process actually started with. Never throws. */
export function reportStartupDiagnostics(): void {
  const validation = validateEnvironment();

  log.info("startup.configuration", {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    runtime: typeof process.versions?.node === "string" ? `node-${process.versions.node}` : "unknown",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "(unset)",
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    expectedMigrationVersion: EXPECTED_MIGRATION_VERSION,
    migrationCount: MIGRATION_COUNT,
    configValid: validation.valid,
  });

  for (const issue of validation.issues) {
    const emitIssue = issue.severity === "error" ? log.error : log.warn;
    emitIssue("startup.configuration.issue", { variable: issue.variable, detail: issue.message });
  }

  if (!validation.valid) {
    // Deliberately not fatal: a running instance that reports unhealthy is more diagnosable than
    // one that refuses to boot. The health endpoint reports the same failure for orchestrators.
    log.error("startup.configuration.invalid", {
      errorCount: validation.issues.filter((issue) => issue.severity === "error").length,
      action: "Instance will start but report unhealthy until configuration is corrected.",
    });
  }
}

/** Captures otherwise-silent process-level failures. Safe to call more than once. */
export function registerUnhandledExceptionCapture(): void {
  if (globalThis.__surf4carsDiagnosticsRegistered) return;
  globalThis.__surf4carsDiagnosticsRegistered = true;

  process.on("unhandledRejection", (reason) => {
    log.error("process.unhandledRejection", {
      reason: reason instanceof Error ? reason : { value: String(reason) },
    });
  });

  process.on("uncaughtException", (error) => {
    // Logged, not swallowed — Node's default exit behaviour is left untouched.
    log.error("process.uncaughtException", { reason: error });
  });
}

export function initialiseRuntimeDiagnostics(): void {
  registerUnhandledExceptionCapture();
  reportStartupDiagnostics();
}
