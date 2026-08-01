import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/feedback";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEALER_MANAGEMENT_SECTIONS,
  type DealerManagementSection,
} from "@/features/operations/config/dealer-management-sections";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import { getDealerManagementData } from "@/features/operations/server/dealer-management.service";
import type {
  DealerHealthRow,
  DealerManagementPageProps,
  DealerTimelineEvent,
} from "@/features/operations/types/dealer-management.types";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";
import { cn } from "@/utils";

function formatGeneratedAt(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(isoTimestamp: string): string {
  const value = Date.parse(isoTimestamp);
  if (!Number.isFinite(value)) return isoTimestamp;

  return new Date(value).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toHealthVariant(health: DealerHealthRow["risk"]): "success" | "warning" | "danger" {
  if (health === "low") return "success";
  if (health === "medium") return "warning";
  return "danger";
}

function statusVariant(
  status: string,
): "default" | "primary" | "success" | "warning" | "danger" | "info" | "outline" {
  if (status === "approved" || status === "completed" || status === "active") return "success";
  if (status === "pending" || status === "under-review") return "warning";
  if (status === "rejected" || status === "suspended") return "danger";
  if (status === "verification-required") return "info";
  if (status === "coming-soon") return "outline";
  return "default";
}

function renderOverview(data: Awaited<ReturnType<typeof getDealerManagementData>>) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.summaryCards.map((card) => (
          <Card
            key={card.id}
            variant="glass"
            padding="md"
            className="border-[var(--color-border-subtle)]"
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
                {card.label}
              </CardDescription>
              <CardTitle className="text-[length:var(--text-h3)]">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{card.detail}</p>
              {card.availability === "coming-soon" && <Badge variant="outline" className="mt-2">Coming Soon</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>
              Existing onboarding lifecycle state as the current source of truth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentApplications.length === 0 ? (
              <EmptyState title="No applications found" description="No dealership onboarding records are available yet." />
            ) : (
              <ul className="space-y-3">
                {data.recentApplications.map((item) => (
                  <li key={item.dealershipId} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[length:var(--text-body-sm)] font-medium">{item.dealershipName}</p>
                      <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Submitted {item.submittedAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Operational AI recommendations from available live data.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.aiRecommendations.map((item) => (
                <li key={item} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function sectionTable(
  section: DealerManagementSection,
  head: readonly string[],
  rows: readonly ReactNode[],
  emptyTitle: string,
  emptyDescription: string,
) {
  return (
    <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
      <CardHeader>
        <CardTitle>{section.label}</CardTitle>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <Table>
            <TableHeader sticky>
              <TableRow>
                {head.map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>{rows}</TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function renderTimelineList(events: readonly DealerTimelineEvent[]) {
  return (
    <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
      <CardHeader>
        <CardTitle>Dealer Timeline</CardTitle>
        <CardDescription>Unified event timeline from analytics and inventory audit pipelines.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState title="No timeline events yet" description="Events will appear once dealer operations activity is logged." />
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                <p className="text-[length:var(--text-body-sm)] font-medium">{event.title}</p>
                <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                  {event.source} · {formatDate(event.timestamp)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function renderComingSoon(section: DealerManagementSection, detail: string) {
  return (
    <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
      <CardHeader>
        <CardTitle>{section.label}</CardTitle>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title={`${section.label} is coming soon`} description={detail} />
      </CardContent>
    </Card>
  );
}

export async function DealerManagementPage({ sectionId }: DealerManagementPageProps) {
  const data = await getDealerManagementData();
  const store = await readPlatformStore();
  const section = DEALER_MANAGEMENT_SECTIONS.find((item) => item.id === sectionId)
    ?? DEALER_MANAGEMENT_SECTIONS.find((item) => item.id === "overview");
  if (!section) {
    throw new Error("Dealer management section configuration is missing.");
  }
  const primaryDealershipId = store.dealerships[0]?.id;

  if (primaryDealershipId) {
    await logOperationsAuditEvent(
      {
        dealershipId: primaryDealershipId,
        eventName: "operations.dealer-management.view",
        source: "operations-centre",
        payload: {
          sectionId,
          generatedAt: data.generatedAt,
        },
      },
    ).catch(() => undefined);
  }

  let sectionBody: ReactNode;

  if (sectionId === "overview") {
    sectionBody = renderOverview(data);
  } else if (sectionId === "applications") {
    sectionBody = sectionTable(
      section,
      ["Dealership", "Status", "Branches", "Submitted", "Notes"],
      data.applications.map((item) => (
        <TableRow key={item.dealershipId}>
          <TableCell>{item.dealershipName}</TableCell>
          <TableCell><Badge variant={statusVariant(item.status)}>{item.status}</Badge></TableCell>
          <TableCell>{item.branchCount}</TableCell>
          <TableCell>{formatDate(item.submittedAt)}</TableCell>
          <TableCell className="text-[var(--color-muted-foreground)]">{item.note}</TableCell>
        </TableRow>
      )),
      "No applications found",
      "No dealership onboarding submissions are currently available.",
    );
  } else if (sectionId === "dealerships") {
    sectionBody = sectionTable(
      section,
      ["Dealership", "Lifecycle", "City", "Subscription", "Branches", "Users", "Health"],
      data.dealerships.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.tradingName}</TableCell>
          <TableCell><Badge variant={statusVariant(item.lifecycle)}>{item.lifecycle}</Badge></TableCell>
          <TableCell>{item.city}, {item.province}</TableCell>
          <TableCell>{item.subscription}</TableCell>
          <TableCell>{item.branchCount}</TableCell>
          <TableCell>{item.userCount}</TableCell>
          <TableCell>{item.healthScore ?? "Coming Soon"}</TableCell>
        </TableRow>
      )),
      "No dealerships found",
      "No dealership records are available in the platform store.",
    );
  } else if (sectionId === "branches") {
    sectionBody = sectionTable(
      section,
      ["Branch", "Dealership", "Location", "Manager", "Users", "Inventory"],
      data.branches.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell>{item.dealershipName}</TableCell>
          <TableCell>{item.city}, {item.province}</TableCell>
          <TableCell>{item.manager}</TableCell>
          <TableCell>{item.userCount}</TableCell>
          <TableCell>{item.inventoryCount}</TableCell>
        </TableRow>
      )),
      "No branches found",
      "No branch records are available yet.",
    );
  } else if (sectionId === "dealer-users") {
    sectionBody = sectionTable(
      section,
      ["User", "Email", "Dealership", "Role", "Status", "Invited"],
      data.users.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.fullName}</TableCell>
          <TableCell>{item.email}</TableCell>
          <TableCell>{item.dealershipName}</TableCell>
          <TableCell>{item.roleId}</TableCell>
          <TableCell><Badge variant={statusVariant(item.status)}>{item.status}</Badge></TableCell>
          <TableCell>{formatDate(item.invitedAt)}</TableCell>
        </TableRow>
      )),
      "No dealer users found",
      "No dealer team members are registered in the platform store.",
    );
  } else if (sectionId === "subscriptions") {
    sectionBody = sectionTable(
      section,
      ["Dealership", "Subscription", "Lifecycle", "Status"],
      data.dealerships.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.tradingName}</TableCell>
          <TableCell>{item.subscription}</TableCell>
          <TableCell>{item.lifecycle}</TableCell>
          <TableCell>
            {item.subscription === "Coming Soon"
              ? <Badge variant="outline">Coming Soon</Badge>
              : <Badge variant="success">Assigned</Badge>}
          </TableCell>
        </TableRow>
      )),
      "No subscription data",
      "Subscription assignments will appear once package assignment is complete.",
    );
  } else if (sectionId === "billing") {
    sectionBody = renderComingSoon(
      section,
      "Billing lifecycle and transaction-level telemetry will be connected when Revenue Centre billing integrations are promoted into SOC dealer management.",
    );
  } else if (sectionId === "performance") {
    sectionBody = sectionTable(
      section,
      ["Dealership", "Vehicles", "Published", "Sold", "Leads", "Conversion", "AI Score"],
      data.performance.map((item) => (
        <TableRow key={item.dealershipId}>
          <TableCell>{item.dealershipName}</TableCell>
          <TableCell>{item.vehicles}</TableCell>
          <TableCell>{item.published}</TableCell>
          <TableCell>{item.sold}</TableCell>
          <TableCell>{item.leads}</TableCell>
          <TableCell>{item.conversion}</TableCell>
          <TableCell>{item.aiScore}</TableCell>
        </TableRow>
      )),
      "No performance data",
      "Performance data is unavailable in current data sources.",
    );
  } else if (sectionId === "health") {
    sectionBody = sectionTable(
      section,
      ["Dealership", "Health", "Risk", "Missing Information", "Outstanding Tasks"],
      data.health.map((item) => (
        <TableRow key={item.dealershipId}>
          <TableCell>{item.dealershipName}</TableCell>
          <TableCell>{item.healthScore}</TableCell>
          <TableCell><Badge variant={toHealthVariant(item.risk)}>{item.risk}</Badge></TableCell>
          <TableCell className="text-[var(--color-muted-foreground)]">{item.missingInformation.join(", ") || "None"}</TableCell>
          <TableCell className="text-[var(--color-muted-foreground)]">{item.outstandingTasks.join(", ") || "None"}</TableCell>
        </TableRow>
      )),
      "No health rows",
      "Health signals will appear once dealer records are available.",
    );
  } else if (sectionId === "notes") {
    sectionBody = renderComingSoon(
      section,
      "Operations notes workspace will be enabled once shared note entities are promoted for operations-only use.",
    );
  } else if (sectionId === "timeline") {
    sectionBody = renderTimelineList(data.timeline);
  } else if (sectionId === "documents") {
    sectionBody = renderComingSoon(
      section,
      "Dealer KYC, compliance, and operational documents will be available after document service integration.",
    );
  } else if (sectionId === "contracts") {
    sectionBody = renderComingSoon(
      section,
      "Contract management is pending integration with legal agreement lifecycle systems.",
    );
  } else {
    sectionBody = renderTimelineList(data.timeline);
  }

  return (
    <section className="space-y-5 py-1">
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[radial-gradient(circle_at_top_right,rgba(0,112,255,0.12),transparent_44%),linear-gradient(165deg,var(--color-surface-raised),var(--color-background))] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(0,112,255,0.16),rgba(0,112,255,0))]" />
        <p className="relative text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          SURF Operations Centre
        </p>
        <h1 className="relative mt-2 text-balance text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h1)]">
          Dealer Management Centre
        </h1>
        <p className="relative mt-3 max-w-3xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          Unified operating workspace for dealership applications, account lifecycle governance, branch and user controls, performance monitoring, and compliance readiness.
        </p>
        <p className="relative mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          Last refreshed {formatGeneratedAt(data.generatedAt)}
        </p>
      </div>

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Dealer Management Modules</CardTitle>
          <CardDescription>Navigate all SOC-002 sections without leaving the operations shell.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {DEALER_MANAGEMENT_SECTIONS.map((item) => {
              const active = item.id === sectionId;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "rounded-[var(--radius-lg)] border px-3 py-2 text-left motion-card",
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 hover:border-[var(--color-border)]",
                  )}
                >
                  <p className="text-[length:var(--text-body-sm)] font-medium">{item.label}</p>
                  <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {sectionBody}
    </section>
  );
}
