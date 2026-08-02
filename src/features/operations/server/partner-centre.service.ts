import type { PartnerCentreSectionId } from "@/features/operations/config/partner-centre-sections";
import { getDealerIntelligenceWorkspaceData } from "@/features/operations/server/dealer-intelligence.service";
import { getDealerManagementData } from "@/features/operations/server/dealer-management.service";
import { getMarketplaceControlWorkspaceData } from "@/features/operations/server/marketplace-control.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import { getApplicationsCentreWorkspaceData } from "@/features/operations/server/applications-centre.service";
import { getRevenueCentreWorkspaceData } from "@/features/operations/server/revenue-centre.service";
import type {
  PartnerCategory,
  PartnerCentreActionInput,
  PartnerCentreWorkspaceData,
  PartnerDirectoryRow,
  PartnerMetric,
  PartnerProfile,
  PartnerStatus,
  PartnerTimelineItem,
} from "@/features/operations/types/partner-centre.types";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";

interface PartnerBlueprint {
  readonly id: string;
  readonly name: string;
  readonly category: PartnerCategory;
  readonly defaultStatus: PartnerStatus;
  readonly businessProfile: string;
  readonly products: readonly string[];
  readonly services: readonly string[];
  readonly coverageAreas: readonly string[];
  readonly territories: readonly string[];
}

const PARTNER_BLUEPRINTS: readonly PartnerBlueprint[] = [
  {
    id: "finance-companies",
    name: "Finance Companies",
    category: "finance-companies",
    defaultStatus: "onboarding",
    businessProfile: "Finance relationships aligned to buyer enquiry demand and funding enablement.",
    products: ["Vehicle Finance", "Dealer Finance Programs"],
    services: ["Application Processing", "Funding Decisions", "Commission Framework"],
    coverageAreas: ["Finance"],
    territories: ["National"],
  },
  {
    id: "banks",
    name: "Banks",
    category: "banks",
    defaultStatus: "prospect",
    businessProfile: "Banking relationships for strategic credit, settlement, and growth support.",
    products: ["Retail Banking", "Commercial Banking"],
    services: ["Credit Facilities", "Settlement Framework"],
    coverageAreas: ["Treasury", "Commercial"],
    territories: ["National"],
  },
  {
    id: "insurance-providers",
    name: "Insurance Providers",
    category: "insurance-providers",
    defaultStatus: "prospect",
    businessProfile: "Insurance partner framework for future policy and commission integrations.",
    products: ["Comprehensive Cover", "Asset Protection"],
    services: ["Quote Framework", "Claims Workflow"],
    coverageAreas: ["Insurance"],
    territories: ["National"],
  },
  {
    id: "warranty-providers",
    name: "Warranty Providers",
    category: "warranty-providers",
    defaultStatus: "prospect",
    businessProfile: "Warranty partner framework for post-sale protection programs.",
    products: ["Vehicle Warranty", "Extended Cover"],
    services: ["Warranty Validation", "Warranty Claims"],
    coverageAreas: ["Warranty"],
    territories: ["National"],
  },
  {
    id: "inspection-companies",
    name: "Inspection Companies",
    category: "inspection-companies",
    defaultStatus: "onboarding",
    businessProfile: "Inspection service framework aligned to listing trust and quality pipelines.",
    products: ["Pre-Delivery Inspection", "Condition Reports"],
    services: ["Inspection Reports", "Compliance Checks"],
    coverageAreas: ["Inspection"],
    territories: ["National"],
  },
  {
    id: "roadside-assistance",
    name: "Roadside Assistance",
    category: "roadside-assistance",
    defaultStatus: "prospect",
    businessProfile: "Roadside assistance framework for buyer trust and aftercare programs.",
    products: ["Roadside Cover"],
    services: ["Emergency Response", "Towing"],
    coverageAreas: ["Aftercare"],
    territories: ["National"],
  },
  {
    id: "vehicle-valuation-partners",
    name: "Vehicle Valuation Partners",
    category: "vehicle-valuation-partners",
    defaultStatus: "prospect",
    businessProfile: "Valuation framework supporting trade-in and pricing intelligence workflows.",
    products: ["Market Valuation"],
    services: ["Trade-In Valuation", "Residual Value Benchmarks"],
    coverageAreas: ["Valuations"],
    territories: ["National"],
  },
  {
    id: "logistics-companies",
    name: "Logistics Companies",
    category: "logistics-companies",
    defaultStatus: "prospect",
    businessProfile: "Vehicle movement and delivery partner framework.",
    products: ["Vehicle Transport"],
    services: ["Collection and Delivery", "Fleet Logistics"],
    coverageAreas: ["Logistics"],
    territories: ["Regional"],
  },
  {
    id: "tracking-companies",
    name: "Tracking Companies",
    category: "tracking-companies",
    defaultStatus: "prospect",
    businessProfile: "Tracking and telemetry partner framework for risk and asset intelligence.",
    products: ["Asset Tracking", "Telematics"],
    services: ["Tracking Integrations", "Risk Monitoring"],
    coverageAreas: ["Tracking"],
    territories: ["National"],
  },
  {
    id: "oem-partners",
    name: "OEM Partners",
    category: "oem-partners",
    defaultStatus: "contacted",
    businessProfile: "OEM relationship framework for strategic growth programs and campaigns.",
    products: ["OEM Programs"],
    services: ["Co-Marketing", "Incentive Alignment"],
    coverageAreas: ["OEM"],
    territories: ["National"],
  },
  {
    id: "advertising-partners",
    name: "Advertising Partners",
    category: "advertising-partners",
    defaultStatus: "contacted",
    businessProfile: "Advertising partnership framework aligned to featured listing and audience growth.",
    products: ["Sponsored Placements", "Display Campaigns"],
    services: ["Campaign Delivery", "Attribution Framework"],
    coverageAreas: ["Marketing"],
    territories: ["National"],
  },
  {
    id: "strategic-partners",
    name: "Strategic Partners",
    category: "strategic-partners",
    defaultStatus: "negotiating",
    businessProfile: "Cross-functional strategic partner framework for long-term platform initiatives.",
    products: ["Strategic Collaboration"],
    services: ["Joint GTM", "Commercial Planning"],
    coverageAreas: ["Strategy"],
    territories: ["National"],
  },
] as const;

