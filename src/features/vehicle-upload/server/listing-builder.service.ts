import { createSupabaseServerClient } from "@/lib/supabase";
import { createDomainServerClient } from "@/lib/supabase/service-client";
import { readPlatformStore, updatePlatformStore } from "@/lib/local-persistence/platform-store";
import type {
  ListingBuilderDraftQuery,
  ListingBuilderDraftRequest,
  ListingBuilderPublishRequest,
} from "@/features/vehicle-upload/server/listing-builder.request";
import { evaluatePublishReadiness } from "@/features/vehicle-upload/utils/publish-readiness";
import {
  createListingBuilderAuditPayload,
  parseListingBuilderAuditPayload,
} from "@/features/vehicle-upload/utils/listing-builder-audit";
import {
  resolveListingRegistration,
  resolveListingTitle,
  resolveListingVin,
} from "@/features/vehicle-upload/utils/listing-summary";

interface PublishListingResult {
  readonly vehicleId: string;
  readonly lifecycleStatus: "draft" | "published";
  readonly qualityScore: number | null;
}

interface PublishTrace {
  readonly traceId: string;
  readonly startedAt: number;
}

interface ListingBuilderDraftRecord {
  readonly draftId: string;
  readonly currentStepIndex: number;
  readonly revision: number;
  readonly updatedAt: string;
  readonly payload: ListingBuilderDraftRequest["payload"];
}

async function saveListingBuilderDraftToLocalStore(
  request: ListingBuilderDraftRequest,
  ownerEmail: string,
  nowIso: string,
): Promise<void> {
  await updatePlatformStore((current) => ({
    ...current,
    onboardingDrafts: [
      ...current.onboardingDrafts.filter((draft) => draft.ownerEmail !== ownerEmail),
      {
        ownerEmail,
        currentStepIndex: request.currentStepIndex,
        payload: request.payload,
        revision: request.revision,
        createdAt: nowIso,
        updatedAt: request.updatedAt || nowIso,
      },
    ],
  }));
}

async function readListingBuilderDraftFromLocalStore(query: ListingBuilderDraftQuery): Promise<ListingBuilderDraftRecord | null> {
  const store = await readPlatformStore();
  const prefix = `${query.dealershipId}:`;
  const candidates = store.onboardingDrafts
    .filter((draft) => draft.ownerEmail.startsWith(prefix))
    .filter((draft) => !query.draftId || draft.ownerEmail === draftOwnerKey(query.dealershipId, query.draftId));

  if (candidates.length === 0) {
    return null;
  }

  const latest = [...candidates].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt ?? a.createdAt ?? "") || 0;
    const bTime = Date.parse(b.updatedAt ?? b.createdAt ?? "") || 0;
    return bTime - aTime;
  })[0];

  if (!latest) return null;

  return {
    draftId: latest.ownerEmail.slice(prefix.length),
    currentStepIndex: latest.currentStepIndex ?? 0,
    revision: typeof latest.revision === "number" ? latest.revision : 0,
    updatedAt: latest.updatedAt ?? latest.createdAt ?? new Date().toISOString(),
    payload: latest.payload as ListingBuilderDraftRequest["payload"],
  };
}

function draftOwnerKey(dealershipId: string, draftId: string): string {
  return `${dealershipId}:${draftId}`;
}

function isMissingInventoryTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("schema cache") ||
    message.includes("inventory_vehicles") ||
    message.includes("inventory_vehicle_") ||
    message.includes("does not exist") ||
    message.includes("relation")
  );
}

function isMissingOnboardingDraftTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("schema cache") ||
    message.includes("dealer_onboarding_drafts") ||
    message.includes("does not exist") ||
    message.includes("relation")
  );
}

function isSupabaseTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("timeout")
    || message.includes("timed out")
    || message.includes("failed to fetch")
    || message.includes("network")
    || message.includes("socket")
    || message.includes("econnrefused")
    || message.includes("econnreset")
    || message.includes("etimedout")
  );
}

