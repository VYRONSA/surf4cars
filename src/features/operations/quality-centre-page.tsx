import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildQualityReport } from "@/services/quality";
import type { QualityAction, QualityFinding, QualitySeverity } from "@/services/quality";

/**
 * The Founder Quality Centre.
 *
 * Not an analytics dashboard. The page exists to answer one question — *what should I fix next to make
 * SURF4CARS more trustworthy?* — and everything on it is either that answer or the evidence for it.
 *
 * The ordering principle worth preserving: this page leads with work, not with numbers. A trust score at
 * the top of a page of charts invites the reader to feel informed and close the tab. A trust score beside a
 * list of named records with a correction against each one invites them to fix something. The score is
 * present because it makes progress legible over time, but it is deliberately not the largest thing here.
 *
 * Demonstration records are shown, never filtered. Hiding them is how a test fixture became the largest
 * dealership on the platform without anyone noticing.
 */

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SEVERITY_STYLE: Readonly<Record<QualitySeverity, string>> = {
  critical: "bg-[var(--color-danger-muted)] text-[var(--color-danger)]",
  high: "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
  medium: "bg-[var(--color-surface-overlay)] text-[var(--color-muted-foreground)]",
};

const SEVERITY_LABEL: Readonly<Record<QualitySeverity, string>> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
};

function FindingRow({ finding }: { readonly finding: QualityFinding }) {
  return (
    <li className="border-b border-[var(--color-border-subtle)] py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`inline-flex shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 text-[length:var(--text-caption)] font-medium ${SEVERITY_STYLE[finding.severity]}`}
        >
          {SEVERITY_LABEL[finding.severity]}
        </span>

        {finding.subject.href ? (
          <a
            href={finding.subject.href}
            className="text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)] underline decoration-[var(--color-border-strong)] underline-offset-4 hover:decoration-[var(--color-primary-text)]"
          >
            {finding.subject.name}
          </a>
        ) : (
          <span className="text-[length:var(--text-body-md)] font-medium">{finding.subject.name}</span>
        )}

        {finding.subject.isDemonstration && (
          <span className="rounded-[var(--radius-sm)] bg-[var(--color-secondary-muted)] px-1.5 py-0.5 text-[length:var(--text-caption)] text-[var(--color-secondary)]">
            Demonstration
          </span>
        )}
      </div>

      <p className="mt-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {finding.problem}
      </p>

      {/* The correction, not a request to "review". A finding nobody knows how to action is a statistic. */}
      <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]">
        <span className="text-[var(--color-muted)]">Fix — </span>
        {finding.remedy}
      </p>

      {finding.evidence && (
        <p className="mt-1 font-mono text-[length:var(--text-caption)] text-[var(--color-muted)]">
          {finding.evidence}
        </p>
      )}
    </li>
  );
}


/**
 * One decision, not one record.
 *
 * The count is the headline because that is the unit the Founder acts on — "126 dealerships cannot be
 * contacted" is a morning's work with a single cause, whereas the same information as 126 rows is a list
 * nobody reaches the bottom of. Examples are shown so the shape is visible without the full enumeration.
 */
function ActionRow({ action }: { readonly action: QualityAction }) {
  return (
    <li className="border-b border-[var(--color-border-subtle)] py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`inline-flex shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 text-[length:var(--text-caption)] font-medium ${SEVERITY_STYLE[action.severity]}`}
        >
          {SEVERITY_LABEL[action.severity]}
        </span>
        <span className="text-[length:var(--text-body-md)] font-medium">
          {action.affected} {action.affected === 1 ? "record" : "records"}
        </span>
      </div>

      <p className="mt-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {action.problem}
      </p>

      <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]">
        <span className="text-[var(--color-muted)]">Fix — </span>
        {action.remedy}
      </p>

      <p className="mt-1.5 text-[length:var(--text-caption)] text-[var(--color-muted)]">
        For example:{" "}
        {action.examples.map((subject, index) => (
          <span key={subject.id}>
            {index > 0 && ", "}
            {subject.href ? (
              <a
                href={subject.href}
                className="underline decoration-[var(--color-border-strong)] underline-offset-2 hover:text-[var(--color-primary-text)]"
              >
                {subject.name}
              </a>
            ) : (
              subject.name
            )}
          </span>
        ))}
        {action.affected > action.examples.length && ` and ${action.affected - action.examples.length} more`}
      </p>
    </li>
  );
}