const CATEGORY_LABEL: Record<PartnerCategory, string> = {
  "finance-companies": "Finance Companies",
  banks: "Banks",
  "insurance-providers": "Insurance Providers",
  "warranty-providers": "Warranty Providers",
  "inspection-companies": "Inspection Companies",
  "roadside-assistance": "Roadside Assistance",
  "vehicle-valuation-partners": "Vehicle Valuation Partners",
  "logistics-companies": "Logistics Companies",
  "tracking-companies": "Tracking Companies",
  "oem-partners": "OEM Partners",
  "advertising-partners": "Advertising Partners",
  "strategic-partners": "Strategic Partners",
};

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

function asMetric(id: string, label: string, value: string, detail: string, availability: "live" | "unavailable"): PartnerMetric {
  return { id, label, value, detail, availability };
}

function countByStatus(items: readonly { readonly status: string }[], statuses: readonly string[]): number {
  const allowed = new Set(statuses);
  return items.filter((item) => allowed.has(item.status)).length;
}

function permissionForAction(action: PartnerCentreActionInput["action"]) {
  if (action === "create") return "operations:create" as const;
  if (action === "edit" || action === "add-note" || action === "change-status") return "operations:edit" as const;
  if (action === "approve") return "operations:approve" as const;
  if (action === "suspend") return "operations:suspend" as const;
  if (action === "restore") return "operations:restore" as const;
  if (action === "export") return "operations:export" as const;
  return "operations:manage" as const;
}

