"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/form";
import type { VehicleWorkspacePayload } from "@/features/inventory/types/inventory-intelligence.types";
import {
  createVehicleDocument,
  createVehicleMedia,
  patchVehicleLifecycleStatus,
  reorderVehicleMediaItems,
  setPrimaryVehicleMediaItem,
} from "@/features/inventory/services/inventory-intelligence.api";
import { formatCurrencyCents, formatShortDate } from "@/features/inventory/utils/inventory-formatting";

type WorkspaceTab =
  | "overview"
  | "specifications"
  | "photos"
  | "documents"
  | "pricing"
  | "ai-insights"
  | "publishing"
  | "performance"
  | "history"
  | "audit-trail";

const TABS: readonly WorkspaceTab[] = [
  "overview",
  "specifications",
  "photos",
  "documents",
  "pricing",
  "ai-insights",
  "publishing",
  "performance",
  "history",
  "audit-trail",
] as const;

interface InventoryWorkspaceProps {
  readonly dealershipId: string;
  readonly workspace: VehicleWorkspacePayload;
  readonly onRefresh: () => Promise<void>;
}

export function InventoryIntelligenceWorkspace({
  dealershipId,
  workspace,
  onRefresh,
}: InventoryWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lifecycleOptions = useMemo(
    () => [
      { id: "draft", label: "Draft" },
      { id: "ai-review", label: "AI Review" },
      { id: "ready-to-publish", label: "Ready to Publish" },
      { id: "published", label: "Published" },
      { id: "reserved", label: "Reserved" },
      { id: "performance-monitoring", label: "Performance Monitoring" },
      { id: "sold", label: "Sold" },
      { id: "archived", label: "Archived" },
      { id: "deleted", label: "Deleted (Soft)" },
    ] as const,
    [],
  );

  async function run(action: () => Promise<void>) {
    setError(null);
    setIsBusy(true);
    try {
      await action();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function addMedia(formData: FormData) {
    const fileName = String(formData.get("fileName") ?? "").trim();
    const fileUrl = String(formData.get("fileUrl") ?? "").trim();
    const qualityStatus = String(formData.get("qualityStatus") ?? "review") as "good" | "review" | "poor";

    await run(async () => {
      await createVehicleMedia(dealershipId, workspace.vehicle.id, {
        fileName,
        fileUrl,
        qualityStatus,
      });
    });
  }

  async function addDocument(formData: FormData) {
    const type = String(formData.get("type") ?? "registration-papers") as
      | "registration-papers"
      | "service-history"
      | "roadworthy-certificate"
      | "finance-settlement"
      | "warranty"
      | "inspection-report";

    const fileName = String(formData.get("fileName") ?? "").trim();
    const fileUrl = String(formData.get("fileUrl") ?? "").trim();
    const uploadedBy = String(formData.get("uploadedBy") ?? "Dealer User").trim();

    await run(async () => {
      await createVehicleDocument(dealershipId, workspace.vehicle.id, {
        type,
        fileName,
        fileUrl,
        uploadedBy,
      });
    });
  }

  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[length:var(--text-h5)] font-semibold">{workspace.vehicle.title}</h3>
          <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            {workspace.vehicle.stockNumber} | Score {workspace.vehicle.listingQualityScore}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={workspace.vehicle.lifecycleStatus}
            disabled={isBusy}
            onChange={(event) => {
              const status = event.target.value as typeof workspace.vehicle.lifecycleStatus;
              void run(async () => {
                await patchVehicleLifecycleStatus(dealershipId, workspace.vehicle.id, status);
              });
            }}
          >
            {lifecycleOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-[length:var(--text-body-sm)] ${
              activeTab === tab
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-foreground)]"
            }`}
          >
            {tab.replace("-", " ")}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {activeTab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Price" value={formatCurrencyCents(workspace.vehicle.askingPriceCents, workspace.vehicle.currency)} />
            <MetricCard label="Mileage" value={`${workspace.vehicle.mileageKm.toLocaleString()} km`} />
            <MetricCard label="Photos" value={String(workspace.photos.length)} />
            <MetricCard label="Leads 30d" value={String(workspace.vehicle.leadCount30d)} />
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="VIN" value={workspace.vehicle.vin} />
            <MetricCard label="Registration" value={workspace.vehicle.registrationNumber} />
            <MetricCard label="Year" value={String(workspace.vehicle.year)} />
            <MetricCard label="Make" value={workspace.vehicle.make} />
            <MetricCard label="Model" value={workspace.vehicle.model} />
            <MetricCard label="Branch" value={workspace.vehicle.branchId} />
          </div>
        )}

        {activeTab === "photos" && (
          <div className="space-y-4">
            <form
              className="grid gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] p-4 sm:grid-cols-2 lg:grid-cols-4"
              action={(formData) => {
                void addMedia(formData);
              }}
            >
              <FormField label="File Name" htmlFor="media-file-name" required>
                <Input id="media-file-name" name="fileName" placeholder="front-angle.jpg" />
              </FormField>
              <FormField label="File URL" htmlFor="media-file-url" required>
                <Input id="media-file-url" name="fileUrl" placeholder="https://..." />
              </FormField>
              <FormField label="Quality" htmlFor="media-quality" required>
                <Select id="media-quality" name="qualityStatus" defaultValue="review">
                  <option value="good">Good</option>
                  <option value="review">Needs Review</option>
                  <option value="poor">Poor</option>
                </Select>
              </FormField>
              <div className="flex items-end">
                <Button type="submit" disabled={isBusy} className="w-full">Add Media</Button>
              </div>
            </form>

            <ul className="space-y-2">
              {workspace.photos.map((photo) => (
                <li
                  key={photo.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", photo.id);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    const sourceId = event.dataTransfer.getData("text/plain");
                    if (!sourceId || sourceId === photo.id) return;
                    const ordered = workspace.photos.map((item) => item.id);
                    const from = ordered.indexOf(sourceId);
                    const to = ordered.indexOf(photo.id);
                    if (from < 0 || to < 0) return;
                    const next = [...ordered];
                    const [moved] = next.splice(from, 1);
                    next.splice(to, 0, moved!);
                    void run(async () => {
                      await reorderVehicleMediaItems(dealershipId, workspace.vehicle.id, next);
                    });
                  }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <div>
                    <p className="text-[length:var(--text-body-sm)] font-medium">{photo.url}</p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                      Quality: {photo.qualityStatus} | Status: {photo.processingStatus} | AI: future pipeline
                    </p>
                    <div className="mt-1 h-1.5 w-40 rounded-full bg-[var(--color-border)]">
                      <div
                        className="h-1.5 rounded-full bg-[var(--color-primary)]"
                        style={{ width: photo.processingStatus === "ready" ? "100%" : photo.processingStatus === "processing" ? "60%" : "20%" }}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant={photo.isPrimary ? "primary" : "outline"}
                    size="sm"
                    disabled={isBusy || photo.isPrimary}
                    onClick={() => {
                      void run(async () => {
                        await setPrimaryVehicleMediaItem(dealershipId, workspace.vehicle.id, photo.id);
                      });
                    }}
                  >
                    {photo.isPrimary ? "Primary" : "Set Primary"}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <form
              className="grid gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] p-4 sm:grid-cols-2 lg:grid-cols-4"
              action={(formData) => {
                void addDocument(formData);
              }}
            >
              <FormField label="Type" htmlFor="doc-type" required>
                <Select id="doc-type" name="type" defaultValue="registration-papers">
                  <option value="registration-papers">Registration Papers</option>
                  <option value="service-history">Service History</option>
                  <option value="roadworthy-certificate">Roadworthy Certificate</option>
                  <option value="finance-settlement">Finance Settlement</option>
                  <option value="warranty">Warranty</option>
                  <option value="inspection-report">Vehicle Inspection Report</option>
                </Select>
              </FormField>
              <FormField label="File Name" htmlFor="doc-file-name" required>
                <Input id="doc-file-name" name="fileName" placeholder="service-history.pdf" />
              </FormField>
              <FormField label="File URL" htmlFor="doc-file-url" required>
                <Input id="doc-file-url" name="fileUrl" placeholder="https://..." />
              </FormField>
              <FormField label="Uploaded By" htmlFor="doc-uploaded-by" required>
                <Input id="doc-uploaded-by" name="uploadedBy" placeholder="Dealer User" />
              </FormField>
              <div className="sm:col-span-2 lg:col-span-4">
                <Button type="submit" disabled={isBusy}>Add Document</Button>
              </div>
            </form>

            <ul className="space-y-2">
              {workspace.documents.map((doc) => (
                <li key={doc.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <p className="text-[length:var(--text-body-sm)] font-medium">{doc.fileName}</p>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                    {doc.type} | {doc.uploadedBy} | {formatShortDate(doc.uploadedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="space-y-2">
            <MetricCard label="Current Asking Price" value={formatCurrencyCents(workspace.vehicle.askingPriceCents, workspace.vehicle.currency)} />
            {workspace.pricingHistory.map((point) => (
              <div key={point.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                <p className="font-medium">{formatCurrencyCents(point.priceCents, workspace.vehicle.currency)}</p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                  {point.reason} | {point.changedBy} | {formatShortDate(point.changedAt)}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "ai-insights" && (
          <div className="space-y-2">
            <MetricCard label="Listing Quality Score" value={`${workspace.vehicle.listingQualityScore}/100`} />
            {workspace.recommendations.map((rec) => (
              <div key={rec.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                <p className="font-medium">{rec.label}</p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Impact: {rec.impact}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "publishing" && (
          <div className="space-y-2">
            <MetricCard label="Lifecycle" value={workspace.vehicle.lifecycleStatus} />
            <MetricCard label="Ready to Publish" value={workspace.vehicle.lifecycleStatus === "ready-to-publish" ? "Yes" : "No"} />
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-2">
            <MetricCard label="Lead Count (30d)" value={String(workspace.vehicle.leadCount30d)} />
            <MetricCard label="Days in Stock" value={String(workspace.vehicle.daysInStock)} />
            <MetricCard label="Estimated Days to Sell" value={workspace.vehicle.estimatedDaysToSell ? String(workspace.vehicle.estimatedDaysToSell) : "Awaiting live market data"} />
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
              <p className="font-medium">Market Intelligence</p>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{workspace.marketIntelligence.label}</p>
              <ul className="mt-2 space-y-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                <li>Market Position: {workspace.marketIntelligence.marketPosition}</li>
                <li>Estimated Demand: {workspace.marketIntelligence.estimatedDemand}</li>
                <li>Price Confidence: {workspace.marketIntelligence.priceConfidence}</li>
                <li>Days-to-Sell Estimate: {workspace.marketIntelligence.daysToSellEstimate}</li>
                <li>Market Trend: {workspace.marketIntelligence.marketTrend}</li>
                <li>Competitor Comparison: {workspace.marketIntelligence.competitorComparison}</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <ul className="space-y-2">
            {workspace.history.map((entry) => (
              <li key={entry.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                <p className="font-medium">{entry.eventType}</p>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{entry.message}</p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{formatShortDate(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}

        {activeTab === "audit-trail" && (
          <ul className="space-y-2">
            {workspace.auditTrail.map((entry) => (
              <li key={entry.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                <p className="font-medium">{entry.action}</p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Actor: {entry.actorType} ({entry.actorId})</p>
                <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{entry.payload}</p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{formatShortDate(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{label}</p>
      <p className="text-[length:var(--text-body-md)] font-semibold">{value}</p>
    </div>
  );
}
