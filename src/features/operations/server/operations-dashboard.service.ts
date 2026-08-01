import { getDealershipProfile } from "@/features/dealership/server/dealership-management.service";
import { listDealerEnquiries } from "@/features/enquiries/server/dealer-enquiry.service";
import { getInventoryDashboard } from "@/features/inventory/server/inventory-intelligence.service";
import { getMarketDashboard } from "@/features/market-intelligence/server/market-intelligence.service";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";
import { getVehicleEngine } from "@/services/vehicle-engine/vehicle-engine.service";
import type {
  OperationsDashboardData,
  OperationsRecentActivityItem,
  OperationsWidget,
} from "@/features/operations/types/operations-dashboard.types";

function formatRelative(isoTimestamp: string): string {
  const timestamp = Date.parse(isoTimestamp);
  if (!Number.isFinite(timestamp)) return "Unknown time";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function asComingSoon(id: OperationsWidget["id"], label: string, detail: string): OperationsWidget {
  return {
    id,
    label,
    value: "Coming Soon",
    availability: "coming-soon",
    detail,
  };
}

export async function getOperationsDashboardData(accessToken?: string): Promise<OperationsDashboardData> {
  const generatedAt = new Date().toISOString();
  const store = await readPlatformStore();

  const dealerships = store.dealerships;
  const firstDealership = dealerships[0] ?? null;
  const firstDealershipId = firstDealership?.id ?? null;

  const [allVehicles, publishedVehicles, firstDealershipEnquiries, inventoryDashboard, marketDashboard] = await Promise.all([
    getVehicleEngine().listAll(),
    getVehicleEngine().listPublishable(),
    firstDealershipId ? listDealerEnquiries({ dealershipId: firstDealershipId }).catch(() => []) : Promise.resolve([]),
    firstDealershipId ? getInventoryDashboard(firstDealershipId, accessToken).catch(() => null) : Promise.resolve(null),
    firstDealershipId ? getMarketDashboard(firstDealershipId, accessToken).catch(() => null) : Promise.resolve(null),
  ]);

  if (firstDealershipId) {
    await getDealershipProfile(firstDealershipId, accessToken).catch(() => null);
  }

  const pendingDealerApprovals = store.staffMemberships.filter((membership) => membership.status === "invited").length;
  const activeDealers = dealerships.filter((dealer) => dealer.onboardingStatus === "completed").length;
  const dealerApplications = Math.max(0, dealerships.length - activeDealers);
  const marketplaceHealth = allVehicles.length === 0
    ? "Coming Soon"
    : `${Math.round((publishedVehicles.length / allVehicles.length) * 100)}%`;

  const marketplaceHealthDetail = marketDashboard
    ? marketDashboard.metrics.find((metric) => metric.id === "market-position")?.message
      ?? "Derived from published vehicle ratio and market service telemetry."
    : "Live ratio from vehicle publication state. Advanced marketplace telemetry is still onboarding.";

  const aiInsights: string[] = [];
  if (inventoryDashboard) {
    const readyCount = inventoryDashboard.insights.find((item) => item.id === "ready")?.count ?? 0;
    aiInsights.push(`${readyCount} inventory items are publish-ready from Inventory Intelligence.`);
  }
  if (marketDashboard) {
    const pendingMetrics = marketDashboard.metrics.filter((metric) => metric.status === "pending").length;
    aiInsights.push(`${pendingMetrics} market signals are waiting on live external feeds.`);
  }

  const widgets: OperationsWidget[] = [
    {
      id: "dealer-applications",
      label: "Dealer Applications",
      value: dealerApplications.toLocaleString("en-ZA"),
      availability: "live",
      detail: "Captured from completed dealer onboarding records.",
    },
    {
      id: "pending-dealer-approvals",
      label: "Pending Dealer Approvals",
      value: pendingDealerApprovals.toLocaleString("en-ZA"),
      availability: "live",
      detail: "Derived from invited team memberships awaiting activation.",
    },
    {
      id: "active-dealers",
      label: "Active Dealers",
      value: activeDealers.toLocaleString("en-ZA"),
      availability: "live",
      detail: "Dealerships with completed onboarding status.",
    },
    {
      id: "published-vehicles",
      label: "Published Vehicles",
      value: publishedVehicles.length.toLocaleString("en-ZA"),
      availability: "live",
      detail: "Read from Vehicle Engine marketplace-visible records.",
    },
    {
      id: "marketplace-health",
      label: "Marketplace Health",
      value: marketplaceHealth,
      availability: marketplaceHealth === "Coming Soon" ? "coming-soon" : "live",
      detail: marketplaceHealthDetail,
    },
    asComingSoon("todays-revenue", "Today's Revenue", "Revenue Centre financial feeds are not connected yet."),
    asComingSoon("finance-applications", "Finance Applications", "Finance application service integration is pending."),
    asComingSoon("insurance-applications", "Insurance Applications", "Insurance workflow integration is pending."),
    asComingSoon("warranty-applications", "Warranty Applications", "Warranty provider integration is pending."),
    {
      id: "support-tickets",
      label: "Support Tickets",
      value: firstDealershipEnquiries.length.toLocaleString("en-ZA"),
      availability: firstDealershipId ? "live" : "coming-soon",
      detail: firstDealershipId
        ? "Current lead and support workload from the lead service for active dealer context."
        : "No active dealership context yet.",
    },
    asComingSoon("platform-alerts", "Platform Alerts", "Cross-platform alerting orchestration is pending."),
    {
      id: "ai-insights",
      label: "AI Insights",
      value: aiInsights.length > 0 ? aiInsights.length.toLocaleString("en-ZA") : "Coming Soon",
      availability: aiInsights.length > 0 ? "live" : "coming-soon",
      detail: aiInsights.length > 0
        ? aiInsights.join(" ")
        : "AI monitoring pipeline for operations staff is not connected yet.",
    },
    asComingSoon("worker-status", "Worker Status", "Background worker runtime status feed is pending."),
    asComingSoon("system-health", "System Health", "System health telemetry integration is pending."),
  ];

  const recentActivity: OperationsRecentActivityItem[] = store.marketAnalyticsEvents
    .slice()
    .sort((a, b) => Date.parse(b.eventTimestamp) - Date.parse(a.eventTimestamp))
    .slice(0, 8)
    .map((event) => ({
      id: event.id,
      title: event.eventName,
      timestamp: formatRelative(event.eventTimestamp),
      source: event.source,
    }));

  return {
    generatedAt,
    widgets,
    recentActivity,
    alerts: [
      "Live platform alert pipelines are not connected yet.",
      "Use Audit Logs for interim operational traceability.",
    ],
  };
}
