import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LISTING_STAGE_LABELS } from "@/services/quality/dealer-readiness";
import { loadOnboardingOverview } from "@/services/quality/dealer-readiness.service";

/**
 * Dealer Onboarding Centre — the operational console for bringing dealerships online.
 *
 * The organising idea is the bottleneck, not the list. Two hundred dealer records each with eleven
 * checkboxes is a spreadsheet; "126 dealerships are all blocked on the same step, and it is ours to clear"
 * is a decision. So the first thing on the page is what is blocking the most dealerships and who owns it,
 * and the per-dealership detail sits beneath that for the cases where it is genuinely one dealer's problem.
 *
 * Steps carry an owner for the same reason the Quality Centre splits integrity from completeness: knowing
 * *who* can resolve something is most of knowing what to do about it. A step owned by `engineering` is our
 * backlog appearing in an operational console, which is exactly where it should be visible.
 */

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const OWNER_LABEL: Readonly<Record<string, string>> = {
  dealer: "Dealer",
  surf4cars: "SURF4CARS",
  engineering: "Engineering",
};

const OWNER_STYLE: Readonly<Record<string, string>> = {
  dealer: "bg-[var(--color-secondary-muted)] text-[var(--color-secondary)]",
  surf4cars: "bg-[var(--color-primary-muted)] text-[var(--color-primary-text)]",
  engineering: "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
};

export async function OnboardingCentrePage() {
  const overview = await loadOnboardingOverview();

  return (
    <section className="space-y-6 py-1">
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[linear-gradient(165deg,var(--color-surface-raised),var(--color-background))] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          SURF Operations Centre
        </p>
        <h1 className="mt-2 text-balance text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h1)]">
          Dealer Onboarding Centre
        </h1>
        <p className="mt-3 max-w-3xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          What stands between each dealership and a marketplace presence worth trading on —{" "}
          {overview.dealers.length} production dealerships assessed.
        </p>
        <p className="mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          Last run {formatTimestamp(overview.generatedAt)}
        </p>
      </div>

      {overview.incomplete && (
        <Card variant="glass" padding="md" className="border-[var(--color-warning)]">
          <CardContent className="text-[length:var(--text-body-sm)] text-[var(--color-warning)]">
            {overview.incomplete} This is not a fully onboarded network — it is an unknown one.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
              Average dealer health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[length:var(--text-h2)] font-semibold">{overview.averageHealth}</p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Weighted by commercial consequence
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
              Dealerships assessed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[length:var(--text-h2)] font-semibold">{overview.dealers.length}</p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              {overview.demonstrationDealers.length} demonstration record(s) excluded
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
              Fully onboarded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[length:var(--text-h2)] font-semibold">
              {overview.dealers.filter((d) => d.nextStep === null).length}
            </p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Nothing outstanding on any step
            </p>
          </CardContent>
        </Card>
      </div>

      {/*
        The bottleneck view.

        Deliberately first. When every dealership is blocked on the same step the useful output is one line,
        not 126 rows — and the owner column is what turns it into an assignment.
      */}
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>What is blocking onboarding</CardTitle>
          <CardDescription>
            The next step for each dealership, grouped. Clearing the top row moves the most dealerships
            forward.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.bottlenecks.length === 0 ? (
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              No dealership has an outstanding step.
            </p>
          ) : (
            <ul className="space-y-3">
              {overview.bottlenecks.map((row) => (
                <li key={row.stepId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="min-w-[3.5rem] text-[length:var(--text-h3)] font-semibold tabular-nums">
                    {row.dealerships}
                  </span>
                  <span className="text-[length:var(--text-body-md)]">{row.label}</span>
                  <span
                    className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[length:var(--text-caption)] font-medium ${OWNER_STYLE[row.owner] ?? ""}`}
                  >
                    {OWNER_LABEL[row.owner] ?? row.owner}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Inventory readiness</CardTitle>
          <CardDescription>
            Every listing sits at the first requirement it has not met. Derived from the records, never
            stored — a stage column would drift the moment a photograph was added without updating it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {overview.pipeline.map((row) => (
              <div
                key={row.stage}
                className="min-w-[9rem] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] px-4 py-3"
              >
                <p className="text-[length:var(--text-h3)] font-semibold tabular-nums">{row.count}</p>
                <p className="mt-0.5 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                  {LISTING_STAGE_LABELS[row.stage]}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Dealerships by health</CardTitle>
          <CardDescription>
            Lowest first. The score exists to show where help is needed, not to rank dealerships against each
            other.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[length:var(--text-body-sm)]">
              <thead className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted)]">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Dealership</th>
                  <th className="pb-2 pr-4 text-right font-medium">Health</th>
                  <th className="pb-2 pr-4 text-right font-medium">Steps</th>
                  <th className="pb-2 font-medium">Next step</th>
                </tr>
              </thead>
              <tbody>
                {overview.dealers.slice(0, 25).map((dealer) => (
                  <tr key={dealer.dealershipId} className="border-t border-[var(--color-border-subtle)]">
                    <td className="py-2 pr-4">{dealer.name}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{dealer.healthScore}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-[var(--color-muted-foreground)]">
                      {dealer.completedSteps}/{dealer.totalSteps}
                    </td>
                    <td className="py-2 text-[var(--color-muted-foreground)]">
                      {dealer.nextStep?.label ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {overview.dealers.length > 25 && (
            <p className="mt-3 text-[length:var(--text-caption)] text-[var(--color-muted)]">
              Showing 25 of {overview.dealers.length}. Run{" "}
              <code>node scripts/prp001-onboarding-verify.mjs</code> for the full list.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
