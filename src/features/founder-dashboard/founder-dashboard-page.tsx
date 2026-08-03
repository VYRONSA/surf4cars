import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import {
  loadFounderDashboard,
  type DashboardMetric,
  type DashboardScore,
} from "@/services/founder-dashboard/founder-dashboard.service";
import { cn } from "@/utils";

/**
 * The Founder Dashboard.
 *
 * WHAT MAKES THIS DIFFERENT FROM THE OPERATIONS DASHBOARD BESIDE IT
 * =================================================================
 * Operations answers "how is the business performing". This answers "what is stopping the
 * marketplace from being good today", which is a shorter and more actionable list. Every number here
 * is either a fact worth knowing on waking up, or a queue with somewhere to go and clear it — and
 * the ones that are queues say so and link.
 *
 * NO SPARKLINES, NO DELTAS, NO TRENDS
 * ===================================
 * There is no history to draw. The quality time series exists for the readiness engine and does not
 * cover approvals, covers or enquiries, so a "+12% this week" here would be an invented number in
 * the one place the Founder is most likely to trust one. When the series covers these, the arrows
 * can be added; until then the page says what is true now.
 *
 * THE SCORES ARE CHECKLISTS
 * =========================
 * Rendered as their conditions rather than as a percentage with the working hidden, because the
 * useful part is which condition is failing. A condition that cannot be checked from inside the
 * application is shown as such and counted as unmet — see the service.
 */

function MetricCard({ metric }: { readonly metric: DashboardMetric }) {
  const body = (
    <>
      <dt className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)]">
        {metric.label}
      </dt>
      <dd className="mt-2 flex items-baseline gap-3">
        <span
          className={cn(
            "text-[length:var(--text-h2)] font-semibold tabular-nums tracking-[-0.02em]",
            metric.actionable ? "text-[var(--color-warning)]" : "text-[var(--color-foreground)]",
          )}
        >
          {metric.value.toLocaleString("en-ZA").replace(/,/g, " ")}
        </span>
        {metric.note && (
          <span className="text-[length:var(--text-body-sm)] text-[var(--color-muted)]">{metric.note}</span>
        )}
      </dd>
    </>
  );

  const className = cn(
    "block rounded-[var(--radius-xl)] border p-5",
    metric.actionable
      ? "border-[var(--color-warning)]/40 bg-[var(--color-warning)]/[0.06]"
      : "border-[var(--color-border)] bg-[var(--color-surface)]",
  );

  if (!metric.href) return <div className={className}>{body}</div>;

  return (
    <Link
      href={metric.href}
      className={cn(
        className,
        "motion-card hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
      )}
    >
      {body}
    </Link>
  );
}

function ScorePanel({
  title,
  description,
  score,
}: {
  readonly title: string;
  readonly description: string;
  readonly score: DashboardScore;
}) {
  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="text-[length:var(--text-h4)] font-semibold text-[var(--color-foreground)]">
            {title}
          </h2>
          <p className="mt-1 max-w-md text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            {description}
          </p>
        </div>
        <p className="text-[length:var(--text-h2)] font-semibold tabular-nums tracking-[-0.02em] text-[var(--color-foreground)]">
          {score.met}
          <span className="text-[length:var(--text-h4)] text-[var(--color-muted)]"> / {score.total}</span>
        </p>
      </div>

      <ul className="mt-6 space-y-2">
        {score.conditions.map((condition) => (
          <li
            key={condition.label}
            className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-t border-[var(--color-border-subtle)] pt-3 first:border-0 first:pt-0"
          >
            <span className="flex items-start gap-3">
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 block size-2.5 shrink-0 rounded-full",
                  condition.met
                    ? "bg-[var(--color-success)]"
                    : condition.unverifiable
                      ? "bg-[var(--color-muted)]"
                      : "bg-[var(--color-warning)]",
                )}
              />
              <span>
                <span className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)]">
                  {condition.label}
                </span>
                <span className="mt-0.5 block text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {condition.detail}
                </span>
              </span>
            </span>

            {condition.href && !condition.met && (
              <Link
                href={condition.href}
                className="motion-button group inline-flex shrink-0 items-center gap-1.5 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)] underline underline-offset-4"
              >
                Fix
                <Icon
                  icon={ArrowRight}
                  aria-hidden
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const GROUPS: readonly { readonly title: string; readonly key: keyof Awaited<ReturnType<typeof loadFounderDashboard>> }[] = [
  { title: "Marketplace", key: "marketplace" },
  { title: "Photography", key: "photography" },
  { title: "Dealerships", key: "dealerships" },
  { title: "Enquiries", key: "enquiries" },
];

export async function FounderDashboardPage() {
  const dashboard = await loadFounderDashboard();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
          Founder dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
          What is stopping the marketplace from being good today. Amber is a queue with somewhere to
          go and clear it.
        </p>

        {/* Named rather than silently zeroed: a source that could not be read is not a count of nought. */}
        {dashboard.unavailable.length > 0 && (
          <p className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]">
            Could not read {dashboard.unavailable.join(", ")}. Those figures are missing rather than
            zero.
          </p>
        )}
      </header>

      {GROUPS.map((group) => {
        const metrics = dashboard[group.key] as readonly DashboardMetric[];
        return (
          <section key={group.title}>
            <h2 className="text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              {group.title}
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </dl>
          </section>
        );
      })}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ScorePanel
          title="Homepage health"
          description="How many of the six merchandising bands could be dressed with approved photography right now."
          score={dashboard.homepageHealth}
        />
        <ScorePanel
          title="Launch readiness"
          description="The launch blockers on record. What cannot be checked from here counts as outstanding."
          score={dashboard.launchReadiness}
        />
      </div>
    </div>
  );
}