export async function QualityCentrePage() {
  const report = await buildQualityReport();

  const criticalCount = report.findings.filter((f) => f.severity === "critical").length;
  const highCount = report.findings.filter((f) => f.severity === "high").length;

  return (
    <section className="space-y-6 py-1">
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[linear-gradient(165deg,var(--color-surface-raised),var(--color-background))] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          SURF Operations Centre
        </p>
        <h1 className="mt-2 text-balance text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h1)]">
          Quality Centre
        </h1>
        <p className="mt-3 max-w-3xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          Everything that can quietly reduce customer trust, found automatically and ordered by what to fix
          next. {report.dealersAudited} dealerships and {report.vehiclesAudited} vehicles audited.
        </p>
        <p className="mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          Last run {formatTimestamp(report.generatedAt)}
        </p>
      </div>

      {/*
        An unreadable source must never look like a clean marketplace. Zero findings and zero access are
        indistinguishable on a dashboard unless one of them says so.
      */}
      {report.incomplete && (
        <Card variant="glass" padding="md" className="border-[var(--color-warning)]">
          <CardContent className="text-[length:var(--text-body-sm)] text-[var(--color-warning)]">
            {report.incomplete} This is not a clean result — it is an unknown one.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/*
          Two scores, never averaged into one.

          Integrity is what engineering owns and what must never be softened; completeness is what
          onboarding owns and improves on its own as dealers arrive. A single blended number hides which of
          the two is the problem, and therefore who should be working on it.
        */}
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
              Platform integrity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[length:var(--text-h2)] font-semibold">{report.integrityScore}</p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Is the platform honest — provenance, labelling, accurate claims
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
              Marketplace completeness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[length:var(--text-h2)] font-semibold">{report.completenessScore}</p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Is it commercially ready — photography, contact, equipment
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
              Critical
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[length:var(--text-h2)] font-semibold text-[var(--color-danger)]">
              {criticalCount}
            </p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              A customer is actively misled or blocked
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
              High
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[length:var(--text-h2)] font-semibold text-[var(--color-warning)]">
              {highCount}
            </p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Reads as unfinished, or cannot be substantiated
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
              Demonstration records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[length:var(--text-h2)] font-semibold">{report.demonstrationDealers}</p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Excluded from the score, listed below
            </p>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Fix these next</CardTitle>
          <CardDescription>
            The highest-value work on the platform right now, ordered by customer harm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.nextActions.length === 0 ? (
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Nothing outstanding against the rules the platform currently checks. That is not the same as
              perfect data — it means every rule written so far passes.
            </p>
          ) : (
            <ul>
              {report.nextActions.map((action) => (
                <ActionRow key={action.rule} action={action} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {report.categories.length > 0 && (
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>By area</CardTitle>
            <CardDescription>Where the marketplace&rsquo;s trust debt actually sits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[length:var(--text-body-sm)]">
                <thead className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted)]">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">Area</th>
                    <th className="pb-2 pr-4 text-right font-medium">Critical</th>
                    <th className="pb-2 pr-4 text-right font-medium">High</th>
                    <th className="pb-2 pr-4 text-right font-medium">Medium</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.map((row) => (
                    <tr key={row.category} className="border-t border-[var(--color-border-subtle)]">
                      <td className="py-2 pr-4">{row.label}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-[var(--color-danger)]">
                        {row.critical || "—"}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-[var(--color-warning)]">
                        {row.high || "—"}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-[var(--color-muted-foreground)]">
                        {row.medium || "—"}
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {report.demonstrationFindings.length > 0 && (
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Demonstration records</CardTitle>
            <CardDescription>
              Excluded from the trust score because they do not describe the real marketplace — and listed
              here rather than filtered away, because a fixture nobody can see is how one became the largest
              dealership on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul>
              {report.demonstrationFindings.slice(0, 10).map((finding) => (
                <FindingRow key={finding.id} finding={finding} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