async function withSupabaseTimeout<T>(operation: PromiseLike<T>, label: string, timeoutMs = 7000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Supabase ${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function resolveBranchIdFromStore(dealershipId: string): Promise<string> {
  const store = await readPlatformStore();
  const branch = store.branches.find((item) => item.dealershipId === dealershipId);
  if (!branch) {
    throw new Error("A dealership branch is required before publishing.");
  }
  return branch.id;
}

async function logMarketAnalyticsEvent(params: {
  readonly supabase: ReturnType<typeof createSupabaseServerClient>;
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly eventType: "price-change" | "conversion-event";
  readonly eventName: string;
  readonly actorId: string;
  readonly payload: Record<string, unknown>;
}): Promise<void> {
  if (!params.supabase) return;

  await params.supabase.from("market_analytics_events").insert({
    id: crypto.randomUUID(),
    dealership_id: params.dealershipId,
    vehicle_id: params.vehicleId,
    event_type: params.eventType,
    event_name: params.eventName,
    event_timestamp: new Date().toISOString(),
    actor_id: params.actorId,
    actor_type: "user",
    source: "listing-builder",
    payload: params.payload,
    created_at: new Date().toISOString(),
  });
}

function createListingBuilderServerClient(accessToken?: string) {
  // Previously returned null without a token, which sent every publish to local persistence while
  // the Vehicle Engine read from Supabase. Writes now always reach the database.
  return createDomainServerClient(accessToken);
}

function logPublishPhase(trace: PublishTrace, phase: string, details: Record<string, unknown> = {}) {
  console.info("[pcp001e][publish-service]", {
    traceId: trace.traceId,
    phase,
    elapsedMs: Date.now() - trace.startedAt,
    ...details,
  });
}

export async function saveListingBuilderDraft(
  request: ListingBuilderDraftRequest,
  accessToken?: string,
): Promise<void> {
  const supabase = createListingBuilderServerClient(accessToken);
  const nowIso = new Date().toISOString();
  const ownerEmail = draftOwnerKey(request.dealershipId, request.draftId);

  if (!supabase) {
    await saveListingBuilderDraftToLocalStore(request, ownerEmail, nowIso);
    return;
  }

  const { data: existing, error: existingError } = await supabase
    .from("dealer_onboarding_drafts")
    .select("owner_email, revision")
    .eq("owner_email", ownerEmail)
    .maybeSingle();

  if (existingError) {
    if (isMissingOnboardingDraftTableError(new Error(existingError.message))) {
      await saveListingBuilderDraftToLocalStore(request, ownerEmail, nowIso);
      return;
    }
    throw new Error(existingError.message);
  }

  if (existing && typeof existing.revision === "number" && existing.revision > request.revision) {
    throw new Error("A newer draft revision already exists.");
  }

  const { error } = await supabase
    .from("dealer_onboarding_drafts")
    .upsert(
      {
        owner_email: ownerEmail,
        current_step_index: request.currentStepIndex,
        payload: request.payload,
        revision: request.revision,
        updated_at: request.updatedAt || nowIso,
      },
      {
        onConflict: "owner_email",
      },
    );

  if (error) {
    if (isMissingOnboardingDraftTableError(new Error(error.message))) {
      await saveListingBuilderDraftToLocalStore(request, ownerEmail, nowIso);
      return;
    }
    throw new Error(error.message);
  }
}

export async function getListingBuilderDraft(
  query: ListingBuilderDraftQuery,
  accessToken?: string,
): Promise<ListingBuilderDraftRecord | null> {
  const supabase = createListingBuilderServerClient(accessToken);

  if (!supabase) {
    return readListingBuilderDraftFromLocalStore(query);
  }

  const ownerEmail = query.draftId
    ? draftOwnerKey(query.dealershipId, query.draftId)
    : null;

  let selectQuery = supabase
    .from("dealer_onboarding_drafts")
    .select("owner_email, current_step_index, revision, updated_at, payload")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (ownerEmail) {
    selectQuery = selectQuery.eq("owner_email", ownerEmail);
  } else {
    selectQuery = selectQuery.ilike("owner_email", `${query.dealershipId}:%`);
  }

  const { data, error } = await selectQuery;
  if (error) {
    if (isMissingOnboardingDraftTableError(new Error(error.message))) {
      return readListingBuilderDraftFromLocalStore(query);
    }
    throw new Error(error.message);
  }

  const record = data?.[0];
  if (!record?.owner_email || !record.payload) {
    return null;
  }

  const prefix = `${query.dealershipId}:`;
  return {
    draftId: String(record.owner_email).startsWith(prefix)
      ? String(record.owner_email).slice(prefix.length)
      : String(record.owner_email),
    currentStepIndex: Number(record.current_step_index ?? 0),
    revision: Number(record.revision ?? 0),
    updatedAt: String(record.updated_at ?? new Date().toISOString()),
    payload: record.payload as ListingBuilderDraftRequest["payload"],
  };
}

async function resolveExistingPublishedVehicleId(
  request: ListingBuilderPublishRequest,
  accessToken?: string,
): Promise<string | null> {
  if (!request.draftId) return null;

  const supabase = createListingBuilderServerClient(accessToken);
  if (!supabase) {
    const store = await readPlatformStore();
    const key = `publish:${request.dealershipId}:${request.draftId}:${request.publishNow ? "published" : "draft"}`;
    const existingAudit = store.inventoryAudit.find((entry) => {
      if (entry.dealershipId !== request.dealershipId || entry.action !== "listing-builder-publish") {
        return false;
      }
      const payload = parseListingBuilderAuditPayload(entry.payload);
      return payload.idempotencyKey === key;
    });
    return existingAudit?.vehicleId ?? null;
  }

  const key = `publish:${request.dealershipId}:${request.draftId}:${request.publishNow ? "published" : "draft"}`;
  let data: Array<{ vehicle_id: string | null; payload: string | null }> | null = null;
  let error: Error | null = null;

  try {
    const response = await withSupabaseTimeout(
      supabase
        .from("inventory_vehicle_audit")
        .select("vehicle_id, payload")
        .eq("dealership_id", request.dealershipId)
        .eq("action", "listing-builder-publish")
        .order("created_at", { ascending: false })
        .limit(50),
      "publish audit lookup",
    );
    data = response.data as Array<{ vehicle_id: string | null; payload: string | null }> | null;
    error = response.error ? new Error(response.error.message) : null;
  } catch (caught) {
    if (isSupabaseTransientError(caught)) {
      const store = await readPlatformStore();
      const existingAudit = store.inventoryAudit.find((entry) => {
        if (entry.dealershipId !== request.dealershipId || entry.action !== "listing-builder-publish") {
          return false;
        }
        const payload = parseListingBuilderAuditPayload(entry.payload);
        return payload.idempotencyKey === key;
      });
      return existingAudit?.vehicleId ?? null;
    }
    throw caught;
  }

  if (error) {
    if (isMissingInventoryTableError(error) || isSupabaseTransientError(error)) {
      const store = await readPlatformStore();
      const existingAudit = store.inventoryAudit.find((entry) => {
        if (entry.dealershipId !== request.dealershipId || entry.action !== "listing-builder-publish") {
          return false;
        }
        const payload = parseListingBuilderAuditPayload(entry.payload);
        return payload.idempotencyKey === key;
      });
      return existingAudit?.vehicleId ?? null;
    }
    throw new Error(error.message);
  }

  const match = data?.find((row) => {
    const payload = parseListingBuilderAuditPayload(row.payload as string | null);
    return payload.idempotencyKey === key;
  });

  return (match?.vehicle_id as string | undefined) ?? null;
}

async function cleanupPublishedDraft(
  dealershipId: string,
  draftId: string | undefined,
  accessToken?: string,
): Promise<void> {
  if (!draftId) return;

  const ownerEmail = draftOwnerKey(dealershipId, draftId);
  const supabase = createListingBuilderServerClient(accessToken);
  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      onboardingDrafts: current.onboardingDrafts.filter((draft) => draft.ownerEmail !== ownerEmail),
    }));
    return;
  }

  const { error } = await supabase
    .from("dealer_onboarding_drafts")
    .delete()
    .eq("owner_email", ownerEmail);

  if (error) {
    if (isMissingOnboardingDraftTableError(new Error(error.message))) {
      await updatePlatformStore((current) => ({
        ...current,
        onboardingDrafts: current.onboardingDrafts.filter((draft) => draft.ownerEmail !== ownerEmail),
      }));
      return;
    }
    throw new Error(error.message);
  }
}

