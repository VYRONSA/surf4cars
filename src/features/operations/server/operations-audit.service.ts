import { updatePlatformStore } from "@/lib/local-persistence/platform-store";
import { createSupabaseServerClient } from "@/lib/supabase";

interface OperationsAuditInput {
  readonly dealershipId: string;
  readonly eventName: string;
  readonly source: string;
  readonly payload?: Record<string, unknown>;
}

export async function logOperationsAuditEvent(input: OperationsAuditInput, accessToken?: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const eventId = crypto.randomUUID();
  const supabase = createSupabaseServerClient(accessToken);

  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      marketAnalyticsEvents: [
        ...current.marketAnalyticsEvents,
        {
          id: eventId,
          dealershipId: input.dealershipId,
          vehicleId: null,
          eventType: "operations-centre",
          eventName: input.eventName,
          eventTimestamp: timestamp,
          actorId: null,
          actorType: "system",
          sessionId: null,
          source: input.source,
          payload: input.payload ?? {},
          createdAt: timestamp,
        },
      ],
    }));
    return;
  }

  await supabase.from("market_analytics_events").insert({
    id: eventId,
    dealership_id: input.dealershipId,
    vehicle_id: null,
    event_type: "operations-centre",
    event_name: input.eventName,
    event_timestamp: timestamp,
    actor_id: null,
    actor_type: "system",
    session_id: null,
    source: input.source,
    payload: input.payload ?? {},
    created_at: timestamp,
  });
}
