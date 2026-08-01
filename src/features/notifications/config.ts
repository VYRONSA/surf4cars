/**
 * When a failed notification is tried again.
 *
 * The brief asks for immediate, then five minutes, thirty minutes, two hours. The first of those is
 * not a delay — it is the send that happens while the buyer is still looking at the confirmation.
 * So the schedule below holds the three *waits* that follow a failure, and four attempts in total:
 *
 *   attempt 1   immediately, in the enquiry request
 *   attempt 2   5 minutes later
 *   attempt 3   30 minutes later
 *   attempt 4   2 hours later
 *   then        permanent failure; the queue stops
 *
 * The shape is deliberate rather than arbitrary. Five minutes catches a momentary blip while the
 * lead is still fresh; two hours is far enough out to survive a provider outage that lasts a lunch
 * hour. Doubling from five minutes would need five more attempts to reach two hours, and each one
 * is a row on the Founder's card that means nothing.
 */

export const RETRY_SCHEDULE_MS: readonly number[] = [
  5 * 60_000, //      wait after attempt 1
  30 * 60_000, //     wait after attempt 2
  2 * 60 * 60_000, // wait after attempt 3
];

/** Four: the immediate send plus one per wait in the schedule. */
export const DEFAULT_MAX_ATTEMPTS = RETRY_SCHEDULE_MS.length + 1;

/**
 * `NOTIFICATION_MAX_ATTEMPTS` raises or lowers the ceiling without a deploy — useful during an
 * outage, when the right answer is to stop hammering a provider that is down, and afterwards, when
 * it is to let the backlog run to the end of the schedule.
 *
 * Clamped to the schedule's length because an attempt with no wait defined would fire immediately
 * on every sweep, turning a configuration change into a retry storm against a provider that is
 * already unwell.
 */
export function configuredMaxAttempts(): number {
  const raw = Number.parseInt(process.env.NOTIFICATION_MAX_ATTEMPTS ?? "", 10);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_MAX_ATTEMPTS;
  return Math.min(raw, DEFAULT_MAX_ATTEMPTS);
}

/**
 * How long to wait after `attemptsSoFar` failed attempts, or null when the queue is finished.
 *
 * Null is the signal for a permanent stop. It is returned when the attempt ceiling is reached, and
 * the caller marks the row `failed` — after which `claimDueNotifications` will never select it
 * again, because it only looks at `pending` and `retrying`.
 */
export function nextRetryDelayMs(attemptsSoFar: number, maxAttempts: number): number | null {
  if (attemptsSoFar >= maxAttempts) return null;
  return RETRY_SCHEDULE_MS[attemptsSoFar - 1] ?? null;
}