async function resolveBranchId(
  dealershipId: string,
  requestedBranchId: string | undefined,
  accessToken?: string,
): Promise<string> {
  if (requestedBranchId) return requestedBranchId;

  const supabase = createListingBuilderServerClient(accessToken);
  if (!supabase) {
    return resolveBranchIdFromStore(dealershipId);
  }

  let data: { id: string } | null = null;
  let error: Error | null = null;

  try {
    const response = await withSupabaseTimeout(
      supabase
        .from("dealership_branches")
        .select("id")
        .eq("dealership_id", dealershipId)
        .limit(1)
        .single(),
      "branch lookup",
    );
    data = response.data as { id: string } | null;
    error = response.error ? new Error(response.error.message) : null;
  } catch (caught) {
    if (isSupabaseTransientError(caught)) {
      return resolveBranchIdFromStore(dealershipId);
    }
    throw caught;
  }

  if (error) {
    return resolveBranchIdFromStore(dealershipId);
  }

  if (!data?.id) {
    return resolveBranchIdFromStore(dealershipId);
  }

  return data.id as string;
}

interface VehicleIdentityQuery {
  readonly dealershipId: string;
  readonly vehicleId?: string;
  readonly stockNumber: string;
  readonly vin: string;
}

async function assertUniqueVehicleIdentityInLocalStore(query: VehicleIdentityQuery): Promise<void> {
  const store = await readPlatformStore();
  const duplicate = store.inventoryVehicles.find((vehicle) => (
    vehicle.dealershipId === query.dealershipId
    && vehicle.id !== query.vehicleId
    && vehicle.lifecycleStatus !== "deleted"
    && ((query.stockNumber && vehicle.stockNumber === query.stockNumber) || (query.vin && vehicle.vin === query.vin))
  ));

  if (duplicate) {
    throw new Error("Duplicate protection: stock number or VIN already exists in inventory.");
  }
}

