import { listNotificationsSince } from "./notification-store";

/**
 * What the Founder needs to know about delivery, in one card.
 *
 * WHY "SENT" AND "DELIVERED" ARE TWO NUMBERS
 * ==========================================
 * The brief asks for both, and the honest answer today is that only one of them can be measured.
 * `sent` means a provider accepted the message. `delivered` means a provider told us it reached a
 * mailbox, which arrives on a webhook this platform has not wired — so `delivered` is zero, and
 * `deliveryConfirmationAvailable` is false so the card can say *why* rather than showing a zero that
 * reads like total failure.
 *
 * Merging the two into one green number would be the more comfortable dashboard and a false one. A
 * Founder looking at "128 delivered" would believe 128 dealerships had the enquiry in front of them.
 * What we actually know is that a provider took the message.
 *
 * WHY UNROUTABLE IS SEPARATED FROM FAILED
 * =======================================
 * They have different fixes and different owners. A failure is a delivery problem — a key, a domain,
 * a provider outage. An unroutable enquiry means a dealership has no address on record, which is an
 * onboarding problem, and today it is the dominant one: no dealership has a contact address, so an
 * enquiry to a dealership with no staff account has nobody to reach. Counting those as delivery
 * failures would send somebody to debug an email provider that is working correctly.
 */

export interface NotificationHealth {
  readonly windowHours: number;
  /** Notifications created in the window — one per enquiry that reached persistence. */
  readonly total: number;
  readonly sent: number;
  readonly delivered: number;
  readonly failed: number;
  readonly retrying: number;
  readonly pending: number;
  readonly unroutable: number;
  readonly notConfigured: number;
  /** Mean time from enquiry recorded to provider accepting it, over sent rows. Null when none. */
  readonly averageTimeToSendMs: number | null;
  /** False until a provider delivery webhook exists. The card must say so. */
  readonly deliveryConfirmationAvailable: boolean;
  /** Providers seen in the window, so a mid-window switch is visible rather than averaged over. */
  readonly providers: readonly string[];
}

export async function getNotificationHealth(windowHours = 24): Promise<NotificationHealth> {
  const since = new Date(Date.now() - windowHours * 60 * 60_000);
  const rows = await listNotificationsSince(since);

  const count = (status: string) => rows.filter((row) => row.status === status).length;

  const sentRows = rows.filter((row) => row.sentAt);
  const durations = sentRows
    .map((row) => new Date(row.sentAt!).getTime() - new Date(row.createdAt).getTime())
    /* A negative or absurd duration means clock skew between the database default and the server,
       not a fast send. Dropping it is better than letting it drag the mean somewhere impossible. */
    .filter((ms) => Number.isFinite(ms) && ms >= 0 && ms < 24 * 60 * 60_000);

  return {
    windowHours,
    total: rows.length,
    sent: count("sent") + count("delivered"),
    delivered: count("delivered"),
    failed: count("failed"),
    retrying: count("retrying"),
    pending: count("pending"),
    unroutable: count("unroutable"),
    notConfigured: count("not_configured"),
    averageTimeToSendMs:
      durations.length > 0
        ? Math.round(durations.reduce((sum, ms) => sum + ms, 0) / durations.length)
        : null,
    deliveryConfirmationAvailable: false,
    providers: [...new Set(rows.map((row) => row.provider))].sort(),
  };
}
