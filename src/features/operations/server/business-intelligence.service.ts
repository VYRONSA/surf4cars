import type { BusinessIntelligenceSectionId } from "@/features/operations/config/business-intelligence-sections";
import { getApplicationsCentreWorkspaceData } from "@/features/operations/server/applications-centre.service";
import { getDealerIntelligenceWorkspaceData } from "@/features/operations/server/dealer-intelligence.service";
import { getDealerManagementData } from "@/features/operations/server/dealer-management.service";
import { getMarketplaceControlWorkspaceData } from "@/features/operations/server/marketplace-control.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import { getPartnerCentreWorkspaceData } from "@/features/operations/server/partner-centre.service";
import { getRevenueCentreWorkspaceData } from "@/features/operations/server/revenue-centre.service";
import {
  readPlatformStore,
  type LocalLeadRecord,
} from "@/lib/local-persistence/platform-store";
import type {
  BusinessIntelligenceActionInput,
  BusinessIntelligenceWorkspaceData,
  ExecutiveKpi,
  GrowthTrendRow,
} from "@/features/operations/types/business-intelligence.types";

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

function countWithinDays(timestamps: readonly string[], days: number): number {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return timestamps.filter((value) => {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) && parsed >= cutoff;
  }).length;
}

function monthRange(monthOffset: number): { readonly start: number; readonly end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1, 0, 0, 0, 0).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1, 0, 0, 0, 0).getTime();
  return { start, end };
}

function countInMonth(timestamps: readonly string[], monthOffset: number): number {
  const range = monthRange(monthOffset);
  return timestamps.filter((value) => {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) && parsed >= range.start && parsed < range.end;
  }).length;
}

function growthRate(current: number, previous: number): { readonly value: string; readonly availability: "live" | "coming-soon" } {
  if (previous <= 0) {
    return {
      value: "Coming Soon",
      availability: "coming-soon",
    };
  }

  const rate = Math.round(((current - previous) / previous) * 100);
  return {
    value: `${rate >= 0 ? "+" : ""}${rate}%`,
    availability: "live",
  };
}

