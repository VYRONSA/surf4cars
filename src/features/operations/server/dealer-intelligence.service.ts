import { getDealerManagementData } from "@/features/operations/server/dealer-management.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import {
  readPlatformStore,
  updatePlatformStore,
} from "@/lib/local-persistence/platform-store";
import type {
  LocalBranchRecord,
  LocalInventoryVehicleRecord,
  LocalStaffMembershipRecord,
} from "@/lib/local-persistence/platform-store";
import type {
  DealerIntelligenceActivityItem,
  DealerIntelligenceAiClassificationItem,
  DealerIntelligenceBrandDetectionItem,
  DealerIntelligenceBranchDiscoveryItem,
  DealerIntelligenceChangeItem,
  DealerIntelligenceContactDiscoveryItem,
  DealerIntelligenceDuplicateGroup,
  DealerIntelligenceProfile,
  DealerIntelligenceProfileTimelineItem,
  DealerIntelligenceQueueItem,
  DealerIntelligenceQueueStatus,
  DealerIntelligenceReviewUpdateInput,
  DealerIntelligenceVerificationStatus,
  DealerIntelligenceWebsiteAnalysisItem,
  DealerIntelligenceWorkspaceData,
} from "@/features/operations/types/dealer-intelligence.types";

function normalizeKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

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

function deriveQueueStatus(
  onboardingStatus: string,
  hasDuplicate: boolean,
): DealerIntelligenceQueueStatus {
  if (hasDuplicate) return "duplicate";
  if (onboardingStatus === "completed") return "verified";
  if (onboardingStatus === "rejected") return "rejected";
  if (onboardingStatus === "under-review") return "under-review";
  if (onboardingStatus === "suspended") return "archived";
  return "new";
}

function deriveVerificationStatus(
  onboardingStatus: string,
  hasDuplicate: boolean,
): DealerIntelligenceVerificationStatus {
  if (hasDuplicate) return "duplicate";
  if (onboardingStatus === "completed") return "verified";
  if (onboardingStatus === "under-review") return "needs-review";
  if (onboardingStatus === "rejected") return "rejected";
  return "pending";
}

function scoreDataQuality(input: {
  readonly hasWebsite: boolean;
  readonly hasContacts: boolean;
  readonly hasBrands: boolean;
  readonly hasAddress: boolean;
  readonly hasBranch: boolean;
  readonly isProfileComplete: boolean;
}): { score: number; missingFields: string[] } {
  const missingFields: string[] = [];
  if (!input.hasWebsite) missingFields.push("Missing website");
  if (!input.hasContacts) missingFields.push("Missing contacts");
  if (!input.hasBrands) missingFields.push("Missing brands");
  if (!input.hasAddress) missingFields.push("Missing address");
  if (!input.hasBranch) missingFields.push("Missing branch");
  if (!input.isProfileComplete) missingFields.push("Incomplete profile");

  const penalty = missingFields.length * 15;
  return {
    score: Math.max(0, 100 - penalty),
    missingFields,
  };
}