async function assertUniqueVehicleIdentity(params: {
  readonly dealershipId: string;
  readonly vehicleId?: string;
  readonly stockNumber: string;
  readonly vin: string;
  readonly accessToken?: string;
}): Promise<void> {
  const stockNumber = params.stockNumber.trim();
  const vin = params.vin.trim();
  if (!stockNumber && !vin) return;

  const query: VehicleIdentityQuery = {
    dealershipId: params.dealershipId,
    vehicleId: params.vehicleId,
    stockNumber,
    vin,
  };

  // Selected the same way as every other persistence path in this service: without a
  // Supabase session the inventory tables are unreachable, so the local store is the
  // authoritative source. Each fallback below terminates in the local store rather than
  // re-entering this function, which would otherwise retry an identical failing query forever.
  const supabase = createListingBuilderServerClient(params.accessToken);
  if (!supabase) {
    return assertUniqueVehicleIdentityInLocalStore(query);
  }

  let data: Array<{ id: string; stock_number: string | null; vin: string | null; lifecycle_status: string | null }> | null = null;
  let error: Error | null = null;

  try {
    const response = await withSupabaseTimeout(
      supabase
        .from("inventory_vehicles")
        .select("id, stock_number, vin, lifecycle_status")
        .eq("dealership_id", params.dealershipId)
        .neq("lifecycle_status", "deleted"),
      "inventory duplicate scan",
    );
    data = response.data as Array<{ id: string; stock_number: string | null; vin: string | null; lifecycle_status: string | null }> | null;
    error = response.error ? new Error(response.error.message) : null;
  } catch (caught) {
    if (isSupabaseTransientError(caught)) {
      return assertUniqueVehicleIdentityInLocalStore(query);
    }
    throw caught;
  }

  if (error) {
    if (isMissingInventoryTableError(error) || isSupabaseTransientError(error)) {
      return assertUniqueVehicleIdentityInLocalStore(query);
    }
    throw new Error(error.message);
  }

  const duplicate = (data ?? []).find((vehicle) => (
    vehicle.id !== params.vehicleId
    && ((stockNumber && vehicle.stock_number === stockNumber) || (vin && vehicle.vin === vin))
  ));

  if (duplicate) {
    throw new Error("Duplicate protection: stock number or VIN already exists in inventory.");
  }
}

