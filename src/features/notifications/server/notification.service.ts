import { createDomainServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

import { configuredMaxAttempts, nextRetryDelayMs } from "../config";
import { resolveEmailProvider } from "../providers/registry";
import { isProviderAvailable, type EmailProvider } from "../providers/types";
import { renderEnquiryEmail } from "../templates/enquiry-email";
import { timeline } from "./lead-timeline";
import {
  claimDueNotifications,
  enqueueNotification,
  getNotificationForLead,
  recordAttempt,
  type NotificationRecord,
} from "./notification-store";
import { resolveDealershipRecipient } from "./recipient";

const log = createLogger("notification-service");

/**
 * Telling a dealership that an enquiry arrived.
 *
 * THE ORDER IS NOT NEGOTIABLE
 * ===========================
 * Persistence, then notification. `persistEnquiry` has already committed the lead before anything
 * in this file runs, and nothing here can fail that enquiry. Every function returns an outcome; none
 * of them throw into the request. The reason is the whole brief: SURF4CARS must never lose an
 * enquiry, and an enquiry lost because an email provider had a bad thirty seconds is still lost.
 *
 * WHAT THE BUYER IS TOLD
 * ======================
 * The outcome comes back to the API route and reaches the buyer's confirmation. It is the difference
 * between "the dealership has been emailed" and "the dealership can see it and we are still trying
 * to email them", and both are said only when true. Claiming the first when the second happened is
 * the failure this subsystem exists to make impossible — it is not a worse message, it is a false
 * one, and the buyer plans their week around it.
 */

export type NotificationDisposition =
  /** The provider accepted the message. The dealership has been emailed. */
  | "sent"
  /** Recorded, not yet away; the queue will try again. */
  | "retrying"
  /** Tried and given up, or rejected outright. Nobody will be emailed about this one. */
  | "failed"
  /** No address on record for the dealership. An onboarding gap, not a delivery fault. */
  | "unroutable"
  /** No email provider configured on this deployment. */
  | "not_configured";

export interface NotificationOutcome {
  readonly disposition: NotificationDisposition;
  readonly notificationId: string | null;
  /** True only when a dealership actually has this enquiry in an inbox. */
  readonly dealerNotified: boolean;
}

const outcome = (
  disposition: NotificationDisposition,
  notificationId: string | null,
): NotificationOutcome => ({
  disposition,
  notificationId,
  dealerNotified: disposition === "sent",
});

/* ── The enquiry's own context ──────────────────────────────────────────────────────────────────
   Read at send time rather than passed in, because a retry two hours later runs from the queue and
   has no request to read from. One shape, both paths.
   ──────────────────────────────────────────────────────────────────────────────────────────────── */

interface EnquiryContext {
  readonly leadId: string;
  readonly dealershipId: string;
  readonly reference: string;
  readonly buyerName: string;
  readonly buyerEmail: string;
  readonly buyerPhone: string;
  readonly message: string;
  readonly enquiryType: string;
  readonly createdAt: string;
  readonly vehicleTitle: string;
  readonly vehiclePrice: string | null;
  readonly dealershipName: string | null;
}

const priceFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

async function loadEnquiryContext(leadId: string): Promise<EnquiryContext | null> {
  const supabase = createDomainServerClient();
  if (!supabase) return null;

  const lead = await supabase
    .from("leads")
    .select(
      "id,dealership_id,vehicle_id,reference,buyer_name,buyer_email,buyer_phone,message,enquiry_type,created_at",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (lead.error || !lead.data) {
    log.error("notification context load failed", { leadId, message: lead.error?.message });
    return null;
  }

  const row = lead.data as {
    id: string;
    dealership_id: string;
    vehicle_id: string;
    reference: string | null;
    buyer_name: string;
    buyer_email: string;
    buyer_phone: string;
    message: string;
    enquiry_type: string;
    created_at: string;
  };

  const vehicle = await supabase
    .from("inventory_vehicles")
    .select("title,make,model,year,asking_price_cents")
    .eq("id", row.vehicle_id)
    .maybeSingle();

  const vehicleRow = vehicle.data as {
    title?: string | null;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    asking_price_cents?: number | null;
  } | null;

  const dealership = await supabase
    .from("dealerships")
    .select("business_name")
    .eq("id", row.dealership_id)
    .maybeSingle();

  /* A vehicle that has been deleted since the enquiry still deserves an email — the buyer's
     telephone number is the valuable part and it does not stop being valuable because the listing
     went. "A vehicle on SURF4CARS" is honest about what we no longer know. */
  const vehicleTitle =
    vehicleRow?.title?.trim() ||
    [vehicleRow?.year, vehicleRow?.make, vehicleRow?.model].filter(Boolean).join(" ").trim() ||
    "A vehicle on SURF4CARS";

  return {
    leadId: row.id,
    dealershipId: row.dealership_id,
    reference: row.reference ?? "—",
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    message: row.message,
    enquiryType: row.enquiry_type,
    createdAt: row.created_at,
    vehicleTitle,
    vehiclePrice:
      typeof vehicleRow?.asking_price_cents === "number"
        ? priceFormatter.format(vehicleRow.asking_price_cents / 100)
        : null,
    dealershipName:
      (dealership.data as { business_name?: string | null } | null)?.business_name ?? null,
  };
}

/* ── Queue and first attempt ────────────────────────────────────────────────────────────────── */

/**
 * Called immediately after an enquiry is persisted.
 *
 * Everything that can be decided without touching a provider is decided first — is there anybody to
 * email, is there anything to email with — because both of those produce a terminal state, and a row
 * that says `unroutable` on the Founder's card is a specific, fixable sentence where a row that
 * said `failed` after four attempts against a null address would be four wasted attempts and a
 * misleading one.
 */
export async function notifyDealershipOfEnquiry(input: {
  readonly leadId: string;
  readonly dealershipId: string;
}): Promise<NotificationOutcome> {
  const maxAttempts = configuredMaxAttempts();
  const resolution = resolveEmailProvider();
  const recipient = await resolveDealershipRecipient(input.dealershipId);

  if (!recipient) {
    const row = await enqueueNotification({
      leadId: input.leadId,
      dealershipId: input.dealershipId,
      provider: isProviderAvailable(resolution) ? resolution.name : "none",
      destination: null,
      destinationSource: null,
      status: "unroutable",
      maxAttempts,
      lastError: "No email address on record for this dealership",
    });
    await timeline.unroutable(input.leadId, input.dealershipId);
    log.warn("enquiry cannot be notified — no recipient", { leadId: input.leadId });
    return outcome("unroutable", row?.id ?? null);
  }

  if (!isProviderAvailable(resolution)) {
    const row = await enqueueNotification({
      leadId: input.leadId,
      dealershipId: input.dealershipId,
      provider: "none",
      destination: recipient.email,
      destinationSource: recipient.source,
      status: "not_configured",
      maxAttempts,
      lastError: resolution.reason,
    });
    await timeline.notConfigured(input.leadId, input.dealershipId, resolution.reason);
    log.warn("enquiry cannot be notified — no provider", {
      leadId: input.leadId,
      reason: resolution.reason,
    });
    return outcome("not_configured", row?.id ?? null);
  }

  const row = await enqueueNotification({
    leadId: input.leadId,
    dealershipId: input.dealershipId,
    provider: resolution.name,
    destination: recipient.email,
    destinationSource: recipient.source,
    status: "pending",
    maxAttempts,
  });

  if (!row) {
    /* Either this lead was already queued — the duplicate guard did its job — or the insert failed.
       Reporting the existing row's state is more useful than reporting our own confusion. */
    const existing = await getNotificationForLead(input.leadId);
    if (!existing) return outcome("failed", null);
    return outcome(dispositionFromStatus(existing.status), existing.id);
  }

  await timeline.queued(input.leadId, input.dealershipId, recipient.email, resolution.name);

  return attemptNotification(row, resolution);
}

function dispositionFromStatus(status: NotificationRecord["status"]): NotificationDisposition {
  if (status === "sent" || status === "delivered") return "sent";
  if (status === "failed") return "failed";
  if (status === "unroutable") return "unroutable";
  if (status === "not_configured") return "not_configured";
  return "retrying";
}

/* ── One attempt ────────────────────────────────────────────────────────────────────────────── */

export async function attemptNotification(
  record: NotificationRecord,
  provider?: EmailProvider,
): Promise<NotificationOutcome> {
  const resolved = provider ?? resolveEmailProvider();

  if (!isProviderAvailable(resolved)) {
    /* Configuration was removed between queueing and this attempt. Not a delivery failure, and not
       something to burn an attempt on — the row waits for configuration to come back.

       `nextAttemptAt` stays set rather than being cleared. Clearing it here would drop the row out
       of the queue permanently for the sake of a condition that an operator fixes in a minute, and
       it would do so silently. */
    await recordAttempt(record.id, {
      status: "not_configured",
      attempts: record.attempts,
      nextAttemptAt: record.nextAttemptAt ?? new Date().toISOString(),
      lastError: resolved.reason,
    });
    return outcome("not_configured", record.id);
  }

  if (!record.destination) {
    await recordAttempt(record.id, {
      status: "unroutable",
      attempts: record.attempts,
      nextAttemptAt: null,
      lastError: "No destination address",
      failedAt: new Date().toISOString(),
    });
    return outcome("unroutable", record.id);
  }

  const context = await loadEnquiryContext(record.leadId);
  if (!context) {
    /* The lead could not be read. Transient by assumption: a database that is briefly unreachable
       is far more likely than a lead that vanished, and the cascade delete would have taken this
       row with it if it had. */
    return await failOrRetry(record, "Could not load the enquiry to build the email");
  }

  const email = renderEnquiryEmail({
    reference: context.reference,
    dealershipName: context.dealershipName,
    buyerName: context.buyerName,
    buyerEmail: context.buyerEmail,
    buyerPhone: context.buyerPhone,
    message: context.message,
    enquiryType: context.enquiryType,
    vehicleTitle: context.vehicleTitle,
    vehiclePrice: context.vehiclePrice,
    receivedAt: new Date(context.createdAt),
  });

  const attempts = record.attempts + 1;
  const result = await resolved.send({
    to: record.destination,
    subject: email.subject,
    html: email.html,
    text: email.text,
    replyTo: email.replyTo,
  });

  if (result.kind === "sent") {
    const sentAt = new Date().toISOString();
    await recordAttempt(record.id, {
      status: "sent",
      attempts,
      nextAttemptAt: null,
      lastError: null,
      providerMessageId: result.messageId,
      providerResponse: result.response,
      sentAt,
    });
    await timeline.sent(
      record.leadId,
      record.dealershipId,
      record.destination,
      resolved.name,
      result.messageId,
    );
    log.info("enquiry notification sent", { leadId: record.leadId, attempts });
    return outcome("sent", record.id);
  }

  if (result.kind === "permanent") {
    /* An address the provider rejects will be rejected identically in two hours. Stopping now is
       not giving up on the enquiry — the lead is safe and the dealer portal shows it — it is
       declining to generate three more identical errors that hide the real ones. */
    const failedAt = new Date().toISOString();
    await recordAttempt(record.id, {
      status: "failed",
      attempts,
      nextAttemptAt: null,
      lastError: result.error,
      providerResponse: result.response,
      failedAt,
    });
    await timeline.failed(record.leadId, record.dealershipId, attempts, result.error);
    log.error("enquiry notification permanently failed", {
      leadId: record.leadId,
      error: result.error,
    });
    return outcome("failed", record.id);
  }

  return failOrRetry(record, result.error, result.response);
}

async function failOrRetry(
  record: NotificationRecord,
  error: string,
  response?: unknown,
): Promise<NotificationOutcome> {
  const attempts = record.attempts + 1;
  const delay = nextRetryDelayMs(attempts, record.maxAttempts);

  if (delay === null) {
    const failedAt = new Date().toISOString();
    await recordAttempt(record.id, {
      status: "failed",
      attempts,
      nextAttemptAt: null,
      lastError: error,
      providerResponse: response,
      failedAt,
    });
    await timeline.failed(record.leadId, record.dealershipId, attempts, error);
    log.error("enquiry notification exhausted its attempts", { leadId: record.leadId, attempts });
    return outcome("failed", record.id);
  }

  const nextAttemptAt = new Date(Date.now() + delay).toISOString();
  await recordAttempt(record.id, {
    status: "retrying",
    attempts,
    nextAttemptAt,
    lastError: error,
    providerResponse: response,
  });
  await timeline.retrying(record.leadId, record.dealershipId, attempts, nextAttemptAt, error);
  log.warn("enquiry notification will be retried", {
    leadId: record.leadId,
    attempts,
    nextAttemptAt,
  });
  return outcome("retrying", record.id);
}

/* ── The queue ──────────────────────────────────────────────────────────────────────────────── */

export interface SweepResult {
  readonly considered: number;
  readonly sent: number;
  readonly retrying: number;
  readonly failed: number;
  readonly skipped: number;
}

/**
 * Work through everything that is due.
 *
 * Attempts run one after another rather than in parallel. A backlog is usually the symptom of a
 * provider under strain, and answering that by opening fifty concurrent connections to it is how a
 * recovering provider is pushed back over. The queue is not time-critical by the time it is running
 * — the immediate attempt already happened.
 */
export async function sweepDueNotifications(limit = 25): Promise<SweepResult> {
  const due = await claimDueNotifications(limit);
  const result = { considered: due.length, sent: 0, retrying: 0, failed: 0, skipped: 0 };

  if (due.length === 0) return result;

  const resolution = resolveEmailProvider();
  if (!isProviderAvailable(resolution)) {
    /* Nothing is attempted and nothing is marked failed. Attempts are a scarce resource spent on
       real provider responses; spending them on our own missing configuration would empty the queue
       of enquiries that had never been tried. */
    log.warn("sweep skipped — no provider configured", {
      due: due.length,
      reason: resolution.reason,
    });
    return { ...result, skipped: due.length };
  }

  for (const record of due) {
    const attempt = await attemptNotification(record, resolution);
    if (attempt.disposition === "sent") result.sent += 1;
    else if (attempt.disposition === "retrying") result.retrying += 1;
    else if (attempt.disposition === "failed") result.failed += 1;
    else result.skipped += 1;
  }

  log.info("notification sweep finished", { ...result });
  return result;
}
