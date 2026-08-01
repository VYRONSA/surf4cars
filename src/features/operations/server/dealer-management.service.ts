import { readPlatformStore } from "@/lib/local-persistence/platform-store";
import { getVehicleEngine } from "@/services/vehicle-engine/vehicle-engine.service";
import type {
  DealerApplicationItem,
  DealerHealthRow,
  DealerManagementData,
  DealerManagementSummaryCard,
  DealerOperationsBranchRow,
  DealerOperationsDealershipRow,
  DealerOperationsUserRow,
  DealerPerformanceRow,
  DealerTimelineEvent,
} from "@/features/operations/types/dealer-management.types";

function formatRelative(isoTimestamp: string): string {
  const value = Date.parse(isoTimestamp);
  if (!Number.isFinite(value)) return "Unknown time";

  const minutes = Math.max(0, Math.floor((Date.now() - value) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function parseLifecycleStatus(raw: string): DealerApplicationItem["status"] {
  if (raw === "completed") return "approved";
  if (raw === "pending") return "pending";
  if (raw === "under-review") return "under-review";
  if (raw === "rejected") return "rejected";
  if (raw === "verification-required") return "verification-required";
  return "coming-soon";
}

function toLifecycleLabel(raw: string): string {
  if (raw === "completed") return "approved";
  if (raw === "pending") return "pending";
  if (raw === "under-review") return "under-review";
  if (raw === "rejected") return "rejected";
  if (raw === "verification-required") return "verification-required";
  return "coming-soon";
}

function profileCompleteness(dealer: {
  readonly tradingName: string;
  readonly registrationNumber: string | null;
  readonly vatNumber: string | null;
  readonly telephone: string | null;
  readonly email: string | null;
  readonly city: string;
  readonly province: string;
}): number {
  const checks = [
    Boolean(dealer.tradingName.trim()),
    Boolean(dealer.registrationNumber?.trim()),
    Boolean(dealer.vatNumber?.trim()),
    Boolean(dealer.telephone?.trim()),
    Boolean(dealer.email?.trim()),
    Boolean(dealer.city.trim()),
    Boolean(dealer.province.trim()),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function asRisk(score: number): DealerHealthRow["risk"] {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  return "high";
}

export async function getDealerManagementData(): Promise<DealerManagementData> {
  const generatedAt = new Date().toISOString();
  const store = await readPlatformStore();
  const vehicleEngine = getVehicleEngine();
  const vehicles = await vehicleEngine.listAll().catch(() => []);

  const dealershipById = new Map(store.dealerships.map((item) => [item.id, item]));
  const branchesByDealer = new Map<string, number>();
  const usersByDealer = new Map<string, number>();

  for (const branch of store.branches) {
    branchesByDealer.set(branch.dealershipId, (branchesByDealer.get(branch.dealershipId) ?? 0) + 1);
  }

  for (const membership of store.staffMemberships) {
    usersByDealer.set(membership.dealershipId, (usersByDealer.get(membership.dealershipId) ?? 0) + 1);
  }

  const applications: DealerApplicationItem[] = store.dealerships.map((dealer) => {
    const status = parseLifecycleStatus(dealer.onboardingStatus);
    return {
      dealershipId: dealer.id,
      dealershipName: dealer.tradingName,
      ownerUserId: dealer.ownerUserId,
      status,
      submittedAt: dealer.createdAt,
      branchCount: branchesByDealer.get(dealer.id) ?? 0,
      note: status === "approved"
        ? "Approved dealership from onboarding pipeline."
        : "Detailed application workflow states will activate when review queues are connected.",
      timelineHint: status === "approved"
        ? "Approval event available through existing onboarding completion trail."
        : "Extended approval history is coming soon.",
    };
  }).sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));

  const approvedDealers = applications.filter((item) => item.status === "approved").length;
  const pendingApplications = applications.filter((item) => item.status === "pending" || item.status === "under-review").length;
  const suspendedDealers = store.dealerships.filter((item) => item.onboardingStatus === "suspended").length;
  const totalBranches = store.branches.length;
  const totalUsers = store.staffMemberships.length;

  const dealerHealthRows: DealerHealthRow[] = store.dealerships.map((dealer) => {
    const profileScore = profileCompleteness(dealer);
    const branchCount = branchesByDealer.get(dealer.id) ?? 0;
    const userCount = usersByDealer.get(dealer.id) ?? 0;

    const branchScore = branchCount > 0 ? 100 : 40;
    const userScore = userCount > 0 ? 100 : 50;
    const healthScore = Math.round((profileScore * 0.6) + (branchScore * 0.2) + (userScore * 0.2));

    const missingInformation: string[] = [];
    if (!dealer.vatNumber?.trim()) missingInformation.push("VAT number");
    if (!dealer.registrationNumber?.trim()) missingInformation.push("Registration number");
    if (!dealer.telephone?.trim()) missingInformation.push("Primary contact number");

    const outstandingTasks: string[] = [];
    if (branchCount === 0) outstandingTasks.push("Create first branch");
    if (userCount === 0) outstandingTasks.push("Invite dealer team users");
    if (!dealer.subscriptionPackage) outstandingTasks.push("Assign subscription package");

    return {
      dealershipId: dealer.id,
      dealershipName: dealer.tradingName,
      healthScore,
      risk: asRisk(healthScore),
      missingInformation,
      outstandingTasks,
    };
  });

  const healthyCount = dealerHealthRows.filter((row) => row.healthScore >= 80).length;
  const warningCount = dealerHealthRows.filter((row) => row.healthScore >= 60 && row.healthScore < 80).length;
  const riskCount = dealerHealthRows.filter((row) => row.healthScore < 60).length;

  const summaryCards: DealerManagementSummaryCard[] = [
    {
      id: "pending-applications",
      label: "Pending Applications",
      value: pendingApplications.toLocaleString("en-ZA"),
      detail: "Dealership applications that still require operational decisioning.",
      availability: "live",
    },
    {
      id: "approved-dealers",
      label: "Approved Dealers",
      value: approvedDealers.toLocaleString("en-ZA"),
      detail: "Dealerships with completed onboarding status.",
      availability: "live",
    },
    {
      id: "suspended-dealers",
      label: "Suspended Dealers",
      value: suspendedDealers.toLocaleString("en-ZA"),
      detail: suspendedDealers > 0
        ? "Derived from dealership lifecycle state."
        : "No dealerships are currently marked suspended.",
      availability: "live",
    },
    {
      id: "total-branches",
      label: "Total Branches",
      value: totalBranches.toLocaleString("en-ZA"),
      detail: "Total registered dealership branches across the platform.",
      availability: "live",
    },
    {
      id: "total-users",
      label: "Total Users",
      value: totalUsers.toLocaleString("en-ZA"),
      detail: "Dealer membership records from team management service.",
      availability: "live",
    },
    {
      id: "monthly-revenue",
      label: "Monthly Revenue",
      value: "Coming Soon",
      detail: "Billing and revenue ledger integration is not connected yet.",
      availability: "coming-soon",
    },
    {
      id: "health-distribution",
      label: "Dealer Health Distribution",
      value: `${healthyCount}/${warningCount}/${riskCount}`,
      detail: "Healthy / Watch / At-Risk distribution from profile completeness and staffing coverage.",
      availability: "live",
    },
  ];

  const dealerships: DealerOperationsDealershipRow[] = store.dealerships.map((dealer) => {
    const health = dealerHealthRows.find((item) => item.dealershipId === dealer.id)?.healthScore ?? null;
    return {
      id: dealer.id,
      tradingName: dealer.tradingName,
      registrationNumber: dealer.registrationNumber,
      vatNumber: dealer.vatNumber,
      city: dealer.city,
      province: dealer.province,
      status: dealer.onboardingStatus,
      lifecycle: toLifecycleLabel(dealer.onboardingStatus),
      subscription: dealer.subscriptionPackage ?? "Coming Soon",
      branchCount: branchesByDealer.get(dealer.id) ?? 0,
      userCount: usersByDealer.get(dealer.id) ?? 0,
      healthScore: health,
    };
  }).sort((a, b) => a.tradingName.localeCompare(b.tradingName));

  const branches: DealerOperationsBranchRow[] = store.branches.map((branch) => {
    const dealer = dealershipById.get(branch.dealershipId);
    const inventoryCount = store.inventoryVehicles.filter((vehicle) => vehicle.branchId === branch.id && vehicle.lifecycleStatus !== "deleted").length;
    const userCount = store.staffMemberships.filter((membership) => membership.branchId === branch.id).length;

    return {
      id: branch.id,
      dealershipId: branch.dealershipId,
      dealershipName: dealer?.tradingName ?? "Unknown dealership",
      name: branch.name,
      city: branch.city,
      province: branch.province,
      manager: branch.branchManager,
      userCount,
      inventoryCount,
    };
  }).sort((a, b) => a.dealershipName.localeCompare(b.dealershipName));

  const users: DealerOperationsUserRow[] = store.staffMemberships.map((membership) => ({
    id: membership.id,
    dealershipId: membership.dealershipId,
    dealershipName: dealershipById.get(membership.dealershipId)?.tradingName ?? "Unknown dealership",
    fullName: membership.fullName,
    email: membership.email,
    roleId: membership.roleId,
    status: membership.status,
    permissionsCount: membership.permissions.length,
    invitedAt: membership.invitedAt,
  })).sort((a, b) => Date.parse(b.invitedAt) - Date.parse(a.invitedAt));

  const performance: DealerPerformanceRow[] = store.dealerships.map((dealer) => {
    const dealershipVehicles = vehicles.filter((vehicle) => vehicle.tenantId === dealer.id);
    const dealershipInventory = store.inventoryVehicles.filter((vehicle) => vehicle.dealershipId === dealer.id);
    const dealershipLeads = store.leads.filter((lead) => lead.dealershipId === dealer.id);

    const sold = dealershipInventory.filter((vehicle) => vehicle.lifecycleStatus === "sold").length;
    const reserved = dealershipInventory.filter((vehicle) => vehicle.lifecycleStatus === "reserved").length;
    const published = dealershipInventory.filter((vehicle) => vehicle.lifecycleStatus === "published").length;

    const conversion = dealershipLeads.length === 0
      ? "Coming Soon"
      : `${Math.round((sold / dealershipLeads.length) * 100)}%`;

    const qualityReady = dealershipInventory.filter((vehicle) => vehicle.description && vehicle.seoTitle && vehicle.seoDescription).length;
    const inventoryQuality = dealershipInventory.length === 0
      ? "Coming Soon"
      : `${Math.round((qualityReady / dealershipInventory.length) * 100)}%`;

    return {
      dealershipId: dealer.id,
      dealershipName: dealer.tradingName,
      vehicles: dealershipVehicles.length,
      published,
      sold,
      reserved,
      leads: dealershipLeads.length,
      conversion,
      responseTime: "Coming Soon",
      inventoryQuality,
      aiScore: "Coming Soon",
    };
  });

  const timelineEvents: DealerTimelineEvent[] = [
    ...store.marketAnalyticsEvents.map((event) => ({
      id: event.id,
      timestamp: event.eventTimestamp,
      title: event.eventName,
      source: event.source,
      dealershipId: event.dealershipId,
    })),
    ...store.inventoryAudit.map((event) => ({
      id: event.id,
      timestamp: event.createdAt,
      title: event.action,
      source: "inventory-audit",
      dealershipId: event.dealershipId,
    })),
  ]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 60);

  const recentDealerActivity = timelineEvents.slice(0, 10).map((event) => ({
    ...event,
    timestamp: formatRelative(event.timestamp),
  }));

  const recentApplications = applications.slice(0, 8).map((application) => ({
    ...application,
    submittedAt: formatRelative(application.submittedAt),
  }));

  const aiRecommendations: string[] = [];
  const dealersWithoutSubscription = store.dealerships.filter((dealer) => !dealer.subscriptionPackage).length;
  if (dealersWithoutSubscription > 0) {
    aiRecommendations.push(`${dealersWithoutSubscription} dealerships still need subscription package assignment.`);
  }

  const riskyDealers = dealerHealthRows.filter((row) => row.risk === "high").length;
  if (riskyDealers > 0) {
    aiRecommendations.push(`${riskyDealers} dealerships are currently marked at-risk by health scoring.`);
  }

  if (aiRecommendations.length === 0) {
    aiRecommendations.push("Health and subscription recommendations are stable. Advanced AI recommendations are coming soon.");
  }

  return {
    generatedAt,
    summaryCards,
    recentDealerActivity,
    recentApplications,
    aiRecommendations,
    platformAlerts: [
      "Applications verification workflow currently uses onboarding lifecycle states only.",
      "Billing and contracts telemetry is pending integration with Revenue Centre.",
    ],
    applications,
    dealerships,
    branches,
    users,
    performance,
    health: dealerHealthRows,
    timeline: timelineEvents,
    notesAvailability: "coming-soon",
    documentsAvailability: "coming-soon",
    contractsAvailability: "coming-soon",
    subscriptionsAvailability: "partial",
    billingAvailability: "coming-soon",
  };
}