async function persistListingToLocalStore(params: {
  readonly request: ListingBuilderPublishRequest;
  readonly actorId: string;
  readonly branchId: string;
  readonly vehicleId: string;
  readonly nowIso: string;
  readonly lifecycleStatus: "draft" | "published";
  readonly computedTitle: string;
  readonly vin: string;
  readonly registration: string;
  readonly mileage: number;
  readonly askingPriceCents: number;
}): Promise<void> {
  const {
    request,
    actorId,
    branchId,
    vehicleId,
    nowIso,
    lifecycleStatus,
    computedTitle,
    vin,
    registration,
    mileage,
    askingPriceCents,
  } = params;

  await updatePlatformStore((current) => ({
    ...current,
    inventoryVehicles: [
      ...current.inventoryVehicles.filter((vehicle) => vehicle.id !== vehicleId),
      {
        id: vehicleId,
        dealershipId: request.dealershipId,
        branchId,
        stockNumber: request.payload.identification.stockNumber || `STK-${vehicleId.slice(0, 8).toUpperCase()}`,
        vin,
        registrationNumber: registration,
        title: computedTitle,
        make: request.payload.identification.make || "Unknown",
        model: request.payload.identification.model || "Unknown",
        variant: request.payload.identification.variant || null,
        year: Number(request.payload.identification.year || new Date().getFullYear()),
        mileageKm: Number.isFinite(mileage) ? mileage : 0,
        askingPriceCents,
        currency: "ZAR",
        lifecycleStatus,
        description: request.payload.descriptionBuilder.description || request.payload.description || null,
        seoTitle: request.payload.descriptionBuilder.seoTitle || null,
        seoDescription: request.payload.descriptionBuilder.seoDescription || null,
        estimatedDaysToSell: null,
        leadCount30d: 0,
        colour: request.payload.specifications.colour || null,
        fuel: request.payload.specifications.fuel || null,
        transmission: request.payload.specifications.transmission || null,
        engine: request.payload.specifications.engine || null,
        bodyType: request.payload.specifications.bodyType || null,
        createdBy: actorId,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    inventoryMedia: [
      ...current.inventoryMedia.filter((media) => media.vehicleId !== vehicleId),
      ...request.payload.media
        .filter((media) => media.kind === "photo")
        .map((media, index) => ({
          id: crypto.randomUUID(),
          dealershipId: request.dealershipId,
          vehicleId,
          fileName: media.name,
          fileUrl: media.previewUrl,
          isPrimary: media.isPrimary,
          sortOrder: index + 1,
          qualityStatus: "review" as const,
          processingStatus: "uploaded" as const,
          aiEnhancementStatus: "not-started",
          createdAt: nowIso,
        })),
    ],
    inventoryDocuments: request.payload.licenceDisc.fileUrl
      ? [
          ...current.inventoryDocuments.filter((document) => document.vehicleId !== vehicleId),
          {
            id: crypto.randomUUID(),
            dealershipId: request.dealershipId,
            vehicleId,
            documentType: "registration-papers",
            fileName: request.payload.licenceDisc.fileName || "licence-disc",
            fileUrl: request.payload.licenceDisc.fileUrl,
            uploadedBy: actorId,
            uploadedAt: nowIso,
          },
        ]
      : current.inventoryDocuments.filter((document) => document.vehicleId !== vehicleId),
    inventoryPriceHistory: [
      ...current.inventoryPriceHistory,
      {
        id: crypto.randomUUID(),
        dealershipId: request.dealershipId,
        vehicleId,
        priceCents: askingPriceCents,
        reason: "Initial listing publish",
        changedBy: actorId,
        changedAt: nowIso,
      },
    ],
    inventoryHistory: [
      ...current.inventoryHistory,
      {
        id: crypto.randomUUID(),
        dealershipId: request.dealershipId,
        vehicleId,
        eventType: "listing-builder-publish",
        message: `Listing created with lifecycle status ${lifecycleStatus}`,
        createdAt: nowIso,
      },
    ],
    inventoryAudit: [
      ...current.inventoryAudit,
      {
        id: crypto.randomUUID(),
        dealershipId: request.dealershipId,
        vehicleId,
        actorId,
        actorType: "user",
        action: "listing-builder-publish",
        payload: JSON.stringify(createListingBuilderAuditPayload({
          dealershipId: request.dealershipId,
          draftId: request.draftId,
          publishNow: request.publishNow,
          payload: request.payload,
        })),
        createdAt: nowIso,
      },
    ],
    marketAnalyticsEvents: [
      ...current.marketAnalyticsEvents,
      {
        id: crypto.randomUUID(),
        dealershipId: request.dealershipId,
        vehicleId,
        eventType: "price-change",
        eventName: "listing-initial-price",
        eventTimestamp: nowIso,
        actorId,
        actorType: "user",
        sessionId: null,
        source: "listing-builder",
        payload: { priceCents: askingPriceCents, reason: "Initial listing publish" },
        createdAt: nowIso,
      },
      {
        id: crypto.randomUUID(),
        dealershipId: request.dealershipId,
        vehicleId,
        eventType: "conversion-event",
        eventName: request.publishNow ? "listing-published" : "listing-draft-created",
        eventTimestamp: nowIso,
        actorId,
        actorType: "user",
        sessionId: null,
        source: "listing-builder",
        payload: { publishNow: request.publishNow, lifecycleStatus },
        createdAt: nowIso,
      },
    ],
  }));
}

export async function publishListingBuilder(
  request: ListingBuilderPublishRequest,
  accessToken?: string,
  traceId = `pcp001e-publish-${Math.random().toString(36).slice(2, 10)}`,
): Promise<PublishListingResult> {
  const trace: PublishTrace = {
    traceId,
    startedAt: Date.now(),
  };
  logPublishPhase(trace, "request.received", {
    dealershipId: request.dealershipId,
    draftId: request.draftId,
    publishNow: request.publishNow,
    hasVehicleId: Boolean(request.vehicleId),
    hasAccessToken: Boolean(accessToken),
  });

  let qualityScore: number | null = null;
  if (request.publishNow) {
    logPublishPhase(trace, "validation.start");
    const readiness = evaluatePublishReadiness(request.payload);
    qualityScore = readiness.qualityScore;
    if (!readiness.isReady) {
      logPublishPhase(trace, "validation.blocked", {
        blockingIssue: readiness.blockingIssues[0] ?? "unknown",
      });
      throw new Error(readiness.blockingIssues[0] ?? "Listing is not ready to publish.");
    }
    logPublishPhase(trace, "validation.complete", { qualityScore });
  }

  logPublishPhase(trace, "idempotency.lookup.start");
  const existingVehicleId = await resolveExistingPublishedVehicleId(request, accessToken);
  logPublishPhase(trace, "idempotency.lookup.complete", {
    existingVehicleId,
  });
  if (!request.vehicleId && existingVehicleId) {
    logPublishPhase(trace, "idempotency.short-circuit");
    await cleanupPublishedDraft(request.dealershipId, request.draftId, accessToken);
    logPublishPhase(trace, "draft.cleanup.complete");
    return {
      vehicleId: existingVehicleId,
      lifecycleStatus: request.publishNow ? "published" : "draft",
      qualityScore,
    };
  }

  const supabase = createListingBuilderServerClient(accessToken);
  logPublishPhase(trace, "authorization.context", {
    persistenceMode: supabase ? "supabase" : "local-store",
  });
  let actorId = "system";

  if (supabase) {
    try {
      const authResult = await withSupabaseTimeout(supabase.auth.getUser(), "auth lookup");
      actorId = authResult.data.user?.id ?? "system";
    } catch (error) {
      if (!isSupabaseTransientError(error)) {
        throw error;
      }
    }
  }

  const branchId = await resolveBranchId(request.dealershipId, request.branchId, accessToken);
  logPublishPhase(trace, "dealer.lookup.complete", { branchId });

  const vehicleId = request.vehicleId ?? crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const lifecycleStatus = request.publishNow ? "published" : "draft";
  const mileage = Number(request.payload.specifications.mileage || 0);
  const askingPriceCents = Math.max(0, Math.round(Number(request.payload.pricing.sellingPrice || 0) * 100));

  const computedTitle = resolveListingTitle(request.payload);

  if (!computedTitle) {
    throw new Error("Vehicle title could not be derived.");
  }

  const vin = resolveListingVin(request.payload);
  if (!vin) {
    throw new Error("VIN is required before publishing.");
  }

  const registration = resolveListingRegistration(request.payload);
  if (!registration) {
    throw new Error("Registration number is required before publishing.");
  }

  logPublishPhase(trace, "duplicate-protection.start");
  await assertUniqueVehicleIdentity({
    dealershipId: request.dealershipId,
    vehicleId: request.vehicleId,
    stockNumber: request.payload.identification.stockNumber,
    vin,
    accessToken,
  });
  logPublishPhase(trace, "duplicate-protection.complete");

  if (!supabase) {
    logPublishPhase(trace, "persistence.local.start");
    await persistListingToLocalStore({
      request,
      actorId,
      branchId,
      vehicleId,
      nowIso,
      lifecycleStatus,
      computedTitle,
      vin,
      registration,
      mileage,
      askingPriceCents,
    });
    logPublishPhase(trace, "persistence.local.complete");

    await cleanupPublishedDraft(request.dealershipId, request.draftId, accessToken);
    logPublishPhase(trace, "draft.cleanup.complete");

    logPublishPhase(trace, "response.ready", { vehicleId, lifecycleStatus, qualityScore });
    return {
      vehicleId,
      lifecycleStatus,
      qualityScore,
    };
  }

  try {
    logPublishPhase(trace, "persistence.inventory.start");
    await withSupabaseTimeout((async () => {
      const vehicleMutation = {
      branch_id: branchId,
      stock_number: request.payload.identification.stockNumber || `STK-${vehicleId.slice(0, 8).toUpperCase()}`,
      vin,
      registration_number: registration,
      title: computedTitle,
      make: request.payload.identification.make || "Unknown",
      model: request.payload.identification.model || "Unknown",
      year: Number(request.payload.identification.year || new Date().getFullYear()),
      mileage_km: Number.isFinite(mileage) ? mileage : 0,
      asking_price_cents: askingPriceCents,
      currency: "ZAR",
      lifecycle_status: lifecycleStatus,
      description: request.payload.descriptionBuilder.description || request.payload.description || null,
      seo_title: request.payload.descriptionBuilder.seoTitle || null,
      seo_description: request.payload.descriptionBuilder.seoDescription || null,
      estimated_days_to_sell: null,
      lead_count_30d: 0,
      updated_at: nowIso,
    };

      const { error: vehicleError } = request.vehicleId
        ? await supabase
          .from("inventory_vehicles")
          .update(vehicleMutation)
          .eq("id", vehicleId)
          .eq("dealership_id", request.dealershipId)
        : await supabase
          .from("inventory_vehicles")
          .insert({
            id: vehicleId,
            dealership_id: request.dealershipId,
            created_by: actorId,
            created_at: nowIso,
            ...vehicleMutation,
          });

      if (vehicleError) {
        throw new Error(vehicleError.message);
      }

      if (request.vehicleId) {
        const { error: clearMediaError } = await supabase
          .from("inventory_vehicle_media")
          .delete()
          .eq("vehicle_id", vehicleId)
          .eq("dealership_id", request.dealershipId);

        if (clearMediaError) throw new Error(clearMediaError.message);

        const { error: clearDocError } = await supabase
          .from("inventory_vehicle_documents")
          .delete()
          .eq("vehicle_id", vehicleId)
          .eq("dealership_id", request.dealershipId);

        if (clearDocError) throw new Error(clearDocError.message);
      }

      if (request.payload.media.length > 0) {
        const rows = request.payload.media
          .filter((media) => media.kind === "photo")
          .map((media, index) => ({
            id: crypto.randomUUID(),
            dealership_id: request.dealershipId,
            vehicle_id: vehicleId,
            file_name: media.name,
            file_url: media.previewUrl,
            is_primary: media.isPrimary,
            sort_order: index + 1,
            quality_status: "review",
            processing_status: "uploaded",
            ai_enhancement_status: "not-started",
            created_at: nowIso,
          }));

        if (rows.length > 0) {
          const { error: mediaError } = await supabase.from("inventory_vehicle_media").insert(rows);
          if (mediaError) throw new Error(mediaError.message);
        }
      }

      if (request.payload.licenceDisc.fileUrl) {
        const { error: docError } = await supabase.from("inventory_vehicle_documents").insert({
          id: crypto.randomUUID(),
          dealership_id: request.dealershipId,
          vehicle_id: vehicleId,
          document_type: "registration-papers",
          file_name: request.payload.licenceDisc.fileName || "licence-disc",
          file_url: request.payload.licenceDisc.fileUrl,
          uploaded_by: actorId,
          uploaded_at: nowIso,
        });

        if (docError) throw new Error(docError.message);
      }

      const { error: priceHistoryError } = await supabase.from("inventory_vehicle_price_history").insert({
        id: crypto.randomUUID(),
        dealership_id: request.dealershipId,
        vehicle_id: vehicleId,
        price_cents: askingPriceCents,
        reason: "Initial listing publish",
        changed_by: actorId,
        changed_at: nowIso,
      });

      if (priceHistoryError) throw new Error(priceHistoryError.message);

      await logMarketAnalyticsEvent({
        supabase,
        dealershipId: request.dealershipId,
        vehicleId,
        eventType: "price-change",
        eventName: "listing-initial-price",
        actorId,
        payload: {
          priceCents: askingPriceCents,
          reason: "Initial listing publish",
        },
      });

      const { error: historyError } = await supabase.from("inventory_vehicle_history").insert({
        id: crypto.randomUUID(),
        dealership_id: request.dealershipId,
        vehicle_id: vehicleId,
        event_type: "listing-builder-publish",
        message: `Listing created with lifecycle status ${lifecycleStatus}`,
        created_at: nowIso,
      });

      if (historyError) throw new Error(historyError.message);

      const { error: auditError } = await supabase.from("inventory_vehicle_audit").insert({
        id: crypto.randomUUID(),
        dealership_id: request.dealershipId,
        vehicle_id: vehicleId,
        actor_id: actorId,
        actor_type: "user",
        action: "listing-builder-publish",
        payload: JSON.stringify(createListingBuilderAuditPayload({
          dealershipId: request.dealershipId,
          draftId: request.draftId,
          publishNow: request.publishNow,
          payload: request.payload,
        })),
        created_at: nowIso,
      });

      if (auditError) throw new Error(auditError.message);

      await logMarketAnalyticsEvent({
        supabase,
        dealershipId: request.dealershipId,
        vehicleId,
        eventType: "conversion-event",
        eventName: request.publishNow ? "listing-published" : "listing-draft-created",
        actorId,
        payload: {
          publishNow: request.publishNow,
          lifecycleStatus,
        },
      });
    })(), "inventory publish workflow", 12000);
    logPublishPhase(trace, "persistence.inventory.complete");
  } catch (error) {
    // No local fallback. Silently writing to the local store on a Supabase failure is what allowed
    // the vehicle split-brain to persist undetected: publish reported success while the engine,
    // reading Supabase, could not see the listing. A failed publish must fail loudly.
    logPublishPhase(trace, "persistence.inventory.error", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  await cleanupPublishedDraft(request.dealershipId, request.draftId, accessToken);
  logPublishPhase(trace, "draft.cleanup.complete");

  logPublishPhase(trace, "response.ready", { vehicleId, lifecycleStatus, qualityScore });

  return {
    vehicleId,
    lifecycleStatus,
    qualityScore,
  };
}
