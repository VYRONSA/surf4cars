import { NextResponse } from "next/server";

import { getHealthReport, getLivenessReport } from "@/lib/health/health.service";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("health");

/** Always reflects live infrastructure state; never cached. */
export const dynamic = "force-dynamic";

/**
 * GET /api/health          full readiness report (configuration, database, storage, auth)
 * GET /api/health?probe=live   liveness only — no outbound calls, for load-balancer probes
 *
 * Returns 200 when healthy or degraded, 503 when unhealthy, so orchestrators can drain an
 * instance that cannot serve traffic. The body carries variable names and messages only — never
 * configuration values, keys or connection details.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("probe") === "live") {
    return NextResponse.json(getLivenessReport(), { headers: { "cache-control": "no-store" } });
  }

  try {
    const report = await getHealthReport();

    if (report.status !== "healthy") {
      log.warn("health.not-healthy", {
        status: report.status,
        failing: report.checks.filter((check) => check.status !== "healthy").map((check) => check.name),
      });
    }

    return NextResponse.json(report, {
      status: report.status === "unhealthy" ? 503 : 200,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    log.error("health.check-failed", { reason: error instanceof Error ? error : { value: String(error) } });
    return NextResponse.json(
      { status: "unhealthy", checkedAt: new Date().toISOString(), detail: "Health check failed to execute" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
