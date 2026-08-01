import { getVehicleEngine } from "@/services/vehicle-engine/vehicle-engine.service";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";
import { getInventoryDashboard, getVehicleWorkspace, listInventoryVehicles } from "@/features/inventory/server/inventory-intelligence.service";
import { getMarketDashboard } from "@/features/market-intelligence/server/market-intelligence.service";
import type {
  DashboardActivity,
  DashboardAiInsight,
  DashboardHealthMetric,
  DashboardInventoryCategory,
  DashboardKpi,
  DashboardLead,
  DashboardTask,
  DealerDashboardData,
} from "@/features/dealer-command-centre/types/dashboard.types";
import type { InventoryDashboardPayload, InventoryListPayload, InventoryVehicleListItem } from "@/features/inventory/types/inventory-intelligence.types";

const QUICK_ACTIONS: DealerDashboardData["quickActions"] = [
  { id: "add", label: "Add Vehicle", icon: "Plus", href: "/dealer/inventory/new" },
  { id: "inventory", label: "Manage Inventory", icon: "Car", href: "/dealer/inventory" },
  { id: "market", label: "Market Intelligence", icon: "LineChart", href: "/dealer/market" },
  { id: "dashboard", label: "Dealer Dashboard", icon: "LayoutDashboard", href: "/dealer/dashboard" },
  { id: "branches", label: "Branches", icon: "Building2", href: "/dealer/branches" },
] as const;

