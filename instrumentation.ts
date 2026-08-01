import type { Instrumentation } from "next";

/**
 * Server instrumentation hook. Runs once per server instance before requests are served.
 *
 * Diagnostics only — nothing here changes routing, rendering or business behaviour.
 */
export async function register(): Promise<void> {
  // Only the Node.js runtime has process-level error hooks; the edge runtime does not.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { initialiseRuntimeDiagnostics } = await import("@/lib/observability/runtime-diagnostics");
  initialiseRuntimeDiagnostics();
}

/** Captures server-side request errors that Next.js would otherwise only surface in the console. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { createLogger } = await import("@/lib/observability/logger");
  createLogger("request").error("request.error", {
    reason: error instanceof Error ? error : { value: String(error) },
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
