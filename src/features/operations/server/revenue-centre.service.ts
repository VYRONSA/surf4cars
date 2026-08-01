import type { RevenueCentreSectionId } from "@/features/operations/config/revenue-centre-sections";
import { listAllDealerEnquiries } from "@/features/enquiries/server/dealer-enquiry.service";
import { getDealerManagementData } from "@/features/operations/server/dealer-management.service";
import { getMarketplaceControlWorkspaceData } from "@/features/operations/server/marketplace-control.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";
import type {
  RevenueCentreActionInput,
  RevenueCentreWorkspaceData,
  SubscriptionRow,
} from "@/features/operations/types/revenue-centre.types";

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

function growthRate(current: number, previous: number): string {
  if (previous <= 0) return "Coming Soon";
  const value = Math.round(((current - previous) / previous) * 100);
  return `${value >= 0 ? "+" : ""}${value}%`;
}

function stream(id: string, label: string, status: "live" | "coming-soon", value: string, detail: string) {
  return {
    id,
    stream: label,
    status,
    value,
    detail,
  };
}

function permissionForAction(action: RevenueCentreActionInput["action"]): "operations:export" | "operations:approve" | "operations:manage" {
  if (action === "export") return "operations:export";
  if (action === "approve") return "operations:approve";
  return "operations:manage";
}

