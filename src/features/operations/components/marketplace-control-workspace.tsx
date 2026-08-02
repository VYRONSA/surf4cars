"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MARKETPLACE_CONTROL_SECTIONS,
  type MarketplaceControlSectionId,
} from "@/features/operations/config/marketplace-control-sections";
import type {
  MarketplaceApprovalQueueItem,
  MarketplaceControlActionInput,
  MarketplaceControlWorkspaceData,
} from "@/features/operations/types/marketplace-control.types";

function relative(isoTimestamp: string): string {
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

function statusVariant(status: MarketplaceApprovalQueueItem["approvalStatus"]): "default" | "success" | "warning" | "danger" | "outline" | "info" {
  if (status === "approved") return "success";
  if (status === "pending" || status === "needs-review") return "warning";
  if (status === "rejected" || status === "returned-to-dealer") return "danger";
  if (status === "archived") return "outline";
  return "default";
}

function priorityVariant(priority: MarketplaceApprovalQueueItem["priority"]): "success" | "warning" | "danger" | "outline" {
  if (priority === "low") return "outline";
  if (priority === "medium") return "success";
  if (priority === "high") return "warning";
  return "danger";
}

interface MarketplaceControlWorkspaceProps {
  readonly data: MarketplaceControlWorkspaceData;
  readonly sectionId: MarketplaceControlSectionId;
}

export function MarketplaceControlWorkspace({ data, sectionId }: MarketplaceControlWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState(data.approvalQueue[0]?.vehicleId ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredQueue = useMemo(() => {
    return data.approvalQueue
      .filter((item) => {
        if (search.trim()) {
          const query = search.trim().toLowerCase();
          const haystack = [
            item.title,
            item.dealershipName,
            item.make,
            item.model,
            item.vin,
            item.registrationNumber,
          ].join(" ").toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        if (status && item.approvalStatus !== status) return false;
        if (priority && item.priority !== priority) return false;
        return true;
      })
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [data.approvalQueue, search, status, priority]);

  const selected = filteredQueue.find((item) => item.vehicleId === selectedVehicleId) ?? filteredQueue[0] ?? null;

  async function runAction(input: MarketplaceControlActionInput) {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/v1/operations/marketplace-control", {
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
      setLoading(false);
    }
  }

  function renderOverview() {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.summaryCards.map((card) => (
            <Card key={card.id} variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
              <CardHeader className="pb-2">
                <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
                  {card.label}
                </CardDescription>
                <CardTitle className="text-[length:var(--text-h3)]">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{card.detail}</p>
                {card.availability === "unavailable" ? <Badge className="mt-2" variant="outline">No data yet</Badge> : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
            <CardHeader>
              <CardTitle>Recent Marketplace Activity</CardTitle>
              <CardDescription>Live timeline events from inventory and marketplace control actions.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.timeline.length === 0 ? (
                <EmptyState title="No activity yet" description="Marketplace activity appears here as actions are logged." />
              ) : (
                <ul className="space-y-2">
                  {data.timeline.slice(0, 10).map((event) => (
                    <li key={event.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                      <p className="text-[length:var(--text-body-sm)] font-medium">{event.eventName}</p>
                      <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{event.source} · {relative(event.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Marketplace health, duplicate, and moderation notices.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.alerts.map((alert) => (
                  <li key={alert.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                    <p className="text-[length:var(--text-body-sm)] font-medium">{alert.title}</p>
                    <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{alert.detail}</p>
                    {alert.availability === "unavailable" ? <Badge className="mt-2" variant="outline">No data yet</Badge> : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function renderVehicleApprovals() {
    return (
      <div className="space-y-4">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Approval Queue Filters</CardTitle>
            <CardDescription>Search, filter, and triage the unified listing approval queue.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Input placeholder="Search listings" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs-review">Needs Review</option>
                <option value="returned-to-dealer">Returned to Dealer</option>
                <option value="archived">Archived</option>
              </Select>
              <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
            <CardHeader>
              <CardTitle>Vehicle Approvals Queue</CardTitle>
              <CardDescription>Pending, approved, rejected, needs review, returned, and archived listing statuses.</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredQueue.length === 0 ? (
                <EmptyState title="No queue items" description="No listings match the current filter state." />
              ) : (
                <Table>
                  <TableHeader sticky>
                    <TableRow>
                      <TableHead>Listing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Timeline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueue.map((item) => (
                      <TableRow key={item.id} selected={selected?.vehicleId === item.vehicleId} onClick={() => setSelectedVehicleId(item.vehicleId)} className="cursor-pointer">
                        <TableCell>{item.title}</TableCell>
                        <TableCell><Badge variant={statusVariant(item.approvalStatus)}>{item.approvalStatus}</Badge></TableCell>
                        <TableCell><Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge></TableCell>
                        <TableCell>{item.qualityScore}</TableCell>
                        <TableCell>{item.dealershipName}</TableCell>
                        <TableCell>{relative(item.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
            <CardHeader>
              <CardTitle>Approval Detail</CardTitle>
              <CardDescription>Assignment, status, and timeline controls.</CardDescription>
            </CardHeader>
            <CardContent>
              {!selected ? (
                <EmptyState title="Select a listing" description="Choose an approval queue row to inspect and action." />
              ) : (
                <div className="space-y-3">
                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3 text-[length:var(--text-caption)]">
                    <p className="text-[length:var(--text-body-sm)] font-medium">{selected.title}</p>
                    <p className="mt-1">{selected.dealershipName}</p>
                    <p className="mt-1">VIN: {selected.vin}</p>
                    <p className="mt-1">Registration: {selected.registrationNumber}</p>
                    <p className="mt-1">Lifecycle: {selected.lifecycleStatus}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={statusVariant(selected.approvalStatus)}>{selected.approvalStatus}</Badge>
                      <Badge variant={priorityVariant(selected.priority)}>{selected.priority}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" disabled={loading} onClick={() => runAction({ vehicleId: selected.vehicleId, action: "assign", assignedToUserId: "operations-user", assignedToName: "Operations User" })}>Assign</Button>
                    <Button size="sm" variant="success" disabled={loading} onClick={() => runAction({ vehicleId: selected.vehicleId, action: "approve" })}>Approve</Button>
                    <Button size="sm" variant="danger" disabled={loading} onClick={() => runAction({ vehicleId: selected.vehicleId, action: "reject" })}>Reject</Button>
                    <Button size="sm" variant="outline" disabled={loading} onClick={() => runAction({ vehicleId: selected.vehicleId, action: "needs-review" })}>Needs Review</Button>
                    <Button size="sm" variant="outline" disabled={loading} onClick={() => runAction({ vehicleId: selected.vehicleId, action: "return-to-dealer" })}>Return to Dealer</Button>
                    <Button size="sm" variant="outline" disabled={loading} onClick={() => runAction({ vehicleId: selected.vehicleId, action: "archive" })}>Archive</Button>
                    <Button size="sm" variant="outline" disabled={loading} onClick={() => runAction({ vehicleId: selected.vehicleId, action: "export" })}>Export</Button>
                  </div>
                </div>
              )}

              {error ? <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-danger)]">{error}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function simpleTable(title: string, description: string, head: readonly string[], rows: readonly React.ReactNode[], empty: string) {
    return (
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState title={empty} description="No data yet where live integrations are not available." />
          ) : (
            <Table>
              <TableHeader sticky>
                <TableRow>
                  {head.map((label) => <TableHead key={label}>{label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>{rows}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderSectionContent() {
    if (sectionId === "overview") return renderOverview();
    if (sectionId === "vehicle-approvals") return renderVehicleApprovals();

    if (sectionId === "marketplace-health") {
      return simpleTable(
        "Marketplace Health",
        "Executive dashboard for lifecycle distribution and health posture.",
        ["Published", "Drafts", "Reserved", "Sold", "Archived", "Average Quality", "Requires Attention", "Dealer Health", "Alerts"],
        [
          <TableRow key="health">
            <TableCell>{data.health.published}</TableCell>
            <TableCell>{data.health.drafts}</TableCell>
            <TableCell>{data.health.reserved}</TableCell>
            <TableCell>{data.health.sold}</TableCell>
            <TableCell>{data.health.archived}</TableCell>
            <TableCell>{data.health.averageListingQuality ?? "No data yet"}</TableCell>
            <TableCell>{data.health.listingsRequiringAttention}</TableCell>
            <TableCell>{data.health.dealerHealth}</TableCell>
            <TableCell>{data.health.marketplaceAlerts}</TableCell>
          </TableRow>,
        ],
        "No health rows",
      );
    }

    if (sectionId === "listing-quality") {
      return simpleTable(
        "Listing Quality",
        "Quality score, missing photos/info, description quality, pricing warnings, and AI recommendations.",
        ["Listing", "Score", "Missing Photos", "Missing Info", "Low Description", "Pricing Warning", "Recommendations"],
        data.listingQuality.map((row) => (
          <TableRow key={row.vehicleId}>
            <TableCell>{row.title}</TableCell>
            <TableCell>{row.qualityScore}</TableCell>
            <TableCell>{row.missingPhotos ? "Yes" : "No"}</TableCell>
            <TableCell>{row.missingInformation ? "Yes" : "No"}</TableCell>
            <TableCell>{row.lowQualityDescription ? "Yes" : "No"}</TableCell>
            <TableCell>{row.pricingWarning ? "Yes" : "No"}</TableCell>
            <TableCell>{row.aiRecommendations.slice(0, 2).join(" ") || "None"}</TableCell>
          </TableRow>
        )),
        "No listing quality rows",
      );
    }

    if (sectionId === "duplicate-listings") {
      return simpleTable(
        "Duplicate Listings",
        "VIN, registration, dealer fingerprint, and future AI duplicate detection framework.",
        ["Type", "Key", "Listings", "Dealers", "Availability"],
        data.duplicateGroups.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.type}</TableCell>
            <TableCell>{row.key}</TableCell>
            <TableCell>{row.vehicleIds.length}</TableCell>
            <TableCell>{row.dealershipIds.length}</TableCell>
            <TableCell>{row.availability === "unavailable" ? <Badge variant="outline">No data yet</Badge> : <Badge variant="success">Live</Badge>}</TableCell>
          </TableRow>
        )),
        "No duplicate groups",
      );
    }

    if (sectionId === "fraud-review") {
      return simpleTable(
        "Fraud Review",
        "Framework for flagged dealer/listing/suspicious activity/manual review statuses.",
        ["Category", "Status", "Detail", "Created"],
        data.fraudReview.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.category}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.detail}</TableCell>
            <TableCell>{relative(row.createdAt)}</TableCell>
          </TableRow>
        )),
        "Fraud review data is No data yet",
      );
    }

    if (sectionId === "ai-moderation") {
      return simpleTable(
        "AI Moderation",
        "Reused intelligence architecture for content/description/pricing/listing moderation state.",
        ["Listing", "Content", "Description", "Pricing", "Quality", "Moderation"],
        data.aiModeration.map((row) => (
          <TableRow key={row.vehicleId}>
            <TableCell>{row.title}</TableCell>
            <TableCell>{row.contentReview}</TableCell>
            <TableCell>{row.descriptionReview}</TableCell>
            <TableCell>{row.pricingReview}</TableCell>
            <TableCell>{row.listingQualityScore}</TableCell>
            <TableCell>{row.moderationStatus}</TableCell>
          </TableRow>
        )),
        "No AI moderation rows",
      );
    }

    if (sectionId === "image-review") {
      return simpleTable(
        "Image Review",
        "Vehicle media coverage and image quality framework.",
        ["Listing", "Image Count", "Primary", "Quality", "Duplicate Images", "Missing", "Future Moderation"],
        data.imageReview.map((row) => (
          <TableRow key={row.vehicleId}>
            <TableCell>{row.title}</TableCell>
            <TableCell>{row.imageCount}</TableCell>
            <TableCell>{row.hasPrimaryImage ? "Yes" : "No"}</TableCell>
            <TableCell>{row.quality}</TableCell>
            <TableCell>{row.duplicateImages}</TableCell>
            <TableCell>{row.missingImages ? "Yes" : "No"}</TableCell>
            <TableCell><Badge variant="outline">No data yet</Badge></TableCell>
          </TableRow>
        )),
        "No image review rows",
      );
    }

    if (sectionId === "dealer-quality") {
      return simpleTable(
        "Dealer Quality",
        "Reuse dealer management and dealer intelligence quality/compliance indicators.",
        ["Dealer", "Score", "Compliance", "Outstanding", "Warnings", "Recommendations"],
        data.dealerQuality.map((row) => (
          <TableRow key={row.dealershipId}>
            <TableCell>{row.dealershipName}</TableCell>
            <TableCell>{row.dealerQualityScore ?? "No data yet"}</TableCell>
            <TableCell>{row.listingCompliance}</TableCell>
            <TableCell>{row.outstandingIssues.join(", ") || "None"}</TableCell>
            <TableCell>{row.warnings.join(", ") || "None"}</TableCell>
            <TableCell>{row.recommendations.join(", ")}</TableCell>
          </TableRow>
        )),
        "No dealer quality rows",
      );
    }

    if (sectionId === "marketplace-alerts") {
      return simpleTable(
        "Marketplace Alerts",
        "Live marketplace alerts and pending extension points.",
        ["Severity", "Title", "Detail", "Availability"],
        data.alerts.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.severity}</TableCell>
            <TableCell>{row.title}</TableCell>
            <TableCell>{row.detail}</TableCell>
            <TableCell>{row.availability === "unavailable" ? <Badge variant="outline">No data yet</Badge> : <Badge variant="success">Live</Badge>}</TableCell>
          </TableRow>
        )),
        "No alerts",
      );
    }

    if (sectionId === "timeline") {
      return simpleTable(
        "Timeline",
        "Approvals, rejections, flags, assignments, returns, and warnings event stream.",
        ["Event", "Source", "Actor", "Detail", "When"],
        data.timeline.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.eventName}</TableCell>
            <TableCell>{row.source}</TableCell>
            <TableCell>{row.actorType}</TableCell>
            <TableCell>{row.detail}</TableCell>
            <TableCell>{relative(row.createdAt)}</TableCell>
          </TableRow>
        )),
        "No timeline events",
      );
    }

    return simpleTable(
      "Audit",
      "Every marketplace control action is logged through existing operations audit pipeline.",
      ["Action", "Source", "Actor", "When"],
      data.audit.map((row) => (
        <TableRow key={row.id}>
          <TableCell>{row.action}</TableCell>
          <TableCell>{row.source}</TableCell>
          <TableCell>{row.actorType}</TableCell>
          <TableCell>{relative(row.createdAt)}</TableCell>
        </TableRow>
      )),
      "No audit events",
    );
  }

  return (
    <section className="space-y-5 py-1">
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[radial-gradient(circle_at_top_right,rgba(0,112,255,0.12),transparent_44%),linear-gradient(165deg,var(--color-surface-raised),var(--color-background))] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(0,112,255,0.16),rgba(0,112,255,0))]" />
        <p className="relative text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          SURF Operations Centre
        </p>
        <h1 className="relative mt-2 text-balance text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h1)]">
          Marketplace Control Centre
        </h1>
        <p className="relative mt-3 max-w-3xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          Operational command centre for marketplace quality, trust, safety, and marketplace health using existing platform services.
        </p>
        <p className="relative mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          Last refreshed {relative(data.generatedAt)}
        </p>
      </div>

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Marketplace Control Modules</CardTitle>
          <CardDescription>Operational sections for approvals, health, quality, duplicates, and audit.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {MARKETPLACE_CONTROL_SECTIONS.map((item) => {
              const active = item.id === sectionId;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={active
                    ? "rounded-[var(--radius-lg)] border border-[var(--color-primary)] bg-[var(--color-primary-muted)] px-3 py-2"
                    : "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2 hover:border-[var(--color-border)]"
                  }
                >
                  <p className="text-[length:var(--text-body-sm)] font-medium">{item.label}</p>
                  <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {renderSectionContent()}

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Source Readiness</CardTitle>
          <CardDescription>Live and future source integrations for Marketplace Control.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {data.sourceReadiness.map((source) => (
              <article key={source.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[length:var(--text-body-sm)] font-medium">{source.label}</p>
                  <Badge variant={source.mode === "live" ? "success" : source.mode === "manual" ? "warning" : "outline"}>{source.mode}</Badge>
                </div>
                <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{source.detail}</p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
