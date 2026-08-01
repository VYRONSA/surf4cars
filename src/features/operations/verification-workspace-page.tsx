import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadVerificationOverview } from "@/services/verification/verification.service";

/**
 * Verification Workspace.
 *
 * Organised around throughput rather than reporting. The first question an operator has is "what do I pick
 * up next", so the page opens with the highest-priority claims across every queue rather than with counts.
 *
 * Priority is customer impact, not age. FIFO would place a three-month-old logo claim above a two-day-old
 * contact claim, while the contact claim is the one turning every listing at that dealership into a dead end.
 *
 * Draft claims are counted and never queued. A draft is the absence of an assertion, and listing 640 of them
 * here would bury real verification work beneath onboarding work the Onboarding Centre already reports.
 */

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function VerificationWorkspacePage() {
  const overview = await loadVerificationOverview();

  return (
    <section className="space-y-6 py-1">
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[linear-gradient(165deg,var(--color-surface-raised),var(--color-background))] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          SURF Operations Centre
        </p>
        <h1 className="mt-2 text-balance text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h1)]">
          Verification Workspace
        </h1>
        <p className="mt-3 max-w-3xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          Claims, not fields. {overview.totalClaims} claim(s) tracked; {overview.draftClaims} in draft, where
          nobody has asserted anything yet.
        </p>
        <p className="mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          Last run {formatTimestamp(overview.generatedAt)}
        </p>
      </div>

      {overview.incomplete && (
        <Card variant="glass" padding="md" className="border-[var(--color-warning)]">
          <CardContent className="text-[length:var(--text-body-sm)] text-[var(--color-warning)]">
            {overview.incomplete}
          </CardContent>
        </Card>
      )}

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Pick up next</CardTitle>
          <CardDescription>
            Ordered by what a customer loses if the claim is wrong, then by age. Never age alone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.queued.length === 0 ? (
            /* An empty queue and a verified marketplace look identical unless one of them says so. */
            <div className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              <p className="text-[var(--color-foreground)]">No claims are awaiting verification.</p>
              <p className="mt-1">
                This is an empty queue, not a verified marketplace — nothing has been submitted yet. All{" "}
                {overview.draftClaims} claims sit in draft, which is onboarding work rather than verification
                work.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {overview.queued.slice(0, 15).map((item) => (
                <li
                  key={item.claim.id}
                  className="border-b border-[var(--color-border-subtle)] pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-overlay)] px-2 py-0.5 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                      {item.queue}
                    </span>
                    <span className="text-[length:var(--text-body-md)] font-medium">{item.label}</span>
                    <span className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                      {item.claim.subjectName}
                    </span>
                  </div>
                  <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                    {item.reason}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {overview.summaries.length > 0 && (
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Queues</CardTitle>
            <CardDescription>Derived from claim state and policy, never stored.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {overview.summaries.map((summary) => (
                <div
                  key={summary.queue}
                  className="min-w-[11rem] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] px-4 py-3"
                >
                  <p className="text-[length:var(--text-h3)] font-semibold tabular-nums">{summary.count}</p>
                  <p className="mt-0.5 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                    {summary.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