function avg(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function metric(id: string, label: string, value: string, detail: string, availability: "live" | "coming-soon"): ExecutiveKpi {
  return {
    id,
    label,
    value,
    detail,
    availability,
  };
}

function trendRow(id: string, metricLabel: string, timestamps: readonly string[], detail: string): GrowthTrendRow {
  const daily = countWithinDays(timestamps, 1);
  const weekly = countWithinDays(timestamps, 7);
  const monthly = countWithinDays(timestamps, 30);
  const quarterly = countWithinDays(timestamps, 90);
  const annual = countWithinDays(timestamps, 365);
  const availability: "live" | "coming-soon" = timestamps.length > 0 ? "live" : "coming-soon";

  return {
    id,
    metric: metricLabel,
    daily: availability === "live" ? daily.toLocaleString("en-ZA") : "Coming Soon",
    weekly: availability === "live" ? weekly.toLocaleString("en-ZA") : "Coming Soon",
    monthly: availability === "live" ? monthly.toLocaleString("en-ZA") : "Coming Soon",
    quarterly: availability === "live" ? quarterly.toLocaleString("en-ZA") : "Coming Soon",
    annual: availability === "live" ? annual.toLocaleString("en-ZA") : "Coming Soon",
    availability,
    detail,
  };
}

function extractUniqueBuyerSignals(leads: readonly LocalLeadRecord[]): readonly string[] {
  const byIdentity = new Map<string, string>();

  for (const lead of leads) {
    const key = lead.buyerId?.trim().toLowerCase() || lead.buyerEmail.trim().toLowerCase();
    if (!key) continue;
    if (!byIdentity.has(key)) {
      byIdentity.set(key, lead.createdAt);
    }
  }

  return [...byIdentity.values()];
}

export async function getBusinessIntelligenceWorkspaceData(
  sectionId: BusinessIntelligenceSectionId,
): Promise<BusinessIntelligenceWorkspaceData> {
  const generatedAt = new Date().toISOString();

  const [
    store,
    dealerManagement,
    dealerIntelligence,
    applications,
    marketplace,
    revenue,
    partners,
  ] = await Promise.all([
    readPlatformStore(),
    getDealerManagementData().catch(() => null),
    getDealerIntelligenceWorkspaceData().catch(() => null),
    getApplicationsCentreWorkspaceData().catch(() => null),
    getMarketplaceControlWorkspaceData("overview").catch(() => null),
    getRevenueCentreWorkspaceData("overview").catch(() => null),
    getPartnerCentreWorkspaceData("overview").catch(() => null),
  ]);

  const dealershipTimestamps = store.dealerships.map((item) => item.createdAt);
  const inventoryTimestamps = store.inventoryVehicles.map((item) => item.createdAt);
  const leadTimestamps = store.leads.map((item) => item.createdAt);
  const buyerSignalTimestamps = extractUniqueBuyerSignals(store.leads);
  const applicationTimestamps = applications?.queue.map((item) => item.createdAt) ?? [];
  const partnerCreatedTimestamps = partners?.timeline
    .filter((item) => item.eventType === "created")
    .map((item) => item.createdAt) ?? [];
  const marketActivityTimestamps = store.marketAnalyticsEvents.map((item) => item.eventTimestamp);

  const dealerGrowth = growthRate(countInMonth(dealershipTimestamps, 0), countInMonth(dealershipTimestamps, -1));
  const buyerGrowth = growthRate(countInMonth(buyerSignalTimestamps, 0), countInMonth(buyerSignalTimestamps, -1));
  const marketplaceGrowth = growthRate(countInMonth(marketActivityTimestamps, 0), countInMonth(marketActivityTimestamps, -1));
  const partnerGrowth = growthRate(countInMonth(partnerCreatedTimestamps, 0), countInMonth(partnerCreatedTimestamps, -1));
  const leadGrowth = growthRate(countInMonth(leadTimestamps, 0), countInMonth(leadTimestamps, -1));
  const applicationGrowth = growthRate(countInMonth(applicationTimestamps, 0), countInMonth(applicationTimestamps, -1));
  const inventoryGrowth = growthRate(countInMonth(inventoryTimestamps, 0), countInMonth(inventoryTimestamps, -1));

  const publishedVehicles = marketplace?.health.published;
  const soldVehicles = marketplace?.health.sold;
  const averageListingQuality = marketplace?.health.averageListingQuality;
  const dealerHealthScore = dealerManagement ? avg(dealerManagement.health.map((item) => item.healthScore)) : null;

  const marketplaceHealthCard = marketplace?.summaryCards.find((item) => item.id === "marketplace-health-score");
  const marketplaceHealthValue = marketplaceHealthCard?.value ?? "Coming Soon";
  const marketplaceHealthAvailability = marketplaceHealthCard?.availability ?? "coming-soon";

  const liveHealthInputs = [averageListingQuality, dealerHealthScore]
    .filter((item): item is number => typeof item === "number");
  const platformHealth = liveHealthInputs.length > 0
    ? `${Math.round(liveHealthInputs.reduce((sum, value) => sum + value, 0) / liveHealthInputs.length)}%`
    : "Coming Soon";

  const revenueGrowthTrend = revenue?.trends.find((item) => item.id === "new-dealers-month");
  const revenueGrowthBaseline = revenue?.trends.find((item) => item.id === "new-dealers-prev");
  const revenueGrowth = revenueGrowthTrend && revenueGrowthBaseline
    ? growthRate(Number(revenueGrowthTrend.value.replace(/,/g, "")), Number(revenueGrowthBaseline.value.replace(/,/g, "")))
    : { value: "Coming Soon", availability: "coming-soon" as const };

  const executiveKpis: readonly ExecutiveKpi[] = [
    metric("dealer-growth", "Dealer Growth", dealerGrowth.value, "Month-over-month dealership growth from dealer onboarding records.", dealerGrowth.availability),
    metric("buyer-growth", "Buyer Growth", buyerGrowth.value, "Month-over-month unique buyer growth from lead and buyer signal records.", buyerGrowth.availability),
    metric("published-vehicles", "Published Vehicles", typeof publishedVehicles === "number" ? publishedVehicles.toLocaleString("en-ZA") : "Coming Soon", "Live marketplace-visible inventory from Marketplace Control.", typeof publishedVehicles === "number" ? "live" : "coming-soon"),
    metric("sold-vehicles", "Sold Vehicles", typeof soldVehicles === "number" ? soldVehicles.toLocaleString("en-ZA") : "Coming Soon", "Live sold lifecycle count from marketplace and inventory services.", typeof soldVehicles === "number" ? "live" : "coming-soon"),
    metric("marketplace-growth", "Marketplace Growth", marketplaceGrowth.value, "Month-over-month growth from market analytics event volume.", marketplaceGrowth.availability),
    metric("revenue-growth", "Revenue Growth", revenueGrowth.value, "Revenue Centre growth signal from monthly onboarding movement used in existing revenue trends.", revenueGrowth.availability),
    metric("partner-growth", "Partner Growth", partnerGrowth.value, "Partner creation growth from Partner Centre timeline events.", partnerGrowth.availability),
    metric("lead-growth", "Lead Growth", leadGrowth.value, "Month-over-month lead creation growth from platform lead records.", leadGrowth.availability),
    metric("application-growth", "Application Growth", applicationGrowth.value, "Month-over-month operational application queue growth.", applicationGrowth.availability),
    metric("inventory-growth", "Inventory Growth", inventoryGrowth.value, "Month-over-month inventory listing growth from inventory lifecycle records.", inventoryGrowth.availability),
    metric("average-listing-quality", "Average Listing Quality", typeof averageListingQuality === "number" ? `${averageListingQuality}%` : "Coming Soon", "Live average listing quality from Marketplace Control health snapshot.", typeof averageListingQuality === "number" ? "live" : "coming-soon"),
    metric("dealer-health", "Dealer Health", typeof dealerHealthScore === "number" ? `${dealerHealthScore}%` : "Coming Soon", "Live average dealer health from Dealer Management health scoring.", typeof dealerHealthScore === "number" ? "live" : "coming-soon"),
    metric("marketplace-health", "Marketplace Health", marketplaceHealthValue, "Marketplace health score reused from Marketplace Control summary card.", marketplaceHealthAvailability),
    metric("platform-health", "Platform Health", platformHealth, "Composite executive platform health from available dealer and marketplace quality signals.", platformHealth === "Coming Soon" ? "coming-soon" : "live"),
  ];

  const growthTrends: readonly GrowthTrendRow[] = [
    trendRow("dealers", "Dealer Growth", dealershipTimestamps, "Dealer onboarding creation velocity."),
    trendRow("buyers", "Buyer Growth", buyerSignalTimestamps, "Unique buyer signal velocity from platform demand."),
    trendRow("inventory", "Inventory Growth", inventoryTimestamps, "Inventory intake velocity from listing creation."),
    trendRow("leads", "Lead Growth", leadTimestamps, "Lead generation velocity from buyer demand."),
    trendRow("applications", "Application Growth", applicationTimestamps, "Applications and request queue velocity."),
    trendRow("partners", "Partner Growth", partnerCreatedTimestamps, "Partner creation timeline velocity."),
  ];

  const moduleSnapshots: BusinessIntelligenceWorkspaceData["moduleSnapshots"] = [
    {
      id: "dealers",
      module: "Dealers",
      health: typeof dealerHealthScore === "number" ? `${dealerHealthScore}%` : "Coming Soon",
      growthSignal: dealerGrowth.value,
      operationalSignal: dealerManagement ? `${dealerManagement.applications.length.toLocaleString("en-ZA")} applications in dealer lifecycle` : "Coming Soon",
      availability: dealerManagement ? "live" : "coming-soon",
    },
    {
      id: "marketplace",
      module: "Marketplace",
      health: marketplaceHealthValue,
      growthSignal: marketplaceGrowth.value,
      operationalSignal: marketplace ? `${marketplace.approvalQueue.length.toLocaleString("en-ZA")} listings in control queue` : "Coming Soon",
      availability: marketplace ? "live" : "coming-soon",
    },
    {
      id: "revenue",
      module: "Revenue",
      health: revenue?.summaryCards.find((item) => item.id === "active-subscribers")?.value ?? "Coming Soon",
      growthSignal: revenueGrowth.value,
      operationalSignal: revenue?.summaryCards.find((item) => item.id === "growth")?.value ?? "Coming Soon",
      availability: revenue ? "live" : "coming-soon",
    },
    {
      id: "partners",
      module: "Partners",
      health: partners ? `${partners.directory.filter((item) => item.status === "active").length.toLocaleString("en-ZA")} active` : "Coming Soon",
      growthSignal: partnerGrowth.value,
      operationalSignal: partners ? `${partners.directory.length.toLocaleString("en-ZA")} partner relationships tracked` : "Coming Soon",
      availability: partners ? "live" : "coming-soon",
    },
    {
      id: "applications",
      module: "Applications",
      health: applications?.queueStats.find((item) => item.id === "total-queue")?.value ?? "Coming Soon",
      growthSignal: applicationGrowth.value,
      operationalSignal: applications ? `${applications.queue.filter((item) => item.status === "new").length.toLocaleString("en-ZA")} new workflow items` : "Coming Soon",
      availability: applications ? "live" : "coming-soon",
    },
  ];

  const aiReadyClassifications = dealerIntelligence?.aiClassifications.filter((item) => item.classification === "ready").length ?? 0;
  const aiNeedsReview = dealerIntelligence?.aiClassifications.filter((item) => item.classification !== "ready").length ?? 0;
  const aiPendingMarketplace = marketplace?.aiModeration.filter((item) => item.moderationStatus === "needs-review").length ?? 0;

  const aiInsights: BusinessIntelligenceWorkspaceData["aiInsights"] = [
    {
      id: "dealer-ai-ready",
      label: "Dealer AI Ready Profiles",
      value: dealerIntelligence ? aiReadyClassifications.toLocaleString("en-ZA") : "Coming Soon",
      detail: "Reused from Dealer Intelligence AI classification results.",
      availability: dealerIntelligence ? "live" : "coming-soon",
    },
    {
      id: "dealer-ai-needs-review",
      label: "Dealer AI Needs Review",
      value: dealerIntelligence ? aiNeedsReview.toLocaleString("en-ZA") : "Coming Soon",
      detail: "Reused from Dealer Intelligence verification and enrichment classifications.",
      availability: dealerIntelligence ? "live" : "coming-soon",
    },
    {
      id: "marketplace-ai-review",
      label: "Marketplace AI Review Queue",
      value: marketplace ? aiPendingMarketplace.toLocaleString("en-ZA") : "Coming Soon",
      detail: "Reused from Marketplace Control moderation queue state.",
      availability: marketplace ? "live" : "coming-soon",
    },
    {
      id: "buyer-ai-intelligence",
      label: "Buyer AI Intelligence",
      value: "Coming Soon",
      detail: "Buyer AI insight rollups will surface when executive aggregation contracts are enabled.",
      availability: "coming-soon",
    },
  ];

  const forecasts: BusinessIntelligenceWorkspaceData["forecasts"] = [
    {
      id: "dealer-growth-forecast",
      label: "Dealer Growth Forecast",
      status: "framework",
      detail: "Framework ready to plug dealer onboarding trend models into executive projection cards.",
      extensionPoint: "business-intelligence.forecasts.dealers",
    },
    {
      id: "revenue-forecast",
      label: "Revenue Forecast",
      status: "framework",
      detail: "Framework ready to consume Revenue Centre forecast models when live billing feeds are connected.",
      extensionPoint: "business-intelligence.forecasts.revenue",
    },
    {
      id: "inventory-forecast",
      label: "Inventory and Sell-Through Forecast",
      status: "framework",
      detail: "Framework ready to ingest inventory ageing and velocity projections.",
      extensionPoint: "business-intelligence.forecasts.inventory",
    },
    {
      id: "partner-forecast",
      label: "Partner Performance Forecast",
      status: "framework",
      detail: "Framework ready for partner conversion and contribution forecasting once live partner integrations are connected.",
      extensionPoint: "business-intelligence.forecasts.partners",
    },
  ];

  const reports: BusinessIntelligenceWorkspaceData["reports"] = [
    {
      id: "exec-health-pack",
      name: "Executive Health Pack",
      status: "ready",
      source: "Business Intelligence aggregate",
      detail: "Consolidates live KPI cards across dealer, marketplace, revenue, partner, and application modules.",
    },
    {
      id: "growth-pulse-report",
      name: "Growth Pulse Report",
      status: "ready",
      source: "Growth trend matrix",
      detail: "Daily to annual trend table for dealers, buyers, leads, applications, inventory, and partners.",
    },
    {
      id: "revenue-centre-report",
      name: "Revenue Intelligence Report",
      status: revenue ? "ready" : "coming-soon",
      source: "Revenue Centre",
      detail: "Reused revenue stream and trend signals from Revenue Centre.",
    },
    {
      id: "partner-centre-report",
      name: "Partner Intelligence Report",
      status: partners ? "ready" : "coming-soon",
      source: "Partner Centre",
      detail: "Reused partner directory, performance, and timeline signals from Partner Centre.",
    },
  ];

  const timeline = [
    ...store.marketAnalyticsEvents.map((event) => ({
      id: event.id,
      eventName: event.eventName,
      source: event.source,
      actorType: event.actorType,
      detail: typeof event.payload.note === "string" ? event.payload.note : event.eventName,
      createdAt: event.eventTimestamp,
    })),
    ...store.inventoryAudit.map((event) => ({
      id: event.id,
      eventName: event.action,
      source: "inventory-audit",
      actorType: event.actorType,
      detail: event.action,
      createdAt: event.createdAt,
    })),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 180);

  const audit = store.marketAnalyticsEvents
    .filter((event) => event.source === "operations-business-intelligence")
    .map((event) => ({
      id: event.id,
      action: event.eventName,
      source: event.source,
      actorType: event.actorType,
      createdAt: event.eventTimestamp,
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 200);

  return {
    generatedAt,
    sectionId,
    executiveKpis,
    growthTrends,
    moduleSnapshots,
    aiInsights,
    forecasts,
    reports,
    timeline,
    audit,
    sourceReadiness: [
      {
        id: "dealer-management",
        label: "Dealer Management",
        mode: dealerManagement ? "live" : "manual",
        detail: "Dealer lifecycle, health, and performance signals are reused directly from Dealer Management.",
      },
      {
        id: "dealer-intelligence",
        label: "Dealer Intelligence",
        mode: dealerIntelligence ? "live" : "manual",
        detail: "Dealer intelligence AI classifications and readiness are reused from Dealer Intelligence Engine.",
      },
      {
        id: "applications-centre",
        label: "Applications Centre",
        mode: applications ? "live" : "manual",
        detail: "Applications queue and workflow state are reused from Applications Centre.",
      },
      {
        id: "marketplace-control",
        label: "Marketplace Control",
        mode: marketplace ? "live" : "manual",
        detail: "Marketplace quality, moderation, and lifecycle signals are reused from Marketplace Control.",
      },
      {
        id: "revenue-centre",
        label: "Revenue Centre",
        mode: revenue ? "live" : "manual",
        detail: "Revenue stream and trend intelligence are reused from Revenue Centre.",
      },
      {
        id: "partner-centre",
        label: "Partner Centre",
        mode: partners ? "live" : "manual",
        detail: "Partner profile, performance, and timeline intelligence are reused from Partner Centre.",
      },
      {
        id: "forecast-models",
        label: "Forecast Models",
        mode: "coming-soon",
        detail: "Forecast framework is in place; predictive model integrations remain extension points only.",
      },
    ],
  };
}

function permissionForAction(action: BusinessIntelligenceActionInput["action"]): "operations:export" | "operations:manage" {
  if (action === "export-report") return "operations:export";
  return "operations:manage";
}

export async function applyBusinessIntelligenceAction(input: BusinessIntelligenceActionInput): Promise<void> {
  const store = await readPlatformStore();
  const dealershipId = store.dealerships[0]?.id;

  if (!dealershipId) {
    throw new Error("No dealership context available for audit logging.");
  }

  await logOperationsAuditEvent({
    dealershipId,
    eventName: `operations.business-intelligence.${input.action}`,
    source: "operations-business-intelligence",
    payload: {
      action: input.action,
      permission: permissionForAction(input.action),
      referenceId: input.referenceId ?? null,
      note: input.note ?? null,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
    },
  });
}

export function businessIntelligenceTimestampLabel(data: BusinessIntelligenceWorkspaceData): string {
  return rel(data.generatedAt);
}