import { createDomainServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("notification-store");

/**
 * Reading and writing `enquiry_notifications`.
 *
 * Kept apart from the service because the service is where the decisions are — retry or give up,
 * send or refuse — and those are worth reading without a PostgREST query in between. Everything
 * here is mechanical.
 */

export type NotificationStatus =
  | "pending"
  | "retrying"
  | "sent"
  | "delivered"
  | "failed"
  | "unroutable"
  | "not_configured";

export interface NotificationRecord {
  readonly id: string;
  readonly leadId: string;
  readonly dealershipId: string;
  readonly channel: string;
  readonly provider: string;
  readonly destination: string | null;
  readonly destinationSource: string | null;
  readonly status: NotificationStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly nextAttemptAt: string | null;
  readonly lastError: string | null;
  readonly providerMessageId: string | null;
  readonly createdAt: string;
  readonly sentAt: string | null;
  readonly deliveredAt: string | null;
  readonly failedAt: string | null;
}

interface NotificationRow {
  id: string;
  lead_id: string;
  dealership_id: string;
  channel: string;
  provider: string;
  destination: string | null;
  destination_source: string | null;
  status: NotificationStatus;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string | null;
  last_error: string | null;
  provider_message_id: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
}

const SELECT =
  "id,lead_id,dealership_id,channel,provider,destination,destination_source,status,attempts,max_attempts,next_attempt_at,last_error,provider_message_id,created_at,sent_at,delivered_at,failed_at";

const toRecord = (row: NotificationRow): NotificationRecord => ({
  id: row.id,
  leadId: row.lead_id,
  dealershipId: row.dealership_id,
  channel: row.channel,
  provider: row.provider,
  destination: row.destination,
  destinationSource: row.destination_source,
  status: row.status,
  attempts: row.attempts,
  maxAttempts: row.max_attempts,
  nextAttemptAt: row.next_attempt_at,
  lastError: row.last_error,
  providerMessageId: row.provider_message_id,
  createdAt: row.created_at,
  sentAt: row.sent_at,
  deliveredAt: row.delivered_at,
  failedAt: row.failed_at,
});

export interface EnqueueInput {
  readonly leadId: string;
  readonly dealershipId: string;
  readonly provider: string;
  readonly destination: string | null;
  readonly destinationSource: string | null;
  readonly status: NotificationStatus;
  readonly maxAttempts: number;
  readonly lastError?: string | null;
}

/**
 * Claim the one notification slot for this lead.
 *
 * Returns null when a row already exists, which is how duplicate prevention is enforced: the unique
 * index on `(lead_id, channel)` decides, not a read-then-write in this process. Two requests racing
 * — a live enquiry and the retry sweeper, or a double-submitted form — both attempt the insert and
 * exactly one wins. The loser gets 23505 and stops, rather than sending the dealership a second copy.
 */
export async function enqueueNotification(input: EnqueueInput): Promise<NotificationRecord | null> {
  const supabase = createDomainServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("enquiry_notifications")
    .insert({
      lead_id: input.leadId,
      dealership_id: input.dealershipId,
      channel: "email",
      provider: input.provider,
      destination: input.destination,
      destination_source: input.destinationSource,
      status: input.status,
      max_attempts: input.maxAttempts,
      last_error: input.lastError ?? null,
      /* `not_configured` is due immediately, because it is waiting on an operator rather than on a
         provider. The sweeper declines to attempt it until a provider exists, so it costs nothing
         to be due — and the moment one is configured the backlog drains instead of being stranded
         behind enquiries that arrived afterwards. */
      next_attempt_at:
        input.status === "pending" || input.status === "not_configured"
          ? new Date().toISOString()
          : null,
      failed_at:
        input.status === "unroutable" || input.status === "failed" ? new Date().toISOString() : null,
    })
    .select(SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      log.info("notification already queued for lead", { leadId: input.leadId });
      return null;
    }
    log.error("notification enqueue failed", { leadId: input.leadId, message: error.message });
    return null;
  }

  return toRecord(data as unknown as NotificationRow);
}

export interface AttemptOutcomeUpdate {
  readonly status: NotificationStatus;
  readonly attempts: number;
  readonly nextAttemptAt: string | null;
  readonly lastError: string | null;
  readonly providerMessageId?: string | null;
  readonly providerResponse?: unknown;
  readonly sentAt?: string | null;
  readonly failedAt?: string | null;
}

export async function recordAttempt(
  id: string,
  update: AttemptOutcomeUpdate,
): Promise<NotificationRecord | null> {
  const supabase = createDomainServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("enquiry_notifications")
    .update({
      status: update.status,
      attempts: update.attempts,
      next_attempt_at: update.nextAttemptAt,
      last_error: update.lastError,
      provider_message_id: update.providerMessageId ?? null,
      /* Stored as given by the provider, unsummarised. When a dealer says they never received it,
         the provider's own words are the only thing that settles the argument. */
      provider_response: (update.providerResponse ?? null) as never,
      sent_at: update.sentAt ?? null,
      failed_at: update.failedAt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error) {
    log.error("notification attempt write failed", { id, message: error.message });
    return null;
  }
  return toRecord(data as unknown as NotificationRow);
}

export async function getNotificationForLead(leadId: string): Promise<NotificationRecord | null> {
  const supabase = createDomainServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("enquiry_notifications")
    .select(SELECT)
    .eq("lead_id", leadId)
    .eq("channel", "email")
    .maybeSingle();

  if (error || !data) return null;
  return toRecord(data as unknown as NotificationRow);
}

/**
 * Everything due for another attempt.
 *
 * `next_attempt_at <= now` and a live status. A row that has run out of attempts is `failed` and is
 * never selected again, which is what "permanent failures stop retrying" means in practice — the
 * queue does not hold anything it has given up on.
 */
export async function claimDueNotifications(limit: number): Promise<readonly NotificationRecord[]> {
  const supabase = createDomainServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("enquiry_notifications")
    .select(SELECT)
    /* `not_configured` is in here so a deployment that gains a provider notifies the enquiries it
       already has, not only the next one. */
    .in("status", ["pending", "retrying", "not_configured"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);

  if (error) {
    log.error("due notification read failed", { message: error.message });
    return [];
  }
  return (data ?? []).map((row) => toRecord(row as unknown as NotificationRow));
}

/** Every notification created since a point in time. Feeds the Founder health card. */
export async function listNotificationsSince(
  since: Date,
): Promise<readonly NotificationRecord[]> {
  const supabase = createDomainServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("enquiry_notifications")
    .select(SELECT)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    log.error("notification window read failed", { message: error.message });
    return [];
  }
  return (data ?? []).map((row) => toRecord(row as unknown as NotificationRow));
}
