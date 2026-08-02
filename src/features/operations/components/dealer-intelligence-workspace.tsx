"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEALER_INTELLIGENCE_SECTIONS,
} from "@/features/operations/config/dealer-intelligence-sections";
import type {
  DealerIntelligencePageProps,
  DealerIntelligenceProfile,
  DealerIntelligenceQueueStatus,
  DealerIntelligenceSourceMode,
  DealerIntelligenceVerificationStatus,
  DealerIntelligenceWorkspaceData,
} from "@/features/operations/types/dealer-intelligence.types";
import { cn } from "@/utils";

function formatRelative(isoTimestamp: string): string {
  const parsed = Date.parse(isoTimestamp);
  if (!Number.isFinite(parsed)) return "Unknown";

  const minutes = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

interface DealerIntelligenceWorkspaceProps extends DealerIntelligencePageProps {
  readonly data: DealerIntelligenceWorkspaceData;
}

function toSourceVariant(mode: DealerIntelligenceSourceMode): "success" | "warning" | "outline" {
  if (mode === "live") return "success";
  if (mode === "manual") return "warning";
  return "outline";
}

function toQueueVariant(status: DealerIntelligenceQueueStatus): "default" | "success" | "warning" | "danger" | "info" | "outline" {
  if (status === "verified") return "success";
  if (status === "under-review") return "warning";
  if (status === "rejected") return "danger";
  if (status === "duplicate") return "info";
  if (status === "archived") return "outline";
  return "default";
}

function toVerificationVariant(status: DealerIntelligenceVerificationStatus): "success" | "warning" | "danger" | "info" {
  if (status === "verified") return "success";
  if (status === "needs-review" || status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "info";
}

function applyFilters(
  profiles: readonly DealerIntelligenceProfile[],
  filter: {
    readonly search: string;
    readonly province: string;
    readonly city: string;
    readonly brand: string;
    readonly verification: string;
    readonly status: string;
    readonly quality: string;
  },
): DealerIntelligenceProfile[] {
  const search = filter.search.trim().toLowerCase();

  return profiles.filter((profile) => {
    if (search.length > 0 && !profile.dealershipName.toLowerCase().includes(search)) {
      return false;
    }

    if (filter.province && profile.businessDetails.province !== filter.province) {
      return false;
    }

    if (filter.city && profile.businessDetails.city !== filter.city) {
      return false;
    }

    if (filter.brand && !profile.knownBrands.includes(filter.brand)) {
      return false;
    }

    if (filter.verification && profile.verificationStatus !== filter.verification) {
      return false;
    }

    if (filter.status && profile.queueStatus !== filter.status) {
      return false;
    }

    if (filter.quality === "high" && profile.dataQualityScore < 80) {
      return false;
    }

    if (filter.quality === "medium" && (profile.dataQualityScore < 60 || profile.dataQualityScore >= 80)) {
      return false;
    }

    if (filter.quality === "low" && profile.dataQualityScore >= 60) {
      return false;
    }

    return true;
  });
}

export function DealerIntelligenceWorkspace({ data, sectionId }: DealerIntelligenceWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [brand, setBrand] = useState("");
  const [verification, setVerification] = useState("");
  const [status, setStatus] = useState("");
  const [quality, setQuality] = useState("");

  const provinces = useMemo(() => [...new Set(data.profiles.map((item) => item.businessDetails.province).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [data.profiles]);
  const cities = useMemo(() => [...new Set(data.profiles.map((item) => item.businessDetails.city).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [data.profiles]);
  const brands = useMemo(() => [...new Set(data.profiles.flatMap((item) => item.knownBrands))].sort((a, b) => a.localeCompare(b)), [data.profiles]);

  const filteredProfiles = useMemo(() => applyFilters(data.profiles, {
    search,
    province,
    city,
    brand,
    verification,
    status,
    quality,
  }), [brand, city, data.profiles, province, quality, search, status, verification]);

  const filteredSet = useMemo(() => new Set(filteredProfiles.map((item) => item.dealershipId)), [filteredProfiles]);

  const queueRows = useMemo(() => data.queue.filter((item) => filteredSet.has(item.dealershipId)), [data.queue, filteredSet]);
  const branchRows = useMemo(() => data.branches.filter((item) => filteredSet.has(item.dealershipId)), [data.branches, filteredSet]);
  const brandRows = useMemo(() => data.brandDetections.filter((item) => filteredSet.has(item.dealershipId)), [data.brandDetections, filteredSet]);
  const contactRows = useMemo(() => data.contactDiscoveries.filter((item) => filteredSet.has(item.dealershipId)), [data.contactDiscoveries, filteredSet]);
  const websiteRows = useMemo(() => data.websiteAnalysis.filter((item) => filteredSet.has(item.dealershipId)), [data.websiteAnalysis, filteredSet]);
  const aiRows = useMemo(() => data.aiClassifications.filter((item) => filteredSet.has(item.dealershipId)), [data.aiClassifications, filteredSet]);
  const changeRows = useMemo(() => data.changeMonitoring.filter((item) => filteredSet.has(item.dealershipId)), [data.changeMonitoring, filteredSet]);
  const activityRows = useMemo(() => data.activity.filter((item) => filteredSet.has(item.dealershipId)), [data.activity, filteredSet]);
  const duplicateRows = useMemo(() => data.duplicateGroups.filter((group) => group.dealershipIds.some((id) => filteredSet.has(id))), [data.duplicateGroups, filteredSet]);

  const filteredAverageQuality = filteredProfiles.length === 0
    ? 0
    : Math.round(filteredProfiles.reduce((sum, item) => sum + item.dataQualityScore, 0) / filteredProfiles.length);

  let sectionBody: React.ReactNode;

  if (sectionId === "overview") {
    sectionBody = (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.overviewCards.map((card) => (
            <Card key={card.id} variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
              <CardHeader className="pb-2">
                <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
                  {card.label}
                </CardDescription>
                <CardTitle className="text-[length:var(--text-h3)]">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{card.detail}</p>
                <Badge className="mt-2" variant={toSourceVariant(card.availability)}>{card.availability.replace("-", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
            <CardHeader>
              <CardTitle>Discovery Source Readiness</CardTitle>
              <CardDescription>Each source explicitly states Live, Manual, or No data yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.sourceReadiness.map((source) => (
                  <div key={source.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[length:var(--text-body-sm)] font-medium">{source.label}</p>
                      <Badge variant={toSourceVariant(source.mode)}>{source.mode.replace("-", " ")}</Badge>
                    </div>
                    <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{source.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
            <CardHeader>
              <CardTitle>Filtered Snapshot</CardTitle>
              <CardDescription>Live search and filter context for current review set.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-[length:var(--text-body-sm)]">
                <li className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">Profiles in scope: {filteredProfiles.length}</li>
                <li className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">Average quality: {filteredAverageQuality}</li>
                <li className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">Queue pending: {queueRows.filter((item) => item.status === "new" || item.status === "under-review").length}</li>
                <li className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 px-3 py-2">Duplicate groups: {duplicateRows.length}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } else if (sectionId === "discovery-queue") {
    sectionBody = queueRows.length === 0 ? (
      <EmptyState title="No queue items" description="No dealerships match the current filters." />
    ) : (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Data Quality</TableHead>
            <TableHead>Operations Owner</TableHead>
            <TableHead>Last Reviewed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queueRows.map((row) => (
            <TableRow key={row.dealershipId}>
              <TableCell>{row.dealershipName}</TableCell>
              <TableCell>{row.city}, {row.province}</TableCell>
              <TableCell><Badge variant={toQueueVariant(row.status)}>{row.status}</Badge></TableCell>
              <TableCell><Badge variant={toVerificationVariant(row.verificationStatus)}>{row.verificationStatus}</Badge></TableCell>
              <TableCell>{row.dataQualityScore}</TableCell>
              <TableCell>{row.operationsOwner}</TableCell>
              <TableCell>{formatRelative(row.lastReviewed)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "dealership-directory") {
    sectionBody = filteredProfiles.length === 0 ? (
      <EmptyState title="No dealerships found" description="Adjust search and filters to find dealership records." />
    ) : (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealer Name</TableHead>
            <TableHead>Province</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Brands</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Quality</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProfiles.map((profile) => (
            <TableRow key={profile.dealershipId}>
              <TableCell>{profile.dealershipName}</TableCell>
              <TableCell>{profile.businessDetails.province}</TableCell>
              <TableCell>{profile.businessDetails.city}</TableCell>
              <TableCell>{profile.knownBrands.join(", ") || "None"}</TableCell>
              <TableCell><Badge variant={toVerificationVariant(profile.verificationStatus)}>{profile.verificationStatus}</Badge></TableCell>
              <TableCell><Badge variant={toQueueVariant(profile.queueStatus)}>{profile.queueStatus}</Badge></TableCell>
              <TableCell>{profile.dataQualityScore}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "dealer-profiles") {
    sectionBody = (
      <div className="grid gap-4 xl:grid-cols-2">
        {filteredProfiles.map((profile) => (
          <Card key={profile.dealershipId} variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
            <CardHeader>
              <CardTitle>{profile.dealershipName}</CardTitle>
              <CardDescription>
                {profile.businessDetails.city}, {profile.businessDetails.province}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-[length:var(--text-body-sm)]">
                <p>Website: {profile.knownWebsite ?? "Missing"}</p>
                <p>Brands: {profile.knownBrands.join(", ") || "None"}</p>
                <p>Branches: {profile.knownBranches.length}</p>
                <p>Contacts: {profile.knownContacts.length}</p>
                <p>Data quality: {profile.dataQualityScore}</p>
                <p>Operations owner: {profile.operationsOwner}</p>
                <p>Internal notes: {profile.internalNotes || "No notes"}</p>
                <div className="pt-1">
                  <p className="mb-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Timeline</p>
                  <ul className="space-y-1">
                    {profile.timeline.length === 0 ? <li className="text-[var(--color-muted-foreground)]">No timeline events</li> : profile.timeline.map((event) => (
                      <li key={event.id} className="text-[var(--color-muted-foreground)]">{event.title} · {formatRelative(event.timestamp)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  } else if (sectionId === "branch-discovery") {
    sectionBody = (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branchRows.map((item) => (
            <TableRow key={item.branchId}>
              <TableCell>{item.dealershipName}</TableCell>
              <TableCell>{item.branchName}</TableCell>
              <TableCell>{item.city}, {item.province}</TableCell>
              <TableCell><Badge variant={toSourceVariant(item.sourceMode)}>{item.sourceMode}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "brand-detection") {
    sectionBody = (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Known Brands</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brandRows.map((item) => (
            <TableRow key={item.dealershipId}>
              <TableCell>{item.dealershipName}</TableCell>
              <TableCell>{item.brands.join(", ") || "Missing"}</TableCell>
              <TableCell><Badge variant={toSourceVariant(item.sourceMode)}>{item.sourceMode}</Badge></TableCell>
              <TableCell className="text-[var(--color-muted-foreground)]">{item.detail}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "contact-discovery") {
    sectionBody = (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Contacts</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contactRows.map((item) => (
            <TableRow key={item.dealershipId}>
              <TableCell>{item.dealershipName}</TableCell>
              <TableCell>{item.contactCount}</TableCell>
              <TableCell>{item.hasEmail ? "Known" : "Missing"}</TableCell>
              <TableCell>{item.hasPhone ? "Known" : "Missing"}</TableCell>
              <TableCell><Badge variant={toSourceVariant(item.sourceMode)}>{item.sourceMode}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "website-analysis") {
    sectionBody = (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {websiteRows.map((item) => (
            <TableRow key={item.dealershipId}>
              <TableCell>{item.dealershipName}</TableCell>
              <TableCell>{item.website ?? "Missing"}</TableCell>
              <TableCell>{item.status}</TableCell>
              <TableCell><Badge variant={toSourceVariant(item.sourceMode)}>{item.sourceMode}</Badge></TableCell>
              <TableCell className="text-[var(--color-muted-foreground)]">{item.detail}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "ai-classification") {
    sectionBody = (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aiRows.map((item) => (
            <TableRow key={item.dealershipId}>
              <TableCell>{item.dealershipName}</TableCell>
              <TableCell>{item.classification}</TableCell>
              <TableCell>{item.confidenceLabel}</TableCell>
              <TableCell>{item.provider}</TableCell>
              <TableCell><Badge variant={toSourceVariant(item.providerMode)}>{item.providerMode}</Badge></TableCell>
              <TableCell className="text-[var(--color-muted-foreground)]">{item.detail}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "verification") {
    sectionBody = (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Queue Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Last Reviewed</TableHead>
            <TableHead>Quality</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProfiles.map((item) => (
            <TableRow key={item.dealershipId}>
              <TableCell>{item.dealershipName}</TableCell>
              <TableCell><Badge variant={toVerificationVariant(item.verificationStatus)}>{item.verificationStatus}</Badge></TableCell>
              <TableCell><Badge variant={toQueueVariant(item.queueStatus)}>{item.queueStatus}</Badge></TableCell>
              <TableCell>{item.operationsOwner}</TableCell>
              <TableCell>{formatRelative(item.lastReviewed)}</TableCell>
              <TableCell>{item.dataQualityScore}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "duplicate-detection") {
    sectionBody = duplicateRows.length === 0 ? (
      <EmptyState title="No duplicate groups" description="No duplicate registration-number groups are currently detected." />
    ) : (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Duplicate Key</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Dealerships</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {duplicateRows.map((group) => (
            <TableRow key={group.key}>
              <TableCell>{group.key}</TableCell>
              <TableCell>{group.reason}</TableCell>
              <TableCell>{group.dealershipNames.join(", ")}</TableCell>
              <TableCell><Badge variant="warning">{group.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "change-monitoring") {
    sectionBody = changeRows.length === 0 ? (
      <EmptyState title="No changes found" description="No change events match the current filter scope." />
    ) : (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changeRows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.dealershipName}</TableCell>
              <TableCell>{item.summary}</TableCell>
              <TableCell>{item.source}</TableCell>
              <TableCell>{item.changeType}</TableCell>
              <TableCell>{formatRelative(item.changedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (sectionId === "data-quality") {
    sectionBody = (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Missing Website</TableHead>
            <TableHead>Missing Contacts</TableHead>
            <TableHead>Missing Brands</TableHead>
            <TableHead>Missing Address</TableHead>
            <TableHead>Missing Branch</TableHead>
            <TableHead>Incomplete Profile</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProfiles.map((profile) => (
            <TableRow key={profile.dealershipId}>
              <TableCell>{profile.dealershipName}</TableCell>
              <TableCell>{profile.dataQualityScore}</TableCell>
              <TableCell>{profile.missingFields.includes("Missing website") ? "Yes" : "No"}</TableCell>
              <TableCell>{profile.missingFields.includes("Missing contacts") ? "Yes" : "No"}</TableCell>
              <TableCell>{profile.missingFields.includes("Missing brands") ? "Yes" : "No"}</TableCell>
              <TableCell>{profile.missingFields.includes("Missing address") ? "Yes" : "No"}</TableCell>
              <TableCell>{profile.missingFields.includes("Missing branch") ? "Yes" : "No"}</TableCell>
              <TableCell>{profile.missingFields.includes("Incomplete profile") ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else {
    sectionBody = activityRows.length === 0 ? (
      <EmptyState title="No activity" description="No activity events match the current dealership filter scope." />
    ) : (
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Dealership</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Actor Type</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activityRows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.dealershipName}</TableCell>
              <TableCell>{item.eventName}</TableCell>
              <TableCell>{item.source}</TableCell>
              <TableCell>{item.actorType}</TableCell>
              <TableCell>{formatRelative(item.eventAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
          Dealer Intelligence Engine
        </h1>
        <p className="relative mt-3 max-w-3xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          Internal knowledge engine for dealership discovery, verification, quality, and change tracking using only known platform information.
        </p>
        <p className="relative mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          Last refreshed {formatRelative(data.generatedAt)}
        </p>
      </div>

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Search and Filters</CardTitle>
          <CardDescription>
            Filter by dealer name, province, city, brand, verification, queue status, and quality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dealer name" />
            <Select value={province} onChange={(event) => setProvince(event.target.value)}>
              <option value="">All provinces</option>
              {provinces.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">All cities</option>
              {cities.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select value={brand} onChange={(event) => setBrand(event.target.value)}>
              <option value="">All brands</option>
              {brands.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select value={verification} onChange={(event) => setVerification(event.target.value)}>
              <option value="">All verification statuses</option>
              <option value="verified">Verified</option>
              <option value="needs-review">Needs Review</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="duplicate">Duplicate</option>
            </Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All queue statuses</option>
              <option value="new">New</option>
              <option value="under-review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="duplicate">Duplicate</option>
              <option value="archived">Archived</option>
            </Select>
            <Select value={quality} onChange={(event) => setQuality(event.target.value)}>
              <option value="">All quality bands</option>
              <option value="high">High (80+)</option>
              <option value="medium">Medium (60-79)</option>
              <option value="low">Low (&lt;60)</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Dealer Intelligence Modules</CardTitle>
          <CardDescription>Navigate all SOC-003 sections from one operations workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {DEALER_INTELLIGENCE_SECTIONS.map((item) => {
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

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardContent>{sectionBody}</CardContent>
      </Card>
    </section>
  );
}