function buildFallbackInventoryList(store: Awaited<ReturnType<typeof readPlatformStore>>, dealershipId: string): InventoryListPayload {
  const vehicles = store.inventoryVehicles
    .filter((item) => item.dealershipId === dealershipId && item.lifecycleStatus !== "deleted")
    .map((item) => {
      const media = store.inventoryMedia.filter((asset) => asset.vehicleId === item.id);
      const photoCount = media.length;
      const hasPrimaryPhoto = media.some((asset) => asset.isPrimary);
      const hasDescription = Boolean(item.description?.trim());
      const hasSeo = Boolean(item.seoTitle?.trim() && item.seoDescription?.trim());
      const listingQualityScore = [
        hasDescription ? 30 : 0,
        hasSeo ? 20 : 0,
        hasPrimaryPhoto ? 15 : 0,
        Math.min(photoCount, 6) * 5,
        item.lifecycleStatus === "published" ? 5 : 0,
      ].reduce((sum, value) => sum + value, 0);

      return {
        id: item.id,
        dealershipId: item.dealershipId,
        branchId: item.branchId,
        stockNumber: item.stockNumber,
        vin: item.vin,
        registrationNumber: item.registrationNumber,
        title: item.title,
        make: item.make,
        model: item.model,
        year: item.year,
        mileageKm: item.mileageKm,
        askingPriceCents: item.askingPriceCents,
        currency: item.currency,
        lifecycleStatus: item.lifecycleStatus as InventoryVehicleListItem["lifecycleStatus"],
        listingQualityScore,
        photoCount,
        hasPrimaryPhoto,
        hasDescription,
        hasSeo,
        requiresAttention: listingQualityScore < 70 || photoCount < 6 || !hasDescription || !hasSeo,
        daysInStock: Math.max(0, Math.floor((Date.now() - Date.parse(item.createdAt)) / (1000 * 60 * 60 * 24))),
        estimatedDaysToSell: item.estimatedDaysToSell,
        leadCount30d: item.leadCount30d,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
      } satisfies InventoryVehicleListItem;
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  return {
    items: vehicles,
    total: vehicles.length,
    page: 1,
    pageSize: vehicles.length,
  };
}

function buildFallbackInventoryDashboard(list: InventoryListPayload): InventoryDashboardPayload {
  const items = list.items;
  const stats = {
    totalInventory: items.length,
    draftListings: items.filter((item) => item.lifecycleStatus === "draft").length,
    publishedListings: items.filter((item) => item.lifecycleStatus === "published").length,
    soldVehicles: items.filter((item) => item.lifecycleStatus === "sold").length,
    archivedVehicles: items.filter((item) => item.lifecycleStatus === "archived").length,
    requiringAttention: items.filter((item) => item.requiresAttention).length,
  };

  return {
    stats,
    insights: [
      {
        id: "ready",
        title: "Ready to Publish",
        count: items.filter((item) => item.lifecycleStatus === "ready-to-publish").length,
        description: "Listings that can go live now.",
        action: "Publish listings",
      },
      {
        id: "missing-photos",
        title: "Missing Photos",
        count: items.filter((item) => item.photoCount < 6).length,
        description: "Listings that still need photo depth.",
        action: "Complete photo sets",
      },
      {
        id: "missing-info",
        title: "Missing Copy",
        count: items.filter((item) => !item.hasDescription || !item.hasSeo).length,
        description: "Listings missing copy or SEO metadata.",
        action: "Complete content",
      },
      {
        id: "price-review",
        title: "Needs Price Review",
        count: items.filter((item) => item.daysInStock > 45 && item.lifecycleStatus !== "sold" && item.lifecycleStatus !== "archived").length,
        description: "Long-stock vehicles that may need pricing attention.",
        action: "Review pricing",
      },
    ],
    recentActivity: [],
  };
}

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function startOfWeek(): number {
  const now = new Date();
  const day = now.getDay();
  const offset = day === 0 ? 6 : day - 1;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset).getTime();
}

function formatRelativeTimestamp(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function formatPercentage(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "Coming Soon";
  return `${Math.round(value)}%`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-ZA");
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toPriority(count: number): DashboardAiInsight["priority"] {
  if (count >= 5) return "high";
  if (count >= 2) return "medium";
  return "low";
}

function calculateProfileCompletion(dealership: {
  readonly tradingName?: string | null;
  readonly telephone?: string | null;
  readonly email?: string | null;
  readonly city?: string | null;
  readonly province?: string | null;
  readonly logoDataUrl?: string | null;
  readonly coverDataUrl?: string | null;
  readonly website?: string | null;
} | null): number {
  if (!dealership) return 0;

  const checkpoints = [
    Boolean(dealership.tradingName?.trim()),
    Boolean(dealership.telephone?.trim()),
    Boolean(dealership.email?.trim()),
    Boolean(dealership.city?.trim()),
    Boolean(dealership.province?.trim()),
    Boolean(dealership.logoDataUrl),
    Boolean(dealership.coverDataUrl),
    Boolean(dealership.website?.trim()),
  ];

  const completed = checkpoints.filter(Boolean).length;
  return Math.round((completed / checkpoints.length) * 100);
}

function buildComingSoonSeries(id: string, label: string, message: string) {
  return {
    id,
    label,
    values: [],
    availability: "coming-soon" as const,
    message,
  };
}

function buildWeeklySeries(values: readonly { readonly createdAt: string }[], weeks: number) {
  const now = new Date();
  const series = new Array<number>(weeks).fill(0);
  for (const value of values) {
    const createdAt = Date.parse(value.createdAt);
    if (!Number.isFinite(createdAt)) continue;
    const diffDays = Math.floor((now.getTime() - createdAt) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) continue;
    const weekIndex = weeks - 1 - Math.floor(diffDays / 7);
    if (weekIndex >= 0 && weekIndex < weeks) {
      series[weekIndex] = (series[weekIndex] ?? 0) + 1;
    }
  }
  return series;
}

function buildMonthlySeries(values: readonly { readonly createdAt: string }[], months: number) {
  const now = new Date();
  const series = new Array<number>(months).fill(0);
  for (const value of values) {
    const createdAt = new Date(value.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;
    const monthDiff = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth());
    const index = months - 1 - monthDiff;
    if (index >= 0 && index < months) {
      series[index] = (series[index] ?? 0) + 1;
    }
  }
  return series;
}

function buildCumulativeMonthlySeries(values: readonly { readonly createdAt: string }[], months: number) {
  const monthly = buildMonthlySeries(values, months);
  let running = 0;
  return monthly.map((value) => {
    running += value;
    return running;
  });
}

function mapLeadStatus(status: string | undefined, enquiryType: string): DashboardLead["status"] {
  if (status === "assigned" || status === "responded") return "contacted";
  if (status === "test-drive-scheduled" || status === "closed-won") return "qualified";
  if (status === "follow-up" || status === "finance-in-progress") return "follow-up";
  if (enquiryType === "test-drive") return "qualified";
  if (enquiryType === "finance") return "follow-up";
  return "new";
}

function mapLeadAction(status: string | undefined, enquiryType: string): string {
  if (status === "assigned") return "Respond to buyer";
  if (status === "responded") return "Schedule follow-up";
  if (status === "follow-up") return "Complete planned follow-up";
  if (status === "test-drive-scheduled") return "Confirm attendance";
  if (status === "finance-in-progress") return "Send finance options";
  if (status === "closed-won") return "Prepare handover";
  if (status === "closed-lost") return "Review loss reason";
  if (enquiryType === "test-drive") return "Confirm test drive slot";
  if (enquiryType === "finance") return "Send finance options";
  return "Call within 1 hour";
}

export async function getDealerDashboardData(
  dealershipId: string,
  accessToken?: string,
): Promise<DealerDashboardData> {
  const [store, tenantVehicles, marketDashboard] = await Promise.all([
    readPlatformStore(),
    getVehicleEngine().listForTenant(dealershipId).catch(() => []),
    getMarketDashboard(dealershipId, accessToken).catch(() => null),
  ]);

  let inventoryList: InventoryListPayload;
  let inventoryDashboard: InventoryDashboardPayload;

  try {
    [inventoryDashboard, inventoryList] = await Promise.all([
      getInventoryDashboard(dealershipId, accessToken),
      listInventoryVehicles({ dealershipId, pageSize: 500 }, accessToken),
    ]);
  } catch {
    inventoryList = buildFallbackInventoryList(store, dealershipId);
    inventoryDashboard = buildFallbackInventoryDashboard(inventoryList);
  }

  const dealership = store.dealerships.find((item) => item.id === dealershipId) ?? null;
  const vehicles = inventoryList.items;
  const activeStoreVehicles = store.inventoryVehicles.filter((item) => item.dealershipId === dealershipId && item.lifecycleStatus !== "deleted");
  const leads = store.leads
    .filter((lead) => lead.dealershipId === dealershipId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const history = store.inventoryHistory
    .filter((entry) => entry.dealershipId === dealershipId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const audit = store.inventoryAudit
    .filter((entry) => entry.dealershipId === dealershipId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const startToday = startOfToday();
  const startWeek = startOfWeek();
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const recentLeadCount = leads.filter((lead) => Date.parse(lead.createdAt) >= startToday).length;
  const openLeadCount = leads.filter((lead) => !["closed-won", "closed-lost"].includes((lead.status ?? "new") as string)).length;
  const testDriveCount = leads.filter((lead) => lead.enquiryType === "test-drive" && Date.parse(lead.createdAt) >= startToday).length;
  const financeCount = leads.filter((lead) => lead.enquiryType === "finance" && Date.parse(lead.createdAt) >= startToday).length;
  const soldThisMonth = history.filter((entry) => entry.eventType === "status-changed" && entry.message.includes(" to sold") && Date.parse(entry.createdAt) >= thirtyDaysAgo).length;
  const leadsLast30Days = leads.filter((lead) => Date.parse(lead.createdAt) >= thirtyDaysAgo).length;
  const conversionRate = leadsLast30Days > 0 ? (soldThisMonth / leadsLast30Days) * 100 : null;
  const publishedAudits = audit.filter((entry) => entry.action === "listing-builder-publish");
  const publishedToday = publishedAudits.filter((entry) => Date.parse(entry.createdAt) >= startToday).length;
  const publishedThisWeek = publishedAudits.filter((entry) => Date.parse(entry.createdAt) >= startWeek).length;
  const avgQuality = average(vehicles.map((item) => item.listingQualityScore));
  const completionRate = vehicles.length > 0
    ? (vehicles.filter((item) => item.hasDescription && item.hasSeo && item.photoCount >= 6 && item.hasPrimaryPhoto).length / vehicles.length) * 100
    : 0;
  const inventoryHealth = vehicles.length > 0
    ? (vehicles.filter((item) => !item.requiresAttention).length / vehicles.length) * 100
    : 0;
  const readyToPublishCount = inventoryDashboard.insights.find((item) => item.id === "ready")?.count ?? vehicles.filter((item) => item.lifecycleStatus === "ready-to-publish").length;
  const missingPhotosCount = inventoryDashboard.insights.find((item) => item.id === "missing-photos")?.count ?? vehicles.filter((item) => item.photoCount < 6).length;
  const missingInfoCount = inventoryDashboard.insights.find((item) => item.id === "missing-info")?.count ?? vehicles.filter((item) => !item.hasDescription || !item.hasSeo).length;
  const priceReviewCount = inventoryDashboard.insights.find((item) => item.id === "price-review")?.count ?? vehicles.filter((item) => item.daysInStock > 45 && item.lifecycleStatus !== "sold" && item.lifecycleStatus !== "archived").length;
  const featuredListings = tenantVehicles.filter((vehicle) => vehicle.marketing.featured).length;

  const vehicleTitleById = new Map(activeStoreVehicles.map((vehicle) => [vehicle.id, vehicle.title]));

  const recentLeads: DashboardLead[] = leads.slice(0, 5).map((lead) => ({
    id: lead.id,
    buyer: lead.buyerName,
    vehicle: vehicleTitleById.get(lead.vehicleId) ?? "Vehicle",
    date: formatRelativeTimestamp(lead.createdAt),
    status: mapLeadStatus((lead as { readonly status?: string }).status, lead.enquiryType),
    nextAction: mapLeadAction((lead as { readonly status?: string }).status, lead.enquiryType),
  }));

  const categories: DashboardInventoryCategory[] = [
    {
      id: "recent",
      label: "Recently Added",
      availability: "live",
      items: vehicles
        .slice()
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 4)
        .map((vehicle) => ({ id: vehicle.id, title: vehicle.title, meta: `Added ${formatRelativeTimestamp(vehicle.createdAt)}`, category: "recent" })),
    },
    {
      id: "photos",
      label: "Missing Photos",
      availability: "live",
      items: vehicles
        .filter((vehicle) => vehicle.photoCount < 6)
        .slice(0, 4)
        .map((vehicle) => ({ id: vehicle.id, title: vehicle.title, meta: `${vehicle.photoCount}/6 photos uploaded`, category: "photos" })),
    },
    {
      id: "low-views",
      label: "Low Quality Listings",
      availability: "live",
      items: vehicles
        .filter((vehicle) => vehicle.listingQualityScore < 80)
        .slice(0, 4)
        .map((vehicle) => ({ id: vehicle.id, title: vehicle.title, meta: `Quality score ${vehicle.listingQualityScore}/100`, category: "low-views" })),
    },
    {
      id: "above-market",
      label: "Needs Price Review",
      availability: "live",
      items: vehicles
        .filter((vehicle) => vehicle.daysInStock > 45 && vehicle.lifecycleStatus !== "sold" && vehicle.lifecycleStatus !== "archived")
        .slice(0, 4)
        .map((vehicle) => ({ id: vehicle.id, title: vehicle.title, meta: `${vehicle.daysInStock} days in stock`, category: "above-market" })),
    },
    {
      id: "below-market",
      label: "Ready to Publish",
      availability: "live",
      items: vehicles
        .filter((vehicle) => vehicle.lifecycleStatus === "ready-to-publish")
        .slice(0, 4)
        .map((vehicle) => ({ id: vehicle.id, title: vehicle.title, meta: `Quality ${vehicle.listingQualityScore}/100 and publishable`, category: "below-market" })),
    },
    {
      id: "expiring",
      label: "Expiring Listings",
      availability: "coming-soon",
      message: "Featured listing expiry telemetry is not available yet.",
      items: [],
    },
  ];

  const attentionVehicles = vehicles
    .filter((vehicle) => vehicle.requiresAttention)
    .sort((a, b) => a.listingQualityScore - b.listingQualityScore)
    .slice(0, 3);

  const attentionWorkspaces = await Promise.all(
    attentionVehicles.map((vehicle) => getVehicleWorkspace(dealershipId, vehicle.id, accessToken).catch(() => null)),
  );

  const recommendationPool = attentionWorkspaces
    .flatMap((workspace) => workspace?.recommendations ?? [])
    .slice(0, 6);

  const aiInsights: DashboardAiInsight[] = [
    {
      id: "priority-leads",
      message: openLeadCount > 0
        ? `${openLeadCount} open enquir${openLeadCount === 1 ? "y needs" : "ies need"} dealer action right now.`
        : "No open enquiries right now. Focus on inventory quality and publish-ready stock.",
      priority: toPriority(openLeadCount),
    },
    {
      id: "missing-photos",
      message: missingPhotosCount > 0
        ? `${missingPhotosCount} listing${missingPhotosCount === 1 ? " is" : "s are"} missing photo depth and need attention.`
        : "All active listings currently meet the photo threshold.",
      priority: toPriority(missingPhotosCount),
    },
    {
      id: "price-review",
      message: priceReviewCount > 0
        ? `${priceReviewCount} vehicle${priceReviewCount === 1 ? " needs" : "s need"} pricing review based on stock ageing.`
        : "No immediate stock-age pricing risks detected.",
      priority: toPriority(priceReviewCount),
    },
    ...recommendationPool.map((recommendation, index) => ({
      id: `rec-${index}`,
      message: recommendation.label,
      priority: index < 2 ? "high" as const : "medium" as const,
    })),
  ].slice(0, 6);

  const tasks: DashboardTask[] = [
    ...(openLeadCount > 0 ? [{ id: "task-leads", label: `Work ${openLeadCount} open enquir${openLeadCount === 1 ? "y" : "ies"}`, completed: false, priority: "high" as const }] : []),
    ...(missingPhotosCount > 0 ? [{ id: "task-photos", label: `Complete photos for ${missingPhotosCount} listing${missingPhotosCount === 1 ? "" : "s"}`, completed: false, priority: "high" as const }] : []),
    ...(missingInfoCount > 0 ? [{ id: "task-copy", label: `Complete copy and SEO for ${missingInfoCount} listing${missingInfoCount === 1 ? "" : "s"}`, completed: false, priority: "medium" as const }] : []),
    ...(readyToPublishCount > 0 ? [{ id: "task-publish", label: `Publish ${readyToPublishCount} ready listing${readyToPublishCount === 1 ? "" : "s"}`, completed: false, priority: "medium" as const }] : []),
    ...(priceReviewCount > 0 ? [{ id: "task-pricing", label: `Review pricing for ${priceReviewCount} aged listing${priceReviewCount === 1 ? "" : "s"}`, completed: false, priority: "medium" as const }] : []),
  ].slice(0, 6);

  const marketplaceRecommendations = [
    ...(missingPhotosCount > 0 ? [`Add missing photos to ${missingPhotosCount} listing${missingPhotosCount === 1 ? "" : "s"} to improve marketplace readiness.`] : []),
    ...(readyToPublishCount > 0 ? [`${readyToPublishCount} listing${readyToPublishCount === 1 ? " is" : "s are"} ready to publish right now.`] : []),
    ...(priceReviewCount > 0 ? [`Review price positioning for ${priceReviewCount} long-stock vehicle${priceReviewCount === 1 ? "" : "s"}.`] : []),
  ].slice(0, 5);

  const activities: DashboardActivity[] = history.slice(0, 8).map((entry) => ({
    id: entry.id,
    message: entry.message,
    timestamp: formatRelativeTimestamp(entry.createdAt),
    type: entry.eventType.includes("lead") ? "lead" : entry.eventType.includes("price") ? "price" : entry.eventType.includes("publish") ? "publish" : "status",
  }));

  const kpis: DashboardKpi[] = [
    { id: "total", label: "Total Vehicles", value: formatNumber(inventoryDashboard.stats.totalInventory), explanation: "All non-deleted inventory records", icon: "Car", trend: { direction: "neutral", label: "Live" } },
    { id: "draft", label: "Draft Listings", value: formatNumber(inventoryDashboard.stats.draftListings), explanation: "Listings still in draft state", icon: "FileText", trend: { direction: "neutral", label: "Live" } },
    { id: "ready", label: "Ready To Publish", value: formatNumber(readyToPublishCount), explanation: "Listings that can go live now", icon: "Sparkles", trend: { direction: readyToPublishCount > 0 ? "up" : "neutral", label: `${readyToPublishCount} awaiting publish` } },
    { id: "published", label: "Published", value: formatNumber(inventoryDashboard.stats.publishedListings), explanation: "Marketplace-visible live listings", icon: "Eye", trend: { direction: publishedToday > 0 ? "up" : "neutral", label: `${publishedToday} today` } },
    { id: "reserved", label: "Reserved", value: formatNumber(vehicles.filter((vehicle) => vehicle.lifecycleStatus === "reserved").length), explanation: "Live listings currently reserved", icon: "Calendar", trend: { direction: "neutral", label: "Live" } },
    { id: "sold", label: "Sold", value: formatNumber(inventoryDashboard.stats.soldVehicles), explanation: "Completed sold lifecycle records", icon: "CheckCircle2", trend: { direction: soldThisMonth > 0 ? "up" : "neutral", label: `${soldThisMonth} in 30d` } },
    { id: "archived", label: "Archived", value: formatNumber(inventoryDashboard.stats.archivedVehicles), explanation: "Archived but restorable listings", icon: "Archive", trend: { direction: "neutral", label: "Live" } },
    { id: "published-today", label: "Published Today", value: formatNumber(publishedToday), explanation: "Publish events recorded since midnight", icon: "TrendingUp", trend: { direction: publishedToday > 0 ? "up" : "neutral", label: "Live" } },
    { id: "published-week", label: "Published This Week", value: formatNumber(publishedThisWeek), explanation: "Publish events recorded this week", icon: "BarChart3", trend: { direction: publishedThisWeek > 0 ? "up" : "neutral", label: "Live" } },
    { id: "quality", label: "Average Listing Quality", value: avgQuality === null ? "0" : `${Math.round(avgQuality)}`, explanation: "Average quality score across inventory", icon: "Gauge", trend: { direction: avgQuality !== null && avgQuality >= 80 ? "up" : "neutral", label: `${vehicles.length} listings scored` } },
    { id: "completion", label: "Listing Completion Rate", value: formatPercentage(completionRate), explanation: "Listings meeting copy, SEO, and photo completeness", icon: "BadgeCheck", trend: { direction: completionRate >= 80 ? "up" : "neutral", label: "Live" } },
    { id: "health", label: "Inventory Health Score", value: formatPercentage(inventoryHealth), explanation: "Share of listings not currently requiring attention", icon: "HeartPulse", trend: { direction: inventoryHealth >= 70 ? "up" : "neutral", label: `${inventoryDashboard.stats.requiringAttention} need attention` } },
  ];

  const health: DashboardHealthMetric[] = [
    { id: "enquiries", label: "Enquiries Today", value: formatNumber(recentLeadCount), status: recentLeadCount > 0 ? "good" : "neutral", availability: "live" },
    { id: "test-drives", label: "Test Drive Requests", value: formatNumber(testDriveCount), status: testDriveCount > 0 ? "good" : "neutral", availability: "live" },
    { id: "finance", label: "Finance Requests", value: formatNumber(financeCount), status: financeCount > 0 ? "good" : "neutral", availability: "live" },
    { id: "conversion", label: "Conversion Rate (30d)", value: formatPercentage(conversionRate), status: conversionRate !== null && conversionRate >= 10 ? "good" : "neutral", availability: conversionRate === null ? "coming-soon" : "live" },
    { id: "response-time", label: "Lead Response Time", value: "Coming Soon", status: "neutral", availability: "coming-soon" },
    { id: "featured", label: "Featured Listings", value: formatNumber(featuredListings), status: featuredListings > 0 ? "good" : "neutral", availability: "live" },
  ];

  const marketAverageDaysToSell = marketDashboard?.metrics.find((metric) => metric.id === "average-days-to-sell")?.displayValue ?? "Coming Soon";

  return {
    dealer: {
      name: dealership?.tradingName ?? dealership?.businessName ?? "Dealer Dashboard",
      subscription: dealership?.subscriptionPackage ?? "Coming Soon",
      profileCompletion: calculateProfileCompletion(dealership),
      lastLogin: "Coming Soon",
    },
    kpis,
    aiInsights,
    leads: recentLeads,
    inventory: categories,
    tasks,
    quickActions: QUICK_ACTIONS,
    health,
    recommendations: [
      ...marketplaceRecommendations,
      ...(marketAverageDaysToSell !== "Coming Soon" ? [`Average days to sell is currently ${marketAverageDaysToSell}.`] : []),
    ].slice(0, 5),
    activities,
    charts: {
      views: buildComingSoonSeries("views", "Views", "Live listing view telemetry is not connected yet."),
      enquiries: {
        id: "enquiries",
        label: "Enquiries",
        values: buildWeeklySeries(leads.map((lead) => ({ createdAt: lead.createdAt })), 12),
        availability: "live",
      },
      conversions: {
        id: "conversions",
        label: "Conversions",
        values: buildWeeklySeries(
          history
            .filter((entry) => entry.eventType === "status-changed" && entry.message.includes(" to sold"))
            .map((entry) => ({ createdAt: entry.createdAt })),
          12,
        ),
        availability: "live",
      },
      inventoryGrowth: {
        id: "inventory-growth",
        label: "Inventory Growth",
        values: buildCumulativeMonthlySeries(activeStoreVehicles.map((vehicle) => ({ createdAt: vehicle.createdAt })), 12),
        availability: "live",
      },
      leadSources: [{ label: "Coming Soon", value: 0, availability: "coming-soon", message: "Live lead-source attribution is not connected yet." }],
      dailyTraffic: buildComingSoonSeries("daily-traffic", "Daily Traffic", "Live traffic telemetry is not connected yet."),
      monthlySales: {
        id: "monthly-sales",
        label: "Monthly Sales",
        values: buildMonthlySeries(
          history
            .filter((entry) => entry.eventType === "status-changed" && entry.message.includes(" to sold"))
            .map((entry) => ({ createdAt: entry.createdAt })),
          12,
        ),
        availability: "live",
      },
    },
  };
}