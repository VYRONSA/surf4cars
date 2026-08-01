"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  PARTNER_CENTRE_SECTIONS,
  type PartnerCentreSectionId,
} from "@/features/operations/config/partner-centre-sections";
import type {
  PartnerCentreActionInput,
  PartnerCentreWorkspaceData,
  PartnerDirectoryRow,
  PartnerStatus,
} from "@/features/operations/types/partner-centre.types";

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

function statusVariant(status: PartnerStatus): "default" | "success" | "warning" | "danger" | "outline" | "info" {
  if (status === "active") return "success";
  if (status === "prospect" || status === "contacted" || status === "negotiating" || status === "onboarding") return "warning";
  if (status === "suspended" || status === "archived") return "danger";
  if (status === "inactive") return "outline";
  if (status === "paused") return "info";
  return "default";
}

interface PartnerCentreWorkspaceProps {
  readonly data: PartnerCentreWorkspaceData;
  readonly sectionId: PartnerCentreSectionId;
  readonly generatedLabel: string;
}

export function PartnerCentreWorkspace({ data, sectionId, generatedLabel }: PartnerCentreWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState(data.directory[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredDirectory = useMemo(() => {
    return data.directory
      .filter((partner) => {
        if (search.trim()) {
          const query = search.trim().toLowerCase();
          const haystack = [
            partner.name,
            partner.categoryLabel,
            partner.relationshipOwner,
            partner.status,
          ].join(" ").toLowerCase();

          if (!haystack.includes(query)) return false;
        }

        if (status && partner.status !== status) return false;
        if (category && partner.category !== category) return false;
        return true;
      })
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [data.directory, search, status, category]);

  const selected = useMemo(() => {
    return data.profiles.find((profile) => profile.id === selectedPartnerId)
      ?? data.profiles.find((profile) => profile.id === filteredDirectory[0]?.id)
      ?? null;
  }, [data.profiles, selectedPartnerId, filteredDirectory]);

  async function runAction(input: PartnerCentreActionInput) {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/v1/operations/partner-centre", {
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

  function renderSummaryCards() {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              {card.availability === "coming-soon" ? <Badge className="mt-2" variant="outline">Coming Soon</Badge> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  function renderDirectoryTable(items: readonly PartnerDirectoryRow[]) {
    if (items.length === 0) {
      return <EmptyState title="No partners match filters" description="Adjust search or filter criteria to view partner relationships." />;
    }

    return (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Partner</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Applications</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Integration</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((partner) => (
            <TableRow
              key={partner.id}
              selected={selected?.id === partner.id}
              onClick={() => setSelectedPartnerId(partner.id)}
              className="cursor-pointer"
            >
              <TableCell>{partner.name}</TableCell>
              <TableCell>{partner.categoryLabel}</TableCell>
              <TableCell><Badge variant={statusVariant(partner.status)}>{partner.status}</Badge></TableCell>
              <TableCell>{partner.relationshipOwner}</TableCell>
              <TableCell>{partner.applicationsReceived}</TableCell>
              <TableCell>{partner.revenueContribution}</TableCell>
              <TableCell>{partner.integrationStatus}</TableCell>
              <TableCell>{rel(partner.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  function renderFilters() {
    return (
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Partner Search and Filters</CardTitle>
          <CardDescription>Executive discovery for partner category, status, owner, and readiness.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Input placeholder="Search partners" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="prospect">Prospect</option>
              <option value="contacted">Contacted</option>
              <option value="negotiating">Negotiating</option>
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
            </Select>
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {data.directory.map((partner) => (
                <option key={partner.category} value={partner.category}>{partner.categoryLabel}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderProfileDetail() {
    if (!selected) {
      return <EmptyState title="Select a partner" description="Choose a partner relationship from the directory to inspect profile detail." />;
    }

    return (
      <div className="space-y-4">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>{selected.name}</CardTitle>
            <CardDescription>{selected.businessProfile}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-[length:var(--text-body-sm)]">
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                <p className="text-[var(--color-muted-foreground)]">Category</p>
                <p className="font-medium">{selected.categoryLabel}</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                <p className="text-[var(--color-muted-foreground)]">Status</p>
                <p className="font-medium"><Badge variant={statusVariant(selected.status)}>{selected.status}</Badge></p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                <p className="text-[var(--color-muted-foreground)]">Relationship Owner</p>
                <p className="font-medium">{selected.relationshipOwner}</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                <p className="text-[var(--color-muted-foreground)]">Health Score</p>
                <p className="font-medium">{selected.healthScore}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">Products</p>
                <ul className="mt-2 space-y-1 text-[length:var(--text-body-sm)]">
                  {selected.products.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">Services</p>
                <ul className="mt-2 space-y-1 text-[length:var(--text-body-sm)]">
                  {selected.services.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={loading} onClick={() => runAction({ action: "approve", partnerId: selected.id })}>Approve</Button>
              <Button size="sm" variant="secondary" disabled={loading} onClick={() => runAction({ action: "suspend", partnerId: selected.id })}>Suspend</Button>
              <Button size="sm" variant="secondary" disabled={loading} onClick={() => runAction({ action: "restore", partnerId: selected.id })}>Restore</Button>
              <Button size="sm" variant="secondary" disabled={loading} onClick={() => runAction({ action: "export", partnerId: selected.id })}>Export</Button>
            </div>

            {error ? <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-destructive)]">{error}</p> : null}
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Contacts and Territory</CardTitle>
            <CardDescription>Partner contacts and territory framework readiness.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">Contacts</p>
                <ul className="mt-2 space-y-2">
                  {selected.contacts.map((contact) => (
                    <li key={contact.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                      <p className="text-[length:var(--text-body-sm)] font-medium">{contact.name}</p>
                      <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{contact.role}</p>
                      <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{contact.email} · {contact.telephone}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                  <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">Coverage Areas</p>
                  <p className="mt-2 text-[length:var(--text-body-sm)]">{selected.coverageAreas.join(", ")}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                  <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">Territories</p>
                  <p className="mt-2 text-[length:var(--text-body-sm)]">{selected.territories.join(", ")}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                  <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">Internal Notes</p>
                  <p className="mt-2 text-[length:var(--text-body-sm)]">{selected.internalNotes}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderPerformance() {
    if (!selected) {
      return <EmptyState title="No partner selected" description="Select a partner to inspect operational performance metrics." />;
    }

    return (
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Partner Performance</CardTitle>
          <CardDescription>Applications, acceptance, response, revenue contribution, quality, and outstanding work.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selected.performance.map((metric) => (
                <TableRow key={metric.id}>
                  <TableCell>{metric.label}</TableCell>
                  <TableCell>{metric.value}</TableCell>
                  <TableCell>{metric.availability === "live" ? <Badge variant="success">Live</Badge> : <Badge variant="outline">Coming Soon</Badge>}</TableCell>
                  <TableCell>{metric.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  function renderLeadDistribution() {
    if (!selected) {
      return <EmptyState title="No partner selected" description="Select a partner to inspect lead distribution framework readiness." />;
    }

    return (
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Lead Distribution Framework</CardTitle>
          <CardDescription>Framework extension points only. No lead routing engine is implemented yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-[length:var(--text-body-sm)]">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3"><p className="text-[var(--color-muted-foreground)]">Lead Routing</p><p className="font-medium">{selected.leadDistribution.leadRouting}</p></div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3"><p className="text-[var(--color-muted-foreground)]">Allocation Rules</p><p className="font-medium">{selected.leadDistribution.allocationRules}</p></div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3"><p className="text-[var(--color-muted-foreground)]">Priority</p><p className="font-medium">{selected.leadDistribution.priorityModel}</p></div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3"><p className="text-[var(--color-muted-foreground)]">Capacity</p><p className="font-medium">{selected.leadDistribution.capacityModel}</p></div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3"><p className="text-[var(--color-muted-foreground)]">Availability</p><p className="font-medium">{selected.leadDistribution.availabilityModel}</p></div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3"><p className="text-[var(--color-muted-foreground)]">Performance</p><p className="font-medium">{selected.leadDistribution.performanceModel}</p></div>
          </div>

          <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">Extension Points</p>
            <ul className="mt-2 space-y-1 text-[length:var(--text-body-sm)]">
              {selected.leadDistribution.extensionPoints.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderIntegrations() {
    if (!selected) {
      return <EmptyState title="No partner selected" description="Select a partner to inspect integration readiness framework." />;
    }

    return (
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Integration Framework</CardTitle>
          <CardDescription>Framework only. No finance, insurance, warranty, inspection, or payment integrations are implemented in SOC-007.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell>API Status</TableCell><TableCell>{selected.integration.apiStatus}</TableCell></TableRow>
              <TableRow><TableCell>Webhook Readiness</TableCell><TableCell>{selected.integration.webhookReadiness}</TableCell></TableRow>
              <TableRow><TableCell>Integration Health</TableCell><TableCell>{selected.integration.integrationHealth}</TableCell></TableRow>
              <TableRow><TableCell>Last Sync</TableCell><TableCell>{selected.integration.lastSync}</TableCell></TableRow>
              <TableRow><TableCell>Version</TableCell><TableCell>{selected.integration.version}</TableCell></TableRow>
              <TableRow><TableCell>Authentication Method</TableCell><TableCell>{selected.integration.authenticationMethod}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  function renderTimeline() {
    return (
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Partner Timeline</CardTitle>
          <CardDescription>Created, updated, status, integration, performance, and operational partner events.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.timeline.length === 0 ? (
            <EmptyState title="No timeline events" description="Partner timeline entries will appear as operations events are logged." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.timeline.slice(0, 120).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.partnerName}</TableCell>
                    <TableCell>{event.message}</TableCell>
                    <TableCell>{event.eventType}</TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell>{rel(event.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderAudit() {
    return (
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Partner Audit</CardTitle>
          <CardDescription>Every partner action is logged through the existing operations audit pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.audit.length === 0 ? (
            <EmptyState title="No partner audit events" description="Audit entries will appear once partner actions are performed." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actor Type</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.audit.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.action}</TableCell>
                    <TableCell>{event.partnerId}</TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell>{event.actorType}</TableCell>
                    <TableCell>{rel(event.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderSourceReadiness() {
    return (
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Source Readiness</CardTitle>
          <CardDescription>Live sources reused from existing operations modules and framework placeholders for future integrations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.sourceReadiness.map((item) => (
              <div key={item.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[length:var(--text-body-sm)] font-medium">{item.label}</p>
                  <Badge variant={item.mode === "live" ? "success" : item.mode === "manual" ? "info" : "outline"}>{item.mode}</Badge>
                </div>
                <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Partner Centre</CardTitle>
          <CardDescription>
            Strategic relationship management layer for external business partners. Updated {generatedLabel}.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {PARTNER_CENTRE_SECTIONS.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className={`rounded-[var(--radius-lg)] border px-3 py-3 transition ${
              sectionId === section.id
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                : "border-[var(--color-border-subtle)] bg-[var(--color-surface)]/35 hover:border-[var(--color-border-strong)]"
            }`}
          >
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">{section.label}</p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{section.description}</p>
          </Link>
        ))}
      </div>

      {renderSummaryCards()}
      {renderFilters()}

      {(sectionId === "overview" || sectionId === "partner-directory") ? (
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Partner Directory</CardTitle>
            <CardDescription>External partner categories managed from one operational workspace.</CardDescription>
          </CardHeader>
          <CardContent>{renderDirectoryTable(filteredDirectory)}</CardContent>
        </Card>
      ) : null}

      {(sectionId === "overview" || sectionId === "partner-profile") ? renderProfileDetail() : null}
      {sectionId === "lead-distribution" ? renderLeadDistribution() : null}
      {(sectionId === "overview" || sectionId === "performance") ? renderPerformance() : null}
      {sectionId === "integrations" ? renderIntegrations() : null}
      {(sectionId === "overview" || sectionId === "timeline") ? renderTimeline() : null}
      {(sectionId === "overview" || sectionId === "audit") ? renderAudit() : null}
      {(sectionId === "overview" || sectionId === "integrations") ? renderSourceReadiness() : null}
    </div>
  );
}