function mapEventType(eventName: string): PartnerTimelineItem["eventType"] {
  if (eventName.includes("status")) return "status-changed";
  if (eventName.includes("integration")) return "integration-changed";
  if (eventName.includes("performance")) return "performance-changed";
  if (eventName.includes("contacts")) return "contacts-changed";
  if (eventName.includes("product")) return "products-changed";
  if (eventName.includes("note")) return "note-added";
  if (eventName.includes("create")) return "created";
  if (eventName.includes("update") || eventName.includes("edit")) return "updated";
  return "audit";
}

export async function getPartnerCentreWorkspaceData(sectionId: PartnerCentreSectionId): Promise<PartnerCentreWorkspaceData> {
  const generatedAt = new Date().toISOString();
  const store = await readPlatformStore();

  const [applications, revenue, dealerManagement, dealerIntelligence, marketplace] = await Promise.all([
    getApplicationsCentreWorkspaceData().catch(() => null),
    getRevenueCentreWorkspaceData("overview").catch(() => null),
    getDealerManagementData().catch(() => null),
    getDealerIntelligenceWorkspaceData().catch(() => null),
    getMarketplaceControlWorkspaceData("overview").catch(() => null),
  ]);

  const queue = applications?.queue ?? [];
  const financeApps = queue.filter((item) => item.type === "finance-application");
  const insuranceApps = queue.filter((item) => item.type === "insurance-application");
  const warrantyApps = queue.filter((item) => item.type === "warranty-application");
  const tradeInApps = queue.filter((item) => item.type === "trade-in-request");
  const valuationApps = queue.filter((item) => item.type === "vehicle-valuation");
  const dealerServiceApps = queue.filter((item) => item.type === "dealer-request");
  const marketplaceServiceApps = queue.filter((item) => item.type === "marketplace-request");

  const financeCompleted = countByStatus(financeApps, ["completed", "approved"]);
  const financeAccepted = countByStatus(financeApps, ["completed", "approved"]);
  const financeRejected = countByStatus(financeApps, ["rejected"]);
  const financeOpen = Math.max(0, financeApps.length - financeCompleted - financeRejected);
  const financeAcceptanceRate = financeApps.length > 0
    ? `${Math.round((financeAccepted / financeApps.length) * 100)}%`
    : "No data yet";

  const inspectionDocuments = store.inventoryDocuments.filter((item) => item.documentType.includes("inspection")).length;
  const warrantyDocuments = store.inventoryDocuments.filter((item) => item.documentType.includes("warranty")).length;

  const revenueStreams = revenue?.revenueStreams ?? [];
  const advertisingStream = revenueStreams.find((stream) => stream.id === "advertising");
  const financeStream = revenueStreams.find((stream) => stream.id === "finance-commission");

  const defaultOwner = dealerManagement?.users[0]?.fullName
    ?? dealerManagement?.dealerships[0]?.tradingName
    ?? "Operations Team";

  const baseEvents = store.marketAnalyticsEvents
    .filter((event) => {
      const name = event.eventName.toLowerCase();
      return (
        event.source === "operations-partner-centre"
        || name.includes("finance")
        || name.includes("insurance")
        || name.includes("warranty")
        || name.includes("inspection")
        || name.includes("valuation")
        || name.includes("partner")
        || name.includes("subscription")
        || name.includes("marketplace")
      );
    })
    .sort((a, b) => Date.parse(b.eventTimestamp) - Date.parse(a.eventTimestamp));

  const profiles: PartnerProfile[] = PARTNER_BLUEPRINTS.map((blueprint) => {
    const categoryLabel = CATEGORY_LABEL[blueprint.category];

    let status: PartnerStatus = blueprint.defaultStatus;
    let applicationsReceived = "No data yet";
    let applicationsCompleted = "No data yet";
    let acceptanceRate = "No data yet";
    const responseTime = "No data yet";
    let revenueContribution = "No data yet";
    const serviceQuality = "No data yet";
    let outstandingWork = "No data yet";
    let sourceAvailability: PartnerProfile["sourceAvailability"] = "unavailable";

    if (blueprint.category === "finance-companies") {
      status = financeApps.length > 0 ? "active" : "onboarding";
      applicationsReceived = financeApps.length.toLocaleString("en-ZA");
      applicationsCompleted = financeCompleted.toLocaleString("en-ZA");
      acceptanceRate = financeAcceptanceRate;
      revenueContribution = financeStream?.value ?? financeApps.length.toLocaleString("en-ZA");
      outstandingWork = financeOpen.toLocaleString("en-ZA");
      sourceAvailability = financeApps.length > 0 ? "live" : "manual";
    }

    if (blueprint.category === "inspection-companies") {
      status = inspectionDocuments > 0 ? "onboarding" : "prospect";
      applicationsReceived = inspectionDocuments > 0 ? inspectionDocuments.toLocaleString("en-ZA") : "No data yet";
      applicationsCompleted = "No data yet";
      outstandingWork = "No data yet";
      sourceAvailability = inspectionDocuments > 0 ? "manual" : "unavailable";
    }

    if (blueprint.category === "warranty-providers" && warrantyDocuments > 0) {
      status = "onboarding";
      applicationsReceived = warrantyDocuments.toLocaleString("en-ZA");
      sourceAvailability = "manual";
    }

    if (blueprint.category === "advertising-partners") {
      revenueContribution = advertisingStream?.value ?? "No data yet";
      sourceAvailability = advertisingStream?.status === "live" ? "live" : "unavailable";
    }

    if (blueprint.category === "vehicle-valuation-partners") {
      applicationsReceived = valuationApps.length > 0 ? valuationApps.length.toLocaleString("en-ZA") : "No data yet";
      sourceAvailability = valuationApps.length > 0 ? "manual" : "unavailable";
    }

    const partnerEvents: PartnerTimelineItem[] = [
      {
        id: `${blueprint.id}-created`,
        partnerId: blueprint.id,
        partnerName: blueprint.name,
        eventType: "created" as const,
        message: `${blueprint.name} framework relationship initialized in Partner Centre.`,
        source: "operations-partner-centre",
        actorType: "system",
        createdAt: generatedAt,
      },
      ...baseEvents
        .filter((event) => {
          const payload = event.payload as { partnerId?: unknown; category?: unknown };
          return payload.partnerId === blueprint.id || payload.category === blueprint.category;
        })
        .map((event): PartnerTimelineItem => ({
          id: event.id,
          partnerId: blueprint.id,
          partnerName: blueprint.name,
          eventType: mapEventType(event.eventName.toLowerCase()),
          message: event.eventName,
          source: event.source,
          actorType: event.actorType,
          createdAt: event.eventTimestamp,
        })),
    ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return {
      id: blueprint.id,
      name: blueprint.name,
      category: blueprint.category,
      categoryLabel,
      status,
      businessProfile: blueprint.businessProfile,
      products: blueprint.products,
      services: blueprint.services,
      coverageAreas: blueprint.coverageAreas,
      territories: blueprint.territories,
      contacts: [
        {
          id: `${blueprint.id}-primary`,
          name: `${categoryLabel} Lead`,
          role: "Relationship Lead",
          email: "No data yet",
          telephone: "No data yet",
          availability: "unavailable",
        },
      ],
      relationshipOwner: defaultOwner,
      healthScore: "No data yet",
      performance: [
        asMetric("applications-received", "Applications Received", applicationsReceived, "Live where request pipelines are connected, otherwise framework placeholder.", applicationsReceived === "No data yet" ? "unavailable" : "live"),
        asMetric("applications-completed", "Applications Completed", applicationsCompleted, "Completion depends on dedicated partner workflow states.", applicationsCompleted === "No data yet" ? "unavailable" : "live"),
        asMetric("acceptance-rate", "Acceptance Rate", acceptanceRate, "Calculated where closed outcomes are available.", acceptanceRate === "No data yet" ? "unavailable" : "live"),
        asMetric("response-time", "Response Time", responseTime, "Partner response SLA telemetry is not connected yet.", "unavailable"),
        asMetric("revenue-contribution", "Revenue Contribution", revenueContribution, "Uses live demand/stream signals where available, monetary settlement remains No data yet.", revenueContribution === "No data yet" ? "unavailable" : "live"),
        asMetric("service-quality", "Service Quality", serviceQuality, "Service quality scoring model is framework-only at this stage.", "unavailable"),
        asMetric("outstanding-work", "Outstanding Work", outstandingWork, "Operational backlog requiring partner follow-up.", outstandingWork === "No data yet" ? "unavailable" : "live"),
      ],
      leadDistribution: {
        leadRouting: "Framework Ready",
        allocationRules: "Framework Ready",
        priorityModel: "Framework Ready",
        capacityModel: "Framework Ready",
        availabilityModel: "Framework Ready",
        performanceModel: "Framework Ready",
        extensionPoints: [
          "Route by partner category",
          "Route by territory",
          "Route by capacity",
          "Route by performance score",
        ],
        status: "framework",
      },
      integration: {
        apiStatus: "No data yet",
        webhookReadiness: "No data yet",
        integrationHealth: "No data yet",
        lastSync: "No data yet",
        version: "No data yet",
        authenticationMethod: "No data yet",
        status: "unavailable",
      },
      internalNotes: "Relationship workspace established. Detailed operational notes can be logged through Partner Centre actions.",
      timeline: partnerEvents,
      sourceAvailability,
    };
  });

  const directory: PartnerDirectoryRow[] = profiles.map((profile) => {
    const appsReceivedMetric = profile.performance.find((metric) => metric.id === "applications-received")?.value ?? "No data yet";
    const revenueContributionMetric = profile.performance.find((metric) => metric.id === "revenue-contribution")?.value ?? "No data yet";

    return {
      id: profile.id,
      name: profile.name,
      category: profile.category,
      categoryLabel: profile.categoryLabel,
      status: profile.status,
      relationshipOwner: profile.relationshipOwner,
      healthScore: profile.healthScore,
      applicationsReceived: appsReceivedMetric,
      revenueContribution: revenueContributionMetric,
      integrationStatus: profile.integration.apiStatus,
      updatedAt: profile.timeline[0]?.createdAt ?? generatedAt,
    };
  });

  const activeRelationships = directory.filter((item) => item.status === "active").length;
  const onboardingRelationships = directory.filter((item) => item.status === "onboarding" || item.status === "prospect" || item.status === "contacted" || item.status === "negotiating").length;
  const integrationReady = directory.filter((item) => item.integrationStatus !== "No data yet").length;
  const streamCoverage = revenueStreams.filter((item) => item.status === "live").length;

  const timeline: PartnerTimelineItem[] = [
    ...profiles.flatMap((profile) => profile.timeline),
    ...baseEvents.map((event): PartnerTimelineItem => ({
      id: `global-${event.id}`,
      partnerId: "platform",
      partnerName: "Platform Partner Network",
      eventType: mapEventType(event.eventName.toLowerCase()),
      message: event.eventName,
      source: event.source,
      actorType: event.actorType,
      createdAt: event.eventTimestamp,
    })),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 220);

  const audit = store.marketAnalyticsEvents
    .filter((event) => event.source === "operations-partner-centre")
    .map((event) => {
      const payload = event.payload as { partnerId?: unknown };
      return {
        id: event.id,
        partnerId: typeof payload.partnerId === "string" ? payload.partnerId : "platform",
        action: event.eventName,
        source: event.source,
        actorType: event.actorType,
        createdAt: event.eventTimestamp,
      };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 200);

  return {
    generatedAt,
    sectionId,
    summaryCards: [
      {
        id: "total-partners",
        label: "Total Partner Categories",
        value: profiles.length.toLocaleString("en-ZA"),
        detail: "Unified partner relationship framework across all supported categories.",
        availability: "live",
      },
      {
        id: "active-relationships",
        label: "Active Relationships",
        value: activeRelationships.toLocaleString("en-ZA"),
        detail: "Categories currently in active operational relationship state.",
        availability: "live",
      },
      {
        id: "onboarding-pipeline",
        label: "Onboarding Pipeline",
        value: onboardingRelationships.toLocaleString("en-ZA"),
        detail: "Prospect, contacted, negotiating, and onboarding partner categories.",
        availability: "live",
      },
      {
        id: "finance-demand",
        label: "Finance Requests",
        value: financeApps.length.toLocaleString("en-ZA"),
        detail: "Live finance request demand reused from Applications Centre.",
        availability: financeApps.length > 0 ? "live" : "unavailable",
      },
      {
        id: "integrations-connected",
        label: "Integrations Connected",
        value: integrationReady.toLocaleString("en-ZA"),
        detail: "Current partner integrations are framework-only and prepared for future API/webhook connections.",
        availability: integrationReady > 0 ? "live" : "unavailable",
      },
      {
        id: "lead-routing",
        label: "Lead Routing Engine",
        value: "No data yet",
        detail: "Lead distribution architecture is scaffolded with extension points only.",
        availability: "unavailable",
      },
      {
        id: "stream-coverage",
        label: "Revenue Stream Coverage",
        value: `${streamCoverage}/${Math.max(1, revenueStreams.length)}`,
        detail: "Live coverage reused from Revenue Centre stream readiness.",
        availability: streamCoverage > 0 ? "live" : "unavailable",
      },
    ],
    directory,
    profiles,
    timeline,
    audit,
    sourceReadiness: [
      {
        id: "applications-centre",
        label: "Applications Centre (Finance/Request Signals)",
        mode: applications ? "live" : "manual",
        detail: "Live finance request volumes and request type framework from existing Applications Centre aggregation.",
      },
      {
        id: "revenue-centre",
        label: "Revenue Centre (Partner/Commission Readiness)",
        mode: revenue ? "live" : "manual",
        detail: "Reused revenue stream readiness and partner revenue placeholders.",
      },
      {
        id: "dealer-and-marketplace",
        label: "Dealer and Marketplace Operational Context",
        mode: dealerIntelligence && marketplace ? "live" : "manual",
        detail: "Dealer quality, marketplace health, and activity timelines reused without duplication.",
      },
      {
        id: "insurance-warranty-tradein-valuation-roadside",
        label: "Insurance, Warranty, Trade-In, Valuation, Roadside, Logistics, Tracking Integrations",
        mode: "unavailable",
        detail: "Framework ready. No dedicated live partner integration APIs or ledgers are connected yet.",
      },
      {
        id: "partner-api",
        label: "Partner API and Webhook Runtime",
        mode: "unavailable",
        detail: "Architecture exists in platform strategy docs, runtime endpoints are not implemented yet.",
      },
      {
        id: "request-type-coverage",
        label: "Request Type Coverage",
        mode: "manual",
        detail: `Finance=${financeApps.length}, Insurance=${insuranceApps.length}, Warranty=${warrantyApps.length}, Trade-In=${tradeInApps.length}, Valuation=${valuationApps.length}, Dealer Services=${dealerServiceApps.length}, Marketplace Services=${marketplaceServiceApps.length}.`,
      },
    ],
  };
}

export async function applyPartnerCentreAction(input: PartnerCentreActionInput): Promise<void> {
  const store = await readPlatformStore();
  const dealershipId = store.dealerships[0]?.id;

  if (!dealershipId) {
    throw new Error("No dealership context available for audit logging.");
  }

  await logOperationsAuditEvent({
    dealershipId,
    eventName: `operations.partner-centre.${input.action}`,
    source: "operations-partner-centre",
    payload: {
      action: input.action,
      partnerId: input.partnerId ?? null,
      status: input.status ?? null,
      note: input.note ?? null,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      permission: permissionForAction(input.action),
      timestamp: new Date().toISOString(),
    },
  }).catch(() => undefined);
}

export function partnerCentreTimestampLabel(data: PartnerCentreWorkspaceData): string {
  return rel(data.generatedAt);
}
