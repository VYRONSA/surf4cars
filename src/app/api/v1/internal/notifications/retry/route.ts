import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { sweepDueNotifications } from "@/features/notifications";

/**
 * Runs the retry queue. Called by a scheduler, never by a browser.
 *
 * WHY THE QUEUE NEEDS AN ENDPOINT AT ALL
 * ======================================
 * A retry "in five minutes" has to be somebody's job. `setTimeout` is not that somebody: on a
 * serverless host the function is frozen the moment the response is returned, so a timer scheduled
 * during a request is a retry that usually never runs and occasionally does — which is worse than
 * one that never runs, because it cannot be reasoned about. Putting the due-work query behind a URL
 * makes the schedule external, inspectable and re-runnable by hand when something has gone wrong.
 *
 * THIS IS NOT WIRED TO A SCHEDULER YET
 * ====================================
 * The endpoint works and can be curled. Nothing calls it on a timer, so until a cron job exists,
 * the immediate attempt is the only one that happens on its own and the queue drains only when
 * somebody asks it to. That is a real gap and it is recorded in `docs/launch-readiness.md` rather
 * than left to be discovered — see the deployment note there for the one-line Vercel cron entry.
 *
 * SECURITY
 * ========
 * A shared secret, compared in constant time. If `NOTIFICATION_CRON_SECRET` is unset the endpoint
 * refuses everything: an unauthenticated route that drains a queue is a way for anyone to exhaust
 * a dealership's retry attempts against a provider, and defaulting to open because a variable is
 * missing is how that happens by accident.
 */

export const dynamic = "force-dynamic";

function presentedSecret(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return request.headers.get("x-notification-secret")?.trim() ?? null;
}

function secretMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  /* timingSafeEqual throws on a length mismatch, which would itself leak the length. */
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * GET and POST do the same thing, because Vercel's scheduler issues GET.
 *
 * Worth stating plainly: a cron entry pointed at a POST-only route returns 405 every five minutes
 * and the retry queue silently never drains. The dashboard would show the job running and
 * succeeding at the platform level while nothing happened, which is the most expensive kind of
 * wrong — a green tick over a dead process.
 *
 * `CRON_SECRET` is accepted alongside `NOTIFICATION_CRON_SECRET` for the same reason: Vercel injects
 * `Authorization: Bearer $CRON_SECRET` automatically, but only for a variable of that exact name.
 * Requiring our own name would mean the built-in authentication silently did nothing.
 */
function cronSecret(): string | undefined {
  return (
    process.env.NOTIFICATION_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim() || undefined
  );
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  const expected = cronSecret();

  if (!expected) {
    return NextResponse.json(
      { error: "NOTIFICATION_CRON_SECRET is not set; the retry endpoint is disabled." },
      { status: 503 },
    );
  }

  const presented = presentedSecret(request);
  if (!presented || !secretMatches(presented, expected)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 25;

  const result = await sweepDueNotifications(limit);
  return NextResponse.json({ ok: true, ...result });
}
