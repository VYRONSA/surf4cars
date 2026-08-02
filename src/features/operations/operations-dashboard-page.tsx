import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationHealthCard } from "@/features/notifications";
import { getOperationsDashboardData } from "@/features/operations/server/operations-dashboard.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";

function formatGeneratedAt(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function OperationsDashboardPage() {
  const data = await getOperationsDashboardData();
  const store = await readPlatformStore();
  const primaryDealershipId = store.dealerships[0]?.id;

  if (primaryDealershipId) {
    await logOperationsAuditEvent(
      {
        dealershipId: primaryDealershipId,
        eventName: "operations.dashboard.view",
        source: "operations-centre",
        payload: { generatedAt: data.generatedAt },
      },
    ).catch(() => undefined);
  }

  return (
    <section className="space-y-6 py-1">
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[radial-gradient(circle_at_top_right,rgba(0,112,255,0.14),transparent_48%),linear-gradient(165deg,var(--color-surface-raised),var(--color-background))] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(0,112,255,0.18),rgba(0,112,255,0))]" />
        <p className="relative text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          SURF Operations Centre
        </p>
        <h1 className="relative mt-2 text-balance text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h1)]">
          Executive Dashboard
        </h1>
        <p className="relative mt-3 max-w-3xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          Unified internal operating visibility across onboarding, inventory, marketplace activity, and platform telemetry.
        </p>
        <p className="relative mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          Last refreshed {formatGeneratedAt(data.generatedAt)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.widgets.map((widget) => (
          <Card
            key={widget.id}
            variant="glass"
            padding="md"
            className="border-[var(--color-border-subtle)] motion-card hover:border-[var(--color-border)]"
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
                {widget.label}
              </CardDescription>
              <CardTitle className="text-[length:var(--text-h3)]">{widget.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{widget.detail}</p>
              {widget.availability === "unavailable" && (
                <p className="mt-2 inline-flex rounded-[var(--radius-pill)] bg-[var(--color-primary-muted)] px-2 py-0.5 text-[length:var(--text-caption)] font-medium text-[var(--color-primary-text)]">
                  No data yet
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Above Recent Activity, deliberately. An enquiry that never reached a dealership is the most
          expensive thing that can go wrong on this platform, and it is invisible from every other
          panel on this page. */}
      <NotificationHealthCard />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Unified event stream from the existing analytics and audit event pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">No tracked events yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentActivity.map((event) => (
                  <li key={event.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                    <p className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)]">{event.title}</p>
                    <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{event.source} · {event.timestamp}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Platform Alerts</CardTitle>
            <CardDescription>Operational alerts and launch caveats for SOC-001 foundation.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.alerts.map((alert) => (
                <li key={alert} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
