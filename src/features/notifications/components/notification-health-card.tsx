import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getNotificationHealth } from "../server/notification-health.service";
import { resolveEmailProvider } from "../providers/registry";
import { isProviderAvailable } from "../providers/types";

/**
 * Whether enquiries are reaching dealerships, on the Founder's dashboard.
 *
 * WHAT THIS CARD IS FOR
 * =====================
 * One question: is anybody being told? Everything else on the operations dashboard measures the
 * platform's activity; this measures whether that activity produced its only outcome that matters
 * to a dealership.
 *
 * WHY IT LEADS WITH THE BAD NEWS
 * ==============================
 * The configuration banner and the unroutable count sit above the counters, not below them. A
 * dashboard that shows "0 sent" in small grey type under four healthy-looking numbers is how a
 * subsystem stays broken for a fortnight. If nothing can be sent, that sentence is the card.
 */

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 60_000)} min`;
}

export async function NotificationHealthCard() {
  const health = await getNotificationHealth(24);
  const provider = resolveEmailProvider();
  const providerAvailable = isProviderAvailable(provider);

  const counters: readonly { label: string; value: string; tone: "neutral" | "good" | "bad" }[] = [
    { label: "Enquiries in 24h", value: String(health.total), tone: "neutral" },
    { label: "Sent to dealer", value: String(health.sent), tone: health.sent > 0 ? "good" : "neutral" },
    { label: "Retrying", value: String(health.retrying), tone: health.retrying > 0 ? "bad" : "neutral" },
    { label: "Failed", value: String(health.failed), tone: health.failed > 0 ? "bad" : "neutral" },
    {
      label: "Nobody to email",
      value: String(health.unroutable),
      tone: health.unroutable > 0 ? "bad" : "neutral",
    },
    { label: "Average time to send", value: formatDuration(health.averageTimeToSendMs), tone: "neutral" },
  ];

  return (
    <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
      <CardHeader>
        <CardTitle>Enquiry Notifications</CardTitle>
        <CardDescription>
          Whether enquiries recorded in the last 24 hours reached the dealership they were meant for.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!providerAvailable && (
          <p className="rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-[length:var(--text-body-sm)] text-[var(--color-danger)]">
            <strong className="font-semibold">No email provider configured. </strong>
            {provider.reason} Enquiries are still being recorded and dealers can see them in their
            dashboard — nothing is being lost — but nobody is being told.
          </p>
        )}

        {health.unroutable > 0 && (
          <p className="rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] px-3 py-2 text-[length:var(--text-body-sm)] text-[var(--color-warning)]">
            {/* An onboarding problem wearing a delivery problem's clothes. Naming the fix here is
                what stops somebody spending an afternoon on the email provider. */}
            <strong className="font-semibold">
              {health.unroutable} {health.unroutable === 1 ? "enquiry" : "enquiries"} had nobody to
              email.{" "}
            </strong>
            Those dealerships have no contact address and no staff account. The fix is onboarding,
            not delivery.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {counters.map((counter) => (
            <div
              key={counter.label}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2"
            >
              <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
                {counter.label}
              </p>
              <p
                className={
                  counter.tone === "bad"
                    ? "mt-1 text-[length:var(--text-h4)] font-semibold text-[var(--color-danger)]"
                    : counter.tone === "good"
                      ? "mt-1 text-[length:var(--text-h4)] font-semibold text-[var(--color-success)]"
                      : "mt-1 text-[length:var(--text-h4)] font-semibold text-[var(--color-foreground)]"
                }
              >
                {counter.value}
              </p>
            </div>
          ))}
        </div>

        {/*
          The footnote that keeps the card honest.
          =======================================
          "Sent" is a provider accepting the message. Delivery confirmation needs a webhook that does
          not exist yet, so there is no "Delivered" counter above — an always-zero one would read as
          catastrophic failure, and a counter that quietly copied "Sent" would certify deliveries
          nobody observed. Saying which of the two we can see is the only version that is true.
        */}
        <p className="text-[length:var(--text-caption)] leading-relaxed text-[var(--color-muted-foreground)]">
          {health.deliveryConfirmationAvailable
            ? "Delivery is confirmed by the provider."
            : "“Sent” means the email provider accepted the message. Confirming it reached the mailbox needs a provider delivery webhook, which is not wired yet — so delivery is not claimed here."}
          {providerAvailable ? ` Provider: ${provider.name}.` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