export async function getRevenueCentreWorkspaceData(sectionId: RevenueCentreSectionId): Promise<RevenueCentreWorkspaceData> {
  const generatedAt = new Date().toISOString();
  const store = await readPlatformStore();
  const [dealerManagement, marketplaceControl, enquiries] = await Promise.all([
    getDealerManagementData().catch(() => null),
    getMarketplaceControlWorkspaceData("overview").catch(() => null),
    listAllDealerEnquiries().catch(() => []),
  ]);

  const dealerships = store.dealerships;
  const activeSubscribers = dealerships.filter((item) => Boolean(item.subscriptionPackage)).length;
  const trialDealers = dealerships.filter((item) => (item.subscriptionPackage ?? "").toLowerCase().includes("trial")).length;
  const payingDealers = activeSubscribers - trialDealers;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const previousStart = new Date(startOfMonth);
  previousStart.setMonth(previousStart.getMonth() - 1);

  const newDealersThisMonth = dealerships.filter((item) => Date.parse(item.createdAt) >= startOfMonth.getTime()).length;
  const newDealersPreviousMonth = dealerships.filter((item) => {
    const created = Date.parse(item.createdAt);
    return created >= previousStart.getTime() && created < startOfMonth.getTime();
  }).length;

  const packageCounts = new Map<string, number>();
  for (const dealer of dealerships) {
    const pkg = dealer.subscriptionPackage ?? "Coming Soon";
    packageCounts.set(pkg, (packageCounts.get(pkg) ?? 0) + 1);
  }

  const subscriptions: SubscriptionRow[] = [...packageCounts.entries()]
    .map(([packageId, dealerCount]) => {
      const availability: SubscriptionRow["availability"] = packageId === "Coming Soon" ? "coming-soon" : "live";

      return {
        packageId,
        packageLabel: packageId,
        dealerCount,
        renewals: "Coming Soon",
        expiries: "Coming Soon",
        upgrades: "Coming Soon",
        downgrades: "Coming Soon",
        cancelled: "Coming Soon",
        trials: packageId.toLowerCase().includes("trial") ? dealerCount : 0,
        revenueByPackage: "Coming Soon",
        availability,
      };
    })
    .sort((a, b) => b.dealerCount - a.dealerCount);

  const financeRequests = enquiries.filter((item) => item.enquiryType === "finance").length;
  const featuredListings = store.inventoryVehicles.filter((item) => item.lifecycleStatus === "published" || item.lifecycleStatus === "reserved").length;

  const revenueStreams = [
    stream(
      "subscriptions",
      "Subscriptions",
      subscriptions.some((item) => item.availability === "live") ? "live" : "coming-soon",
      activeSubscribers.toLocaleString("en-ZA"),
      "Live subscriber count from dealer subscription package assignments.",
    ),
    stream(
      "featured-listings",
      "Featured Listings",
      "live",
      featuredListings.toLocaleString("en-ZA"),
      "Live featured-capable listing volume from inventory lifecycle visibility.",
    ),
    stream(
      "advertising",
      "Advertising",
      "coming-soon",
      "Coming Soon",
      "Advertising billing ledger is not connected yet.",
    ),
    stream(
      "finance-commission",
      "Finance Commission",
      financeRequests > 0 ? "live" : "coming-soon",
      financeRequests.toLocaleString("en-ZA"),
      "Live finance request volume from enquiries. Commission settlement is Coming Soon.",
    ),
    stream("insurance-commission", "Insurance Commission", "coming-soon", "Coming Soon", "Insurance commission feeds are not connected yet."),
    stream("warranty-commission", "Warranty Commission", "coming-soon", "Coming Soon", "Warranty commission feeds are not connected yet."),
    stream("partner-revenue", "Partner Revenue", "coming-soon", "Coming Soon", "Partner payout and revenue feeds are not connected yet."),
    stream("affiliate-revenue", "Affiliate Revenue", "coming-soon", "Coming Soon", "Affiliate attribution and payout feeds are not connected yet."),
    stream("marketplace-services", "Marketplace Services", "coming-soon", "Coming Soon", "Marketplace services monetization ledger is not connected yet."),
  ];

  const dealerRevenue = dealerships.map((dealer) => {
    const performance = dealerManagement?.performance.find((item) => item.dealershipId === dealer.id);
    const health = dealerManagement?.health.find((item) => item.dealershipId === dealer.id);

    return {
      dealershipId: dealer.id,
      dealershipName: dealer.tradingName,
      packageLabel: dealer.subscriptionPackage ?? "Coming Soon",
      spend: "Coming Soon",
      invoices: "Coming Soon",
      outstanding: "Coming Soon",
      revenueTrend: performance?.conversion ?? "Coming Soon",
      growth: "Coming Soon",
      health: health ? `${health.healthScore} (${health.risk})` : "Coming Soon",
    };
  });

  const timeline = [
    ...store.marketAnalyticsEvents
      .filter((event) => event.source === "operations-revenue-centre" || event.eventName.includes("subscription") || event.eventName.includes("listing") || event.eventName.includes("finance"))
      .map((event) => ({
        id: event.id,
        eventName: event.eventName,
        source: event.source,
        actorType: event.actorType,
        detail: typeof event.payload.note === "string" ? event.payload.note : event.eventName,
        createdAt: event.eventTimestamp,
      })),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 140);

  const audit = store.marketAnalyticsEvents
    .filter((event) => event.source === "operations-revenue-centre")
    .map((event) => ({
      id: event.id,
      action: event.eventName,
      source: event.source,
      actorType: event.actorType,
      createdAt: event.eventTimestamp,
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 180);

  const streamCountLive = revenueStreams.filter((item) => item.status === "live").length;

  return {
    generatedAt,
    sectionId,
    summaryCards: [
      { id: "mrr", label: "Monthly Recurring Revenue", value: "Coming Soon", detail: "Subscription billing amounts are not connected yet.", availability: "coming-soon" },
      { id: "arr", label: "Annual Recurring Revenue", value: "Coming Soon", detail: "Annualized recurring ledger is not connected yet.", availability: "coming-soon" },
      { id: "active-subscribers", label: "Active Subscribers", value: activeSubscribers.toLocaleString("en-ZA"), detail: "Live from active dealer subscription package assignments.", availability: "live" },
      { id: "trial-dealers", label: "Trial Dealers", value: trialDealers.toLocaleString("en-ZA"), detail: "Live from subscription package labels containing trial.", availability: "live" },
      { id: "paying-dealers", label: "Paying Dealers", value: Math.max(0, payingDealers).toLocaleString("en-ZA"), detail: "Live active subscribers excluding trial package labels.", availability: "live" },
      { id: "revenue-today", label: "Revenue Today", value: "Coming Soon", detail: "Payment capture data is not connected yet.", availability: "coming-soon" },
      { id: "revenue-month", label: "Revenue This Month", value: "Coming Soon", detail: "Monthly recognized revenue ledger is not connected yet.", availability: "coming-soon" },
      { id: "revenue-year", label: "Revenue This Year", value: "Coming Soon", detail: "Annual recognized revenue ledger is not connected yet.", availability: "coming-soon" },
      { id: "arpd", label: "Average Revenue Per Dealer", value: "Coming Soon", detail: "Requires live dealer revenue ledger integration.", availability: "coming-soon" },
      { id: "clv", label: "Customer Lifetime Value", value: "Coming Soon", detail: "Requires historical billing and retention data.", availability: "coming-soon" },
      { id: "outstanding", label: "Outstanding Revenue", value: "Coming Soon", detail: "Invoice and collections systems are not connected yet.", availability: "coming-soon" },
      { id: "forecast", label: "Revenue Forecast", value: "Coming Soon", detail: "Forecasting framework is ready; financial projections await live feeds.", availability: "coming-soon" },
      { id: "growth", label: "Platform Growth", value: growthRate(newDealersThisMonth, newDealersPreviousMonth), detail: "Live dealer onboarding growth trend month-over-month.", availability: newDealersPreviousMonth > 0 ? "live" : "coming-soon" },
    ],
    subscriptions,
    revenueStreams,
    dealerRevenue,
    outstandingRevenue: {
      outstandingInvoices: "Coming Soon",
      overdueSubscriptions: "Coming Soon",
      pendingPayments: "Coming Soon",
      collections: "Coming Soon",
      paymentStatus: "Coming Soon",
      availability: "coming-soon",
    },
    forecasting: [
      { id: "monthly", label: "Monthly Revenue", value: "Coming Soon", detail: "Awaiting live recurring and transactional revenue feeds.", availability: "coming-soon" },
      { id: "quarterly", label: "Quarterly Revenue", value: "Coming Soon", detail: "Awaiting live recurring and transactional revenue feeds.", availability: "coming-soon" },
      { id: "annual", label: "Annual Revenue", value: "Coming Soon", detail: "Awaiting live recurring and transactional revenue feeds.", availability: "coming-soon" },
      { id: "growth", label: "Growth", value: growthRate(newDealersThisMonth, newDealersPreviousMonth), detail: "Dealer onboarding growth reused as interim expansion indicator.", availability: newDealersPreviousMonth > 0 ? "live" : "coming-soon" },
      { id: "churn", label: "Churn", value: "Coming Soon", detail: "Subscription churn feed not connected.", availability: "coming-soon" },
      { id: "expansion", label: "Expansion", value: streamCountLive.toLocaleString("en-ZA"), detail: "Live count of active/partially active revenue stream integrations.", availability: "live" },
    ],
    trends: [
      { id: "new-dealers-month", label: "New Dealers This Month", value: newDealersThisMonth.toLocaleString("en-ZA"), detail: "Live onboarding growth signal.", availability: "live" },
      { id: "new-dealers-prev", label: "New Dealers Previous Month", value: newDealersPreviousMonth.toLocaleString("en-ZA"), detail: "Comparison baseline for growth.", availability: "live" },
      { id: "stream-coverage", label: "Active Revenue Stream Coverage", value: `${streamCountLive}/${revenueStreams.length}`, detail: "Live vs future stream integration readiness.", availability: "live" },
      { id: "finance-demand", label: "Finance Demand", value: financeRequests.toLocaleString("en-ZA"), detail: "Live finance request volume through applications/enquiries.", availability: financeRequests > 0 ? "live" : "coming-soon" },
    ],
    reports: [
      { id: "exec-snapshot", name: "Executive Revenue Snapshot", status: "ready", detail: "Built from current revenue centre aggregated signals and export framework." },
      { id: "dealer-revenue-report", name: "Dealer Revenue Distribution", status: "ready", detail: "Dealer package and revenue readiness view." },
      { id: "collections-report", name: "Outstanding Collections Report", status: "coming-soon", detail: "Requires invoice/payment status integrations." },
      { id: "commissions-report", name: "Commission Streams Report", status: "coming-soon", detail: "Requires finance/insurance/warranty/partner commission settlement feeds." },
    ],
    timeline,
    audit,
    sourceReadiness: [
      { id: "dealer-subscriptions", label: "Dealer Subscriptions and Packages", mode: "live", detail: "Live package assignment data from dealer lifecycle and onboarding records." },
      { id: "applications-finance", label: "Applications and Finance Requests", mode: "live", detail: "Finance request volume from enquiries and Applications Centre composition." },
      { id: "marketplace-activity", label: "Marketplace Activity", mode: marketplaceControl ? "live" : "manual", detail: "Marketplace lifecycle and quality activity reused from Marketplace Control." },
      { id: "billing-ledger", label: "Billing, Invoices, Payments, Commissions", mode: "coming-soon", detail: "No live billing/collections ledger is implemented yet." },
    ],
  };
}

export async function applyRevenueCentreAction(input: RevenueCentreActionInput): Promise<void> {
  const store = await readPlatformStore();
  const dealershipId = store.dealerships[0]?.id;
  if (!dealershipId) {
    throw new Error("No dealership context available for audit logging.");
  }

  await logOperationsAuditEvent({
    dealershipId,
    eventName: `operations.revenue-centre.${input.action}`,
    source: "operations-revenue-centre",
    payload: {
      action: input.action,
      referenceId: input.referenceId ?? null,
      note: input.note ?? null,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      permission: permissionForAction(input.action),
    },
  }).catch(() => undefined);
}

export function revenueTimestampLabel(data: RevenueCentreWorkspaceData): string {
  return rel(data.generatedAt);
}
