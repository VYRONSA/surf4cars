"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/feedback";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BUSINESS_INTELLIGENCE_SECTIONS,
  type BusinessIntelligenceSectionId,
} from "@/features/operations/config/business-intelligence-sections";
import type {
  BusinessIntelligenceActionInput,
  BusinessIntelligenceWorkspaceData,
} from "@/features/operations/types/business-intelligence.types";

interface BusinessIntelligenceWorkspaceProps {
  readonly data: BusinessIntelligenceWorkspaceData;
  readonly sectionId: BusinessIntelligenceSectionId;
  readonly generatedLabel: string;
}

function rel(isoTimestamp: string): string {
  const value = Date.parse(isoTimestamp);
  if (!Number.isFinite(value)) return "Unknown";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - value) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function availabilityVariant(mode: "live" | "coming-soon"): "success" | "outline" {
  return mode === "live" ? "success" : "outline";
}

function reportVariant(mode: "ready" | "coming-soon"): "success" | "outline" {
  return mode === "ready" ? "success" : "outline";
}

export function BusinessIntelligenceWorkspace({ data, sectionId, generatedLabel }: BusinessIntelligenceWorkspaceProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSection = useMemo(
    () => BUSINESS_INTELLIGENCE_SECTIONS.find((item) => item.id === sectionId) ?? {
      id: "overview",
      label: "Overview",
      href: "/operations/business-intelligence",
      description: "Executive health and growth posture across the SURF platform.",
    },
    [sectionId],
  );

  async function runAction(input: BusinessIntelligenceActionInput) {
    setError(null);
    setIsBusy(true);

    try {
      const response = await fetch("/api/v1/operations/business-intelligence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Action failed.");
      }

      window.location.reload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="space-y-5 py-1">
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[radial-gradient(circle_at_top_right,rgba(0,112,255,0.14),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(0,194,255,0.12),transparent_40%),linear-gradient(150deg,var(--color-surface-raised),var(--color-background))] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,112,255,0.18),rgba(0,112,255,0))]" />
        <p className="relative text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          SURF Operations Centre
        </p>
        <h1 className="relative mt-2 text-balance text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h1)]">
          Executive Dashboard
        </h1>
        <p className="relative mt-3 max-w-3xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          Business Intelligence Centre for executive health, growth, performance, and strategic direction across SURF FOR CARS.
        </p>
        <div className="relative mt-4 flex flex-wrap items-center gap-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          <span>Updated {generatedLabel}</span>
          <span>•</span>
          <span>{selectedSection.label}</span>
          <span>•</span>
          <span>{selectedSection.description}</span>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={isBusy} onClick={() => runAction({ action: "export-report", referenceId: "executive-health-pack" })}>
            Export Executive Report
          </Button>
          <Button size="sm" variant="secondary" disabled={isBusy} onClick={() => runAction({ action: "refresh-snapshot", referenceId: sectionId })}>
            Refresh Snapshot
          </Button>
        </div>
        {error ? <p className="relative mt-2 text-[length:var(--text-body-sm)] text-[var(--color-destructive)]">{error}</p> : null}
      </div>

      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
        {BUSINESS_INTELLIGENCE_SECTIONS.map((section) => {
          const active = section.id === sectionId;
          return (
            <Link
              key={section.id}
              href={section.href}
              className={`rounded-[var(--radius-xl)] border px-3 py-3 transition ${
                active
                  ? "border-[var(--color-primary)]/45 bg-[var(--color-primary)]/12 text-[var(--color-foreground)]"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface)]/55 text-[var(--color-muted-foreground)] hover:border-[var(--color-border)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">{section.label}</p>
              <p className="mt-1 text-[length:var(--text-caption)] opacity-80">{section.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.executiveKpis.map((kpi) => (
          <Card key={kpi.id} variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
                {kpi.label}
              </CardDescription>
              <CardTitle className="text-[length:var(--text-h3)]">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{kpi.detail}</p>
              <Badge className="mt-2" variant={availabilityVariant(kpi.availability)}>
                {kpi.availability === "live" ? "Live" : "Coming Soon"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Growth</CardTitle>
            <CardDescription>Daily, weekly, monthly, quarterly, and annual growth trends across executive domains.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Daily</TableHead>
                  <TableHead>Weekly</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Quarterly</TableHead>
                  <TableHead>Annual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.growthTrends.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        <p>{row.metric}</p>
                        <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{row.detail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{row.daily}</TableCell>
                    <TableCell>{row.weekly}</TableCell>
                    <TableCell>{row.monthly}</TableCell>
                    <TableCell>{row.quarterly}</TableCell>
                    <TableCell>{row.annual}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>AI Intelligence</CardTitle>
            <CardDescription>Reused AI and intelligence posture from existing intelligence modules.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.aiInsights.map((row) => (
                <div key={row.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[length:var(--text-body-sm)] font-medium">{row.label}</p>
                    <Badge variant={availabilityVariant(row.availability)}>{row.availability === "live" ? "Live" : "Coming Soon"}</Badge>
                  </div>
                  <p className="mt-1 text-[length:var(--text-body-md)] font-semibold">{row.value}</p>
                  <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{row.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Commercial performance reused from the Revenue Centre intelligence layer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Growth</TableHead>
                  <TableHead>Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.moduleSnapshots.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.module}</TableCell>
                    <TableCell>{row.health}</TableCell>
                    <TableCell>{row.growthSignal}</TableCell>
                    <TableCell>{row.operationalSignal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Executive Reports</CardTitle>
            <CardDescription>Export-ready executive reporting views with reusable source lineage.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.reports.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        <p>{row.name}</p>
                        <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{row.detail}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={reportVariant(row.status)}>{row.status === "ready" ? "Ready" : "Coming Soon"}</Badge></TableCell>
                    <TableCell>{row.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)] xl:col-span-2">
          <CardHeader>
            <CardTitle>Executive Timeline</CardTitle>
            <CardDescription>Cross-centre intelligence timeline for leadership visibility.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.timeline.slice(0, 20).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        <p>{row.eventName}</p>
                        <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{row.detail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{row.actorType}</TableCell>
                    <TableCell>{rel(row.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Forecasts</CardTitle>
            <CardDescription>Framework-only extension points for predictive executive intelligence.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.forecasts.map((row) => (
                <div key={row.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[length:var(--text-body-sm)] font-medium">{row.label}</p>
                    <Badge variant="outline">{row.status === "framework" ? "Framework" : "Coming Soon"}</Badge>
                  </div>
                  <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{row.detail}</p>
                  <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{row.extensionPoint}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Audit</CardTitle>
            <CardDescription>Business Intelligence module actions recorded through the operations audit pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.audit.slice(0, 15).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{row.actorType}</TableCell>
                    <TableCell>{rel(row.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Source Readiness</CardTitle>
            <CardDescription>Live vs coming-soon signal coverage used by this executive intelligence layer.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.sourceReadiness.map((row) => (
                <div key={row.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[length:var(--text-body-sm)] font-medium">{row.label}</p>
                    <Badge variant="outline">{row.mode}</Badge>
                  </div>
                  <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{row.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}