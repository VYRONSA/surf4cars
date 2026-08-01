import { createDomainServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("lead-timeline");

/**
 * Append-only history for one lead.
 *
 * APPEND-ONLY IS THE POINT
 * ========================
 * Nothing here updates a row. A notification that was sent and then bounced produces two entries,
 * not one entry that changes its mind — because the question a dealer asks three weeks later is
 * "what happened to this enquiry", and a record that only holds the latest state cannot answer it.
 * `enquiry_notifications` holds current state; this holds the sequence that produced it.
 *
 * WRITES HERE NEVER FAIL A CALLER
 * ==============================
 * Every function returns void and swallows its error into the log. The lead is already committed
 * before any of this runs, and failing a notification because its audit entry did not write would
 * discard a real delivery to protect the history of it. That is the same rule `persistEnquiry`
 * follows for the same reason.
 */

export type LeadTimelineType =
  | "created"
  | "notification_queued"
  | "notification_sent"
  | "notification_delivered"
  | "notification_retrying"
  | "notification_failed"
  | "notification_unroutable"
  | "notification_not_configured";

async function append(entry: {
  readonly leadId: string;
  readonly dealershipId: string;
  readonly type: LeadTimelineType;
  readonly message: string;
  readonly metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createDomainServerClient();
  if (!supabase) return;

  const { error } = await supabase.from("lead_timeline").insert({
    lead_id: entry.leadId,
    dealership_id: entry.dealershipId,
    type: entry.type,
    message: entry.message,
    /* The platform is the actor, not a person. Naming it explicitly keeps a machine event from
       reading like something a member of staff did. */
    actor_id: "system:notifications",
    actor_name: "SURF4CARS",
    metadata: entry.metadata ?? {},
    created_at: new Date().toISOString(),
  });

  if (error) {
    log.error("timeline append failed", {
      leadId: entry.leadId,
      type: entry.type,
      message: error.message,
    });
  }
}

export const timeline = {
  queued: (leadId: string, dealershipId: string, destination: string, provider: string) =>
    append({
      leadId,
      dealershipId,
      type: "notification_queued",
      message: `Email notification queued to ${destination}`,
      metadata: { destination, provider },
    }),

  sent: (leadId: string, dealershipId: string, destination: string, provider: string, messageId: string | null) =>
    append({
      leadId,
      dealershipId,
      type: "notification_sent",
      /* "Sent" is the honest verb for a provider accepting the message. "Delivered" belongs to the
         webhook that says a mailbox received it, and this codebase does not have that webhook. */
      message: `Email sent to ${destination}`,
      metadata: { destination, provider, providerMessageId: messageId },
    }),

  retrying: (leadId: string, dealershipId: string, attempt: number, nextAttemptAt: string, error: string) =>
    append({
      leadId,
      dealershipId,
      type: "notification_retrying",
      message: `Email attempt ${attempt} failed — retrying`,
      metadata: { attempt, nextAttemptAt, error },
    }),

  failed: (leadId: string, dealershipId: string, attempts: number, error: string) =>
    append({
      leadId,
      dealershipId,
      type: "notification_failed",
      message: `Email delivery failed after ${attempts} attempt${attempts === 1 ? "" : "s"}`,
      metadata: { attempts, error },
    }),

  unroutable: (leadId: string, dealershipId: string) =>
    append({
      leadId,
      dealershipId,
      type: "notification_unroutable",
      /* Written to be read by a person deciding what to do, not by a developer debugging. The fix
         is an onboarding one and the sentence says so. */
      message: "No email address on record for this dealership — nobody could be notified",
      metadata: { remedy: "Add a contact address to the dealership or invite a staff member" },
    }),

  notConfigured: (leadId: string, dealershipId: string, reason: string) =>
    append({
      leadId,
      dealershipId,
      type: "notification_not_configured",
      message: "Email notifications are not configured — nothing was sent",
      metadata: { reason },
    }),
};