export async function getDealerIntelligenceWorkspaceData(): Promise<DealerIntelligenceWorkspaceData> {
  const generatedAt = new Date().toISOString();
  const store = await readPlatformStore();
  const dealerManagement = await getDealerManagementData();

  const branchesByDealer = new Map<string, LocalBranchRecord[]>();
  const membershipsByDealer = new Map<string, LocalStaffMembershipRecord[]>();
  const inventoryByDealer = new Map<string, LocalInventoryVehicleRecord[]>();
  const reviewsByDealer = new Map(store.dealerIntelligenceReviews.map((item) => [item.dealershipId, item]));

  for (const branch of store.branches) {
    const current = branchesByDealer.get(branch.dealershipId) ?? [];
    current.push(branch);
    branchesByDealer.set(branch.dealershipId, current);
  }

  for (const membership of store.staffMemberships) {
    const current = membershipsByDealer.get(membership.dealershipId) ?? [];
    current.push(membership);
    membershipsByDealer.set(membership.dealershipId, current);
  }

  for (const vehicle of store.inventoryVehicles) {
    const current = inventoryByDealer.get(vehicle.dealershipId) ?? [];
    current.push(vehicle);
    inventoryByDealer.set(vehicle.dealershipId, current);
  }

  const duplicateGroupsByRegistration = new Map<string, string[]>();
  for (const dealership of store.dealerships) {
    const normalized = normalizeKey(dealership.registrationNumber);
    if (!normalized) continue;
    const current = duplicateGroupsByRegistration.get(normalized) ?? [];
    current.push(dealership.id);
    duplicateGroupsByRegistration.set(normalized, current);
  }

  const duplicateGroups: DealerIntelligenceDuplicateGroup[] = [...duplicateGroupsByRegistration.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([registrationKey, dealershipIds]) => ({
      key: registrationKey,
      reason: "registration-number",
      dealershipIds,
      dealershipNames: dealershipIds.map((id) => store.dealerships.find((dealer) => dealer.id === id)?.tradingName ?? id),
      status: "pending",
    }));

  const duplicateSet = new Set(duplicateGroups.flatMap((group) => group.dealershipIds));

  const profiles: DealerIntelligenceProfile[] = store.dealerships.map((dealership) => {
    const review = reviewsByDealer.get(dealership.id);
    const knownBranchesRaw = branchesByDealer.get(dealership.id) ?? [];
    const knownContactsRaw = membershipsByDealer.get(dealership.id) ?? [];
    const knownInventory = inventoryByDealer.get(dealership.id) ?? [];

    const knownBrands = [...new Set(knownInventory.map((vehicle) => vehicle.make.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    const knownBranches = knownBranchesRaw.map((branch) => ({
      id: branch.id,
      name: branch.name,
      city: branch.city,
      province: branch.province,
      sourceMode: "live" as const,
    }));

    const knownContacts: DealerIntelligenceProfile["knownContacts"][number][] = knownContactsRaw.map((membership) => ({
      id: membership.id,
      name: membership.fullName,
      email: membership.email,
      telephone: null,
      role: membership.roleId,
      sourceMode: "live" as const,
    }));

    if (knownContacts.length === 0 && dealership.email?.trim()) {
      knownContacts.push({
        id: `${dealership.id}-primary-contact`,
        name: dealership.tradingName,
        email: dealership.email,
        telephone: dealership.telephone?.trim() || null,
        role: "primary",
        sourceMode: "live",
      });
    }

    const hasAddress = Boolean(dealership.physicalAddress.trim());
    const hasWebsite = Boolean((dealership.website ?? "").trim());
    const hasBranch = knownBranches.length > 0;
    const hasContacts = knownContacts.length > 0;
    const hasBrands = knownBrands.length > 0;
    const isProfileComplete = [
      dealership.tradingName,
      dealership.registrationNumber,
      dealership.vatNumber,
      dealership.telephone,
      dealership.email,
      dealership.city,
      dealership.province,
    ].every((value) => (value ?? "").trim().length > 0);

    const quality = scoreDataQuality({
      hasWebsite,
      hasContacts,
      hasBrands,
      hasAddress,
      hasBranch,
      isProfileComplete,
    });

    const defaultQueueStatus = deriveQueueStatus(dealership.onboardingStatus, duplicateSet.has(dealership.id));
    const defaultVerification = deriveVerificationStatus(dealership.onboardingStatus, duplicateSet.has(dealership.id));

    const timeline: DealerIntelligenceProfileTimelineItem[] = dealerManagement.timeline
      .filter((event) => event.dealershipId === dealership.id)
      .slice(0, 6)
      .map((event) => ({
        id: event.id,
        timestamp: event.timestamp,
        title: event.title,
        source: event.source,
      }));

    return {
      dealershipId: dealership.id,
      dealershipName: dealership.tradingName,
      businessDetails: {
        registrationNumber: dealership.registrationNumber,
        vatNumber: dealership.vatNumber,
        city: dealership.city,
        province: dealership.province,
        address: dealership.physicalAddress,
      },
      knownBrands,
      knownBranches,
      knownContacts,
      knownWebsite: (dealership.website ?? "").trim() || null,
      queueStatus: review?.queueStatus ?? defaultQueueStatus,
      verificationStatus: review?.verificationStatus ?? defaultVerification,
      dataQualityScore: quality.score,
      missingFields: quality.missingFields,
      lastReviewed: review?.lastReviewedAt ?? dealership.updatedAt,
      internalNotes: review?.internalNotes ?? null,
      operationsOwner: review?.operationsOwner?.trim() || dealership.ownerUserId,
      timeline,
    };
  }).sort((a, b) => a.dealershipName.localeCompare(b.dealershipName));

  const queue: DealerIntelligenceQueueItem[] = profiles.map((profile) => ({
    dealershipId: profile.dealershipId,
    dealershipName: profile.dealershipName,
    city: profile.businessDetails.city,
    province: profile.businessDetails.province,
    status: profile.queueStatus,
    verificationStatus: profile.verificationStatus,
    dataQualityScore: profile.dataQualityScore,
    lastReviewed: profile.lastReviewed,
    operationsOwner: profile.operationsOwner,
  })).sort((a, b) => Date.parse(b.lastReviewed) - Date.parse(a.lastReviewed));

  const branches: DealerIntelligenceBranchDiscoveryItem[] = profiles.flatMap((profile) =>
    profile.knownBranches.map((branch) => ({
      branchId: branch.id,
      dealershipId: profile.dealershipId,
      dealershipName: profile.dealershipName,
      branchName: branch.name,
      city: branch.city,
      province: branch.province,
      sourceMode: branch.sourceMode,
    })),
  );

  const brandDetections: DealerIntelligenceBrandDetectionItem[] = profiles.map((profile) => ({
    dealershipId: profile.dealershipId,
    dealershipName: profile.dealershipName,
    brands: profile.knownBrands,
    sourceMode: profile.knownBrands.length > 0 ? "live" : "manual",
    detail: profile.knownBrands.length > 0
      ? "Detected from known published and draft inventory records."
      : "No known brands in current inventory records. Manual enrichment required.",
  }));

  const contactDiscoveries: DealerIntelligenceContactDiscoveryItem[] = profiles.map((profile) => ({
    dealershipId: profile.dealershipId,
    dealershipName: profile.dealershipName,
    contactCount: profile.knownContacts.length,
    hasPhone: profile.knownContacts.some((contact) => Boolean(contact.telephone?.trim())),
    hasEmail: profile.knownContacts.some((contact) => Boolean(contact.email.trim())),
    sourceMode: profile.knownContacts.length > 0 ? "live" : "manual",
  }));

  const websiteAnalysis: DealerIntelligenceWebsiteAnalysisItem[] = profiles.map((profile) => ({
    dealershipId: profile.dealershipId,
    dealershipName: profile.dealershipName,
    website: profile.knownWebsite,
    status: profile.knownWebsite ? "known" : "missing",
    sourceMode: profile.knownWebsite ? "live" : "manual",
    detail: profile.knownWebsite
      ? "Website is known and ready for future analysis modules."
      : "Website missing in known profile data.",
  }));

  const aiClassifications: DealerIntelligenceAiClassificationItem[] = profiles.map((profile) => {
    const classification = profile.verificationStatus === "duplicate"
      ? "duplicate-risk"
      : profile.dataQualityScore >= 70
        ? "ready"
        : "needs-enrichment";

    return {
      dealershipId: profile.dealershipId,
      dealershipName: profile.dealershipName,
      classification,
      confidenceLabel: `${Math.max(35, profile.dataQualityScore)}%` ,
      provider: "SURF internal intelligence rules",
      providerMode: "live",
      detail: classification === "ready"
        ? "Profile has sufficient known data for verification workflows."
        : classification === "duplicate-risk"
          ? "Potential duplicate identifiers detected."
          : "Additional known profile fields are required before higher-confidence classification.",
    };
  });

  const changeMonitoring: DealerIntelligenceChangeItem[] = store.marketAnalyticsEvents
    .slice()
    .sort((a, b) => Date.parse(b.eventTimestamp) - Date.parse(a.eventTimestamp))
    .slice(0, 120)
    .map((event) => {
      const dealership = store.dealerships.find((item) => item.id === event.dealershipId);
      return {
        id: event.id,
        dealershipId: event.dealershipId,
        dealershipName: dealership?.tradingName ?? event.dealershipId,
        changedAt: event.eventTimestamp,
        source: event.source,
        changeType: event.eventType,
        summary: event.eventName,
      };
    });

  const activity: DealerIntelligenceActivityItem[] = [
    ...store.dealerIntelligenceActivity.map((event) => {
      const dealership = store.dealerships.find((item) => item.id === event.dealershipId);
      return {
        id: event.id,
        dealershipId: event.dealershipId,
        dealershipName: dealership?.tradingName ?? event.dealershipId,
        eventName: event.action,
        eventAt: event.createdAt,
        source: event.source,
        actorType: event.actorType,
      };
    }),
    ...store.marketAnalyticsEvents.map((event) => {
      const dealership = store.dealerships.find((item) => item.id === event.dealershipId);
      return {
        id: event.id,
        dealershipId: event.dealershipId,
        dealershipName: dealership?.tradingName ?? event.dealershipId,
        eventName: event.eventName,
        eventAt: event.eventTimestamp,
        source: event.source,
        actorType: event.actorType,
      };
    }),
  ]
    .sort((a, b) => Date.parse(b.eventAt) - Date.parse(a.eventAt))
    .slice(0, 160);

  const needsReview = profiles.filter((profile) => profile.verificationStatus === "needs-review" || profile.verificationStatus === "pending").length;
  const duplicates = profiles.filter((profile) => profile.verificationStatus === "duplicate").length;
  const verified = profiles.filter((profile) => profile.verificationStatus === "verified").length;
  const highQuality = profiles.filter((profile) => profile.dataQualityScore >= 80).length;

  return {
    generatedAt,
    overviewCards: [
      {
        id: "known-dealerships",
        label: "Known Dealerships",
        value: profiles.length.toLocaleString("en-ZA"),
        detail: "Total dealerships currently known through existing onboarding and management records.",
        availability: "live",
      },
      {
        id: "discovery-queue",
        label: "Discovery Queue",
        value: queue.filter((item) => item.status === "new" || item.status === "under-review").length.toLocaleString("en-ZA"),
        detail: "New and under-review records awaiting operations decisions.",
        availability: "live",
      },
      {
        id: "verified-profiles",
        label: "Verified Profiles",
        value: verified.toLocaleString("en-ZA"),
        detail: "Profiles currently marked verified based on known operational status.",
        availability: "live",
      },
      {
        id: "needs-review",
        label: "Needs Review",
        value: needsReview.toLocaleString("en-ZA"),
        detail: "Profiles requiring operations review before verification.",
        availability: "manual",
      },
      {
        id: "duplicate-risk",
        label: "Duplicate Risk",
        value: duplicates.toLocaleString("en-ZA"),
        detail: "Potential duplicate dealerships identified from known registration numbers.",
        availability: "manual",
      },
      {
        id: "high-quality",
        label: "High Quality Profiles",
        value: highQuality.toLocaleString("en-ZA"),
        detail: "Profiles with quality score 80+ from known information only.",
        availability: "live",
      },
    ],
    sourceReadiness: [
      {
        id: "onboarding-pipeline",
        label: "Onboarding and Dealer Management Data",
        mode: "live",
        detail: "Live internal records from onboarding, dealership management, branches, and memberships.",
      },
      {
        id: "operations-review",
        label: "Operations Analyst Review",
        mode: "manual",
        detail: "Manual verification, notes, and ownership decisions by operations users.",
      },
      {
        id: "website-crawling",
        label: "Website Discovery and Change Crawling",
        mode: "unavailable",
        detail: "Architecture ready. Automated crawling is intentionally not implemented in SOC-003.",
      },
      {
        id: "external-data-ingest",
        label: "External Registry and Third-Party Sources",
        mode: "unavailable",
        detail: "Architecture ready for future integrations. No third-party APIs connected in SOC-003.",
      },
    ],
    profiles,
    queue,
    branches,
    brandDetections,
    contactDiscoveries,
    websiteAnalysis,
    aiClassifications,
    duplicateGroups,
    changeMonitoring,
    activity,
  };
}

export async function updateDealerIntelligenceReview(
  input: DealerIntelligenceReviewUpdateInput,
): Promise<void> {
  const store = await readPlatformStore();
  const dealership = store.dealerships.find((item) => item.id === input.dealershipId);

  if (!dealership) {
    throw new Error("Dealership not found.");
  }

  const nowIso = new Date().toISOString();

  await updatePlatformStore((current) => {
    const existing = current.dealerIntelligenceReviews.find((item) => item.dealershipId === input.dealershipId);
    const preservedId = existing?.id ?? `dir-${crypto.randomUUID()}`;

    const nextReview = {
      id: preservedId,
      dealershipId: input.dealershipId,
      queueStatus: input.queueStatus ?? existing?.queueStatus ?? "new",
      verificationStatus: input.verificationStatus ?? existing?.verificationStatus ?? "pending",
      internalNotes: input.internalNotes ?? existing?.internalNotes ?? null,
      operationsOwner: input.operationsOwner?.trim() || existing?.operationsOwner || dealership.ownerUserId,
      lastReviewedAt: nowIso,
      updatedAt: nowIso,
    } as const;

    const nextReviews = existing
      ? current.dealerIntelligenceReviews.map((item) => item.dealershipId === input.dealershipId ? nextReview : item)
      : [...current.dealerIntelligenceReviews, nextReview];

    return {
      ...current,
      dealerIntelligenceReviews: nextReviews,
      dealerIntelligenceActivity: [
        ...current.dealerIntelligenceActivity,
        {
          id: `dia-${crypto.randomUUID()}`,
          dealershipId: input.dealershipId,
          action: "operations.dealer-intelligence.review.updated",
          source: "operations-centre",
          actorType: "system",
          actorId: null,
          payload: {
            queueStatus: nextReview.queueStatus,
            verificationStatus: nextReview.verificationStatus,
            operationsOwner: nextReview.operationsOwner,
            hasNotes: Boolean(nextReview.internalNotes?.trim()),
          },
          createdAt: nowIso,
        },
      ],
    };
  });

  await logOperationsAuditEvent({
    dealershipId: input.dealershipId,
    eventName: "operations.dealer-intelligence.review.updated",
    source: "operations-centre",
    payload: {
      queueStatus: input.queueStatus,
      verificationStatus: input.verificationStatus,
      hasNotes: Boolean(input.internalNotes?.trim()),
      operationsOwner: input.operationsOwner,
    },
  }).catch(() => undefined);
}

export { formatRelative };
