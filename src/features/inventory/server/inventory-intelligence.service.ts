import { createSupabaseServerClient } from "@/lib/supabase";
import { createDomainServerClient } from "@/lib/supabase/service-client";
import { readPlatformStore, updatePlatformStore } from "@/lib/local-persistence/platform-store";
import {
  analyzeIntelligenceBundle,
  analyzeListingQuality,
} from "@/features/intelligence/server/intelligence.service";
import type {
  BulkInventoryActionRequest,
  InventoryDashboardPayload,
  InventoryLifecycleStatus,
  InventoryListPayload,
  InventoryListQuery,
  InventoryRecommendation,
  InventoryVehicleListItem,
  VehicleWorkspacePayload,
} from "@/features/inventory/types/inventory-intelligence.types";

interface InventoryVehicleRow {
  readonly id: string;
  readonly dealership_id: string;
  readonly branch_id: string;
  readonly stock_number: string;
  readonly vin: string;
  readonly registration_number: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly mileage_km: number;
  readonly asking_price_cents: number;
  readonly currency: string;
  readonly lifecycle_status: InventoryLifecycleStatus;
  readonly description: string | null;
  readonly seo_title: string | null;
  readonly seo_description: string | null;
  readonly estimated_days_to_sell: number | null;
  readonly lead_count_30d: number;
  readonly created_at: string;
  readonly updated_at: string;
}

interface InventoryMediaRow {
  readonly id: string;
  readonly vehicle_id: string;
  readonly file_url: string;
  readonly is_primary: boolean;
  readonly sort_order: number;
  readonly quality_status: "good" | "review" | "poor";
  readonly processing_status: "uploaded" | "processing" | "ready";
}

interface InventoryDocumentRow {
  readonly id: string;
  readonly vehicle_id: string;
  readonly document_type: string;
  readonly file_name: string;
  readonly file_url: string;
  readonly uploaded_by: string;
  readonly uploaded_at: string;
}

interface PriceHistoryRow {
  readonly id: string;
  readonly vehicle_id: string;
  readonly price_cents: number;
  readonly reason: string;
  readonly changed_by: string;
  readonly changed_at: string;
}

interface HistoryRow {
  readonly id: string;
  readonly vehicle_id: string;
  readonly event_type: string;
  readonly message: string;
  readonly created_at: string;
}

interface AuditRow {
  readonly id: string;
  readonly vehicle_id: string;
  readonly actor_id: string;
  readonly actor_type: "user" | "system";
  readonly action: string;
  readonly payload: string;
  readonly created_at: string;
}

const VALID_LIFECYCLE_TRANSITIONS: Readonly<Record<InventoryLifecycleStatus, readonly InventoryLifecycleStatus[]>> = {
  draft: ["ai-review", "ready-to-publish", "published", "archived", "deleted"],
  "ai-review": ["draft", "ready-to-publish", "published", "archived", "deleted"],
  "ready-to-publish": ["ai-review", "draft", "published", "archived", "deleted"],
  published: ["performance-monitoring", "reserved", "sold", "archived", "deleted"],
  reserved: ["published", "sold", "archived", "deleted"],
  "performance-monitoring": ["published", "reserved", "sold", "archived", "deleted"],
  sold: ["archived", "deleted"],
  archived: ["published", "draft", "ai-review", "ready-to-publish", "reserved", "sold", "deleted"],
  deleted: [],
};

function isValidLifecycleTransition(
  fromStatus: InventoryLifecycleStatus,
  toStatus: InventoryLifecycleStatus,
): boolean {
  if (fromStatus === toStatus) {
    return true;
  }

  return VALID_LIFECYCLE_TRANSITIONS[fromStatus].includes(toStatus);
}

function getLifecycleEventName(status: InventoryLifecycleStatus): string {
  if (status === "reserved") return "vehicle-reserved";
  if (status === "sold") return "vehicle-sold";
  if (status === "archived") return "vehicle-archived";
  if (status === "published") return "vehicle-published";
  if (status === "deleted") return "vehicle-soft-deleted";
  return "vehicle-lifecycle-updated";
}

function requiresAttention(score: number, vehicle: InventoryVehicleRow, photos: readonly InventoryMediaRow[]): boolean {
  return (
    score < 70 ||
    photos.length < 6 ||
    photos.some((photo) => photo.quality_status !== "good") ||
    vehicle.lifecycle_status === "draft" ||
    vehicle.lifecycle_status === "ai-review"
  );
}

async function computeListingQuality(
  vehicle: InventoryVehicleRow,
  photos: readonly InventoryMediaRow[],
  serviceHistoryAvailable = false,
): Promise<number> {
  const result = await analyzeListingQuality({
    listingId: vehicle.id,
    title: vehicle.title,
    description: vehicle.description ?? undefined,
    seoTitle: vehicle.seo_title ?? undefined,
    seoDescription: vehicle.seo_description ?? undefined,
    askingPriceCents: vehicle.asking_price_cents,
    currency: vehicle.currency,
    vin: vehicle.vin,
    registrationNumber: vehicle.registration_number,
    mileageKm: vehicle.mileage_km,
    photoCount: photos.length,
    hasPrimaryPhoto: photos.some((photo) => photo.is_primary),
    serviceHistoryAvailable,
  });

  return result.qualityScore;
}

async function mapVehicle(
  vehicle: InventoryVehicleRow,
  photos: readonly InventoryMediaRow[],
  serviceHistoryAvailable = false,
): Promise<InventoryVehicleListItem> {
  const score = await computeListingQuality(vehicle, photos, serviceHistoryAvailable);
  return {
    id: vehicle.id,
    dealershipId: vehicle.dealership_id,
    branchId: vehicle.branch_id,
    stockNumber: vehicle.stock_number,
    vin: vehicle.vin,
    registrationNumber: vehicle.registration_number,
    title: vehicle.title,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    mileageKm: vehicle.mileage_km,
    askingPriceCents: vehicle.asking_price_cents,
    currency: vehicle.currency,
    lifecycleStatus: vehicle.lifecycle_status,
    listingQualityScore: score,
    photoCount: photos.length,
    hasPrimaryPhoto: photos.some((photo) => photo.is_primary),
    hasDescription: Boolean(vehicle.description),
    hasSeo: Boolean(vehicle.seo_title && vehicle.seo_description),
    requiresAttention: requiresAttention(score, vehicle, photos),
    daysInStock: Math.max(0, Math.floor((Date.now() - Date.parse(vehicle.created_at)) / (1000 * 60 * 60 * 24))),
    estimatedDaysToSell: vehicle.estimated_days_to_sell,
    leadCount30d: vehicle.lead_count_30d,
    updatedAt: vehicle.updated_at,
    createdAt: vehicle.created_at,
  };
}

function sortVehicles(items: InventoryVehicleListItem[], sort: InventoryListQuery["sort"]): InventoryVehicleListItem[] {
  const selected = sort ?? "updated-at";
  return [...items].sort((a, b) => {
    switch (selected) {
      case "listing-quality":
        return b.listingQualityScore - a.listingQualityScore;
      case "price":
        return b.askingPriceCents - a.askingPriceCents;
      case "days-to-sell":
        return (a.estimatedDaysToSell ?? Number.MAX_SAFE_INTEGER) - (b.estimatedDaysToSell ?? Number.MAX_SAFE_INTEGER);
      case "days-in-stock":
        return b.daysInStock - a.daysInStock;
      case "created-at":
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      case "updated-at":
      default:
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    }
  });
}

function toInventoryRecommendation(rec: {
  readonly id: string;
  readonly title: string;
  readonly category: "listing-quality" | "images" | "pricing" | "documents" | "publishing" | "market";
}): InventoryRecommendation {
  const impact: InventoryRecommendation["impact"] =
    rec.category === "pricing"
      ? "pricing"
      : rec.category === "market"
        ? "turnover"
        : rec.category === "images" || rec.category === "publishing"
          ? "conversion"
          : "quality";

  return {
    id: rec.id,
    label: rec.title,
    impact,
  };
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

async function readVehicleRowsFromStore(dealershipId: string): Promise<readonly InventoryVehicleRow[]> {
  const store = await readPlatformStore();
  return store.inventoryVehicles
    .filter((item) => item.dealershipId === dealershipId && item.lifecycleStatus !== "deleted")
    .map((item) => ({
      id: item.id,
      dealership_id: item.dealershipId,
      branch_id: item.branchId,
      stock_number: item.stockNumber,
      vin: item.vin,
      registration_number: item.registrationNumber,
      title: item.title,
      make: item.make,
      model: item.model,
      year: item.year,
      mileage_km: item.mileageKm,
      asking_price_cents: item.askingPriceCents,
      currency: item.currency,
      lifecycle_status: item.lifecycleStatus as InventoryLifecycleStatus,
      description: item.description,
      seo_title: item.seoTitle,
      seo_description: item.seoDescription,
      estimated_days_to_sell: item.estimatedDaysToSell,
      lead_count_30d: item.leadCount30d,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));
}

async function readMediaRowsFromStore(dealershipId: string): Promise<readonly InventoryMediaRow[]> {
  const store = await readPlatformStore();
  return store.inventoryMedia
    .filter((item) => item.dealershipId === dealershipId)
    .map((item) => ({
      id: item.id,
      vehicle_id: item.vehicleId,
      file_url: item.fileUrl,
      is_primary: item.isPrimary,
      sort_order: item.sortOrder,
      quality_status: item.qualityStatus,
      processing_status: item.processingStatus,
    }));
}

async function fetchVehicleRows(dealershipId: string, accessToken?: string): Promise<readonly InventoryVehicleRow[]> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    return readVehicleRowsFromStore(dealershipId);
  }

  const { data, error } = await supabase
    .from("inventory_vehicles")
    .select("*")
    .eq("dealership_id", dealershipId)
    .neq("lifecycle_status", "deleted");

  if (error) {
    if (isMissingInventoryTableError(new Error(error.message))) {
      return readVehicleRowsFromStore(dealershipId);
    }
    throw new Error(error.message);
  }

  const remote = (data ?? []) as InventoryVehicleRow[];
  const local = await readVehicleRowsFromStore(dealershipId);
  const merged = new Map<string, InventoryVehicleRow>();
  for (const item of local) merged.set(item.id, item);
  for (const item of remote) merged.set(item.id, item);
  return Array.from(merged.values());
}

async function fetchMediaForDealership(dealershipId: string, accessToken?: string): Promise<readonly InventoryMediaRow[]> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    return readMediaRowsFromStore(dealershipId);
  }

  const { data, error } = await supabase
    .from("inventory_vehicle_media")
    .select("*")
    .eq("dealership_id", dealershipId);

  if (error) {
    if (isMissingInventoryTableError(new Error(error.message))) {
      return readMediaRowsFromStore(dealershipId);
    }
    throw new Error(error.message);
  }

  const remote = (data ?? []) as InventoryMediaRow[];
  const local = await readMediaRowsFromStore(dealershipId);
  const merged = new Map<string, InventoryMediaRow>();
  for (const item of local) merged.set(item.id, item);
  for (const item of remote) merged.set(item.id, item);
  return Array.from(merged.values());
}

function groupMedia(rows: readonly InventoryMediaRow[]): Map<string, InventoryMediaRow[]> {
  const map = new Map<string, InventoryMediaRow[]>();
  for (const row of rows) {
    const current = map.get(row.vehicle_id) ?? [];
    current.push(row);
    map.set(row.vehicle_id, current);
  }
  return map;
}

export async function getInventoryDashboard(
  dealershipId: string,
  accessToken?: string,
): Promise<InventoryDashboardPayload> {
  const vehicles = await fetchVehicleRows(dealershipId, accessToken);
  const media = await fetchMediaForDealership(dealershipId, accessToken);
  const mediaMap = groupMedia(media);
  const mapped = await Promise.all(
    vehicles.map((vehicle) => mapVehicle(vehicle, mediaMap.get(vehicle.id) ?? [])),
  );

  const stats = {
    totalInventory: mapped.length,
    draftListings: mapped.filter((item) => item.lifecycleStatus === "draft").length,
    publishedListings: mapped.filter((item) => item.lifecycleStatus === "published" || item.lifecycleStatus === "performance-monitoring" || item.lifecycleStatus === "reserved").length,
    soldVehicles: mapped.filter((item) => item.lifecycleStatus === "sold").length,
    archivedVehicles: mapped.filter((item) => item.lifecycleStatus === "archived").length,
    requiringAttention: mapped.filter((item) => item.requiresAttention).length,
  };

  const insights = [
    {
      id: "ready",
      title: "Vehicles Ready to Publish",
      count: mapped.filter((item) => item.lifecycleStatus === "ready-to-publish").length,
      description: "Listings that can go live immediately.",
      action: "Publish now",
    },
    {
      id: "missing-photos",
      title: "Listings Missing Photos",
      count: mapped.filter((item) => item.photoCount < 6).length,
      description: "Photo depth is below quality threshold.",
      action: "Upload photos",
    },
    {
      id: "missing-info",
      title: "Listings Missing Information",
      count: mapped.filter((item) => !item.hasDescription || !item.hasSeo).length,
      description: "Core copy or SEO data is incomplete.",
      action: "Complete fields",
    },
    {
      id: "price-review",
      title: "Price Review Needed",
      count: mapped.filter((item) => item.daysInStock > 45 && item.lifecycleStatus !== "sold").length,
      description: "Long-stock vehicles likely need pricing intervention.",
      action: "Review pricing",
    },
    {
      id: "longest-unsold",
      title: "Longest Unsold Vehicles",
      count: mapped.filter((item) => item.daysInStock > 60 && item.lifecycleStatus !== "sold").length,
      description: "Vehicles at highest turnover risk.",
      action: "Prioritise actions",
    },
  ];

  const recentActivity = mapped
    .slice()
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 10)
    .map((item) => ({
      id: `activity-${item.id}`,
      vehicleId: item.id,
      actor: "System",
      eventType: "updated",
      message: `${item.title} updated in ${item.lifecycleStatus} stage`,
      createdAt: item.updatedAt,
    }));

  return {
    stats,
    insights,
    recentActivity,
  };
}

export async function listInventoryVehicles(
  query: InventoryListQuery,
  accessToken?: string,
): Promise<InventoryListPayload> {
  const vehicles = await fetchVehicleRows(query.dealershipId, accessToken);
  const media = await fetchMediaForDealership(query.dealershipId, accessToken);
  const mediaMap = groupMedia(media);

  let mapped = await Promise.all(
    vehicles.map((vehicle) => mapVehicle(vehicle, mediaMap.get(vehicle.id) ?? [])),
  );

  if (query.search) {
    const q = query.search.trim().toLowerCase();
    mapped = mapped.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.stockNumber.toLowerCase().includes(q) ||
      item.vin.toLowerCase().includes(q) ||
      item.registrationNumber.toLowerCase().includes(q),
    );
  }

  if (query.status) {
    mapped = mapped.filter((item) => item.lifecycleStatus === query.status);
  }

  mapped = sortVehicles(mapped, query.sort);

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 24;
  const start = (page - 1) * pageSize;

  return {
    items: mapped.slice(start, start + pageSize),
    total: mapped.length,
    page,
    pageSize,
  };
}

async function getVehicleWorkspaceFromStore(
  dealershipId: string,
  vehicleId: string,
  accessToken?: string,
): Promise<VehicleWorkspacePayload> {
  const list = await listInventoryVehicles({ dealershipId, pageSize: 1000 }, accessToken);
  const vehicle = list.items.find((item) => item.id === vehicleId);
  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const store = await readPlatformStore();
  const typedPhotos = store.inventoryMedia
    .filter((item) => item.vehicleId === vehicleId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      vehicle_id: item.vehicleId,
      file_url: item.fileUrl,
      is_primary: item.isPrimary,
      sort_order: item.sortOrder,
      quality_status: item.qualityStatus,
      processing_status: item.processingStatus,
    }));
  const typedDocs = store.inventoryDocuments
    .filter((item) => item.vehicleId === vehicleId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .map((item) => ({
      id: item.id,
      vehicle_id: item.vehicleId,
      document_type: item.documentType,
      file_name: item.fileName,
      file_url: item.fileUrl,
      uploaded_by: item.uploadedBy,
      uploaded_at: item.uploadedAt,
    }));
  const pricing = store.inventoryPriceHistory
    .filter((item) => item.vehicleId === vehicleId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
    .map((item) => ({
      id: item.id,
      vehicle_id: item.vehicleId,
      price_cents: item.priceCents,
      reason: item.reason,
      changed_by: item.changedBy,
      changed_at: item.changedAt,
    }));
  const history = store.inventoryHistory
    .filter((item) => item.vehicleId === vehicleId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => ({
      id: item.id,
      vehicle_id: item.vehicleId,
      event_type: item.eventType,
      message: item.message,
      created_at: item.createdAt,
    }));
  const audit = store.inventoryAudit
    .filter((item) => item.vehicleId === vehicleId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => ({
      id: item.id,
      vehicle_id: item.vehicleId,
      actor_id: item.actorId,
      actor_type: item.actorType as "user" | "system",
      action: item.action,
      payload: item.payload,
      created_at: item.createdAt,
    }));
  const localVehicle = store.inventoryVehicles.find((item) => item.id === vehicleId && item.dealershipId === dealershipId);
  if (!localVehicle) {
    throw new Error("Vehicle not found.");
  }

  const serviceHistoryAvailable = typedDocs.some((doc) => doc.document_type === "service-history");

  const intelligence = await analyzeIntelligenceBundle({
    listing: {
      listingId: vehicle.id,
      title: vehicle.title,
      description: localVehicle.description ?? undefined,
      seoTitle: localVehicle.seoTitle ?? undefined,
      seoDescription: localVehicle.seoDescription ?? undefined,
      askingPriceCents: vehicle.askingPriceCents,
      currency: vehicle.currency,
      vin: vehicle.vin,
      registrationNumber: vehicle.registrationNumber,
      mileageKm: vehicle.mileageKm,
      photoCount: typedPhotos.length,
      hasPrimaryPhoto: typedPhotos.some((photo) => photo.is_primary),
      serviceHistoryAvailable,
    },
    pricing: {
      listingId: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileageKm: vehicle.mileageKm,
      askingPriceCents: vehicle.askingPriceCents,
      currency: vehicle.currency,
      daysInStock: vehicle.daysInStock,
    },
    images: {
      listingId: vehicle.id,
      images: typedPhotos.map((photo) => ({ imageId: photo.id, width: null, height: null })),
    },
    market: {
      listingId: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      askingPriceCents: vehicle.askingPriceCents,
    },
    lifecycleStatus: vehicle.lifecycleStatus,
    leadCount30d: vehicle.leadCount30d,
    daysInStock: vehicle.daysInStock,
    serviceHistoryAvailable,
  });

  return {
    vehicle,
    recommendations: intelligence.dealerInsights.recommendations.map((rec) =>
      toInventoryRecommendation({ id: rec.id, title: rec.title, category: rec.category }),
    ),
    marketIntelligence: {
      marketPosition: intelligence.marketIntelligence.pricePositioning,
      estimatedDemand: intelligence.marketIntelligence.marketDemand,
      priceConfidence: "Awaiting live market data",
      daysToSellEstimate: intelligence.marketIntelligence.daysToSellEstimate,
      marketTrend: intelligence.marketIntelligence.supplyTrend,
      competitorComparison: "Awaiting live market data",
      liveConnected: false,
      label: "Awaiting live market data",
    },
    photos: typedPhotos.map((photo) => ({
      id: photo.id,
      url: photo.file_url,
      isPrimary: photo.is_primary,
      sortOrder: photo.sort_order,
      qualityStatus: photo.quality_status,
      processingStatus: photo.processing_status,
    })),
    documents: typedDocs.map((doc) => ({
      id: doc.id,
      type: doc.document_type as VehicleWorkspacePayload["documents"][number]["type"],
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      uploadedAt: doc.uploaded_at,
      uploadedBy: doc.uploaded_by,
    })),
    pricingHistory: pricing.map((point) => ({
      id: point.id,
      priceCents: point.price_cents,
      reason: point.reason,
      changedAt: point.changed_at,
      changedBy: point.changed_by,
    })),
    history: history.map((entry) => ({
      id: entry.id,
      eventType: entry.event_type,
      message: entry.message,
      createdAt: entry.created_at,
    })),
    auditTrail: audit.map((entry) => ({
      id: entry.id,
      actorId: entry.actor_id,
      actorType: entry.actor_type,
      action: entry.action,
      payload: entry.payload,
      createdAt: entry.created_at,
    })),
  };
}

export async function getVehicleWorkspace(
  dealershipId: string,
  vehicleId: string,
  accessToken?: string,
): Promise<VehicleWorkspacePayload> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    return getVehicleWorkspaceFromStore(dealershipId, vehicleId, accessToken);
  }

  try {
    const list = await listInventoryVehicles({ dealershipId, pageSize: 1000 }, accessToken);
    const vehicle = list.items.find((item) => item.id === vehicleId);
    if (!vehicle) {
      throw new Error("Vehicle not found.");
    }

    const { data: photos, error: photosError } = await supabase
      .from("inventory_vehicle_media")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("sort_order", { ascending: true });

    if (photosError) {
      if (isMissingInventoryTableError(new Error(photosError.message))) {
        return getVehicleWorkspaceFromStore(dealershipId, vehicleId, accessToken);
      }
      throw new Error(photosError.message);
    }

    const { data: docs, error: docsError } = await supabase
      .from("inventory_vehicle_documents")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("uploaded_at", { ascending: false });

    if (docsError) {
      if (isMissingInventoryTableError(new Error(docsError.message))) {
        return getVehicleWorkspaceFromStore(dealershipId, vehicleId, accessToken);
      }
      throw new Error(docsError.message);
    }

    const { data: pricing, error: pricingError } = await supabase
      .from("inventory_vehicle_price_history")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("changed_at", { ascending: false });

    if (pricingError) {
      if (isMissingInventoryTableError(new Error(pricingError.message))) {
        return getVehicleWorkspaceFromStore(dealershipId, vehicleId, accessToken);
      }
      throw new Error(pricingError.message);
    }

    const { data: history, error: historyError } = await supabase
      .from("inventory_vehicle_history")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false });

    if (historyError) {
      if (isMissingInventoryTableError(new Error(historyError.message))) {
        return getVehicleWorkspaceFromStore(dealershipId, vehicleId, accessToken);
      }
      throw new Error(historyError.message);
    }

    const { data: audit, error: auditError } = await supabase
      .from("inventory_vehicle_audit")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false });

    if (auditError) {
      if (isMissingInventoryTableError(new Error(auditError.message))) {
        return getVehicleWorkspaceFromStore(dealershipId, vehicleId, accessToken);
      }
      throw new Error(auditError.message);
    }

    const { data: vehicleRow, error: vehicleRowError } = await supabase
      .from("inventory_vehicles")
      .select("description, seo_title, seo_description")
      .eq("id", vehicleId)
      .eq("dealership_id", dealershipId)
      .single();

    if (vehicleRowError) {
      if (isMissingInventoryTableError(new Error(vehicleRowError.message))) {
        return getVehicleWorkspaceFromStore(dealershipId, vehicleId, accessToken);
      }
      throw new Error(vehicleRowError.message);
    }

    const typedDocs = (docs ?? []) as InventoryDocumentRow[];
    const typedPhotos = (photos ?? []) as InventoryMediaRow[];
    const serviceHistoryAvailable = typedDocs.some((doc) => doc.document_type === "service-history");

    const intelligence = await analyzeIntelligenceBundle({
      listing: {
        listingId: vehicle.id,
        title: vehicle.title,
        description: vehicleRow.description ?? undefined,
        seoTitle: vehicleRow.seo_title ?? undefined,
        seoDescription: vehicleRow.seo_description ?? undefined,
        askingPriceCents: vehicle.askingPriceCents,
        currency: vehicle.currency,
        vin: vehicle.vin,
        registrationNumber: vehicle.registrationNumber,
        mileageKm: vehicle.mileageKm,
        photoCount: typedPhotos.length,
        hasPrimaryPhoto: typedPhotos.some((photo) => photo.is_primary),
        serviceHistoryAvailable,
      },
      pricing: {
        listingId: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileageKm: vehicle.mileageKm,
        askingPriceCents: vehicle.askingPriceCents,
        currency: vehicle.currency,
        daysInStock: vehicle.daysInStock,
      },
      images: {
        listingId: vehicle.id,
        images: typedPhotos.map((photo) => ({
          imageId: photo.id,
          width: null,
          height: null,
        })),
      },
      market: {
        listingId: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        askingPriceCents: vehicle.askingPriceCents,
      },
      lifecycleStatus: vehicle.lifecycleStatus,
      leadCount30d: vehicle.leadCount30d,
      daysInStock: vehicle.daysInStock,
      serviceHistoryAvailable,
    });

    return {
      vehicle,
      recommendations: intelligence.dealerInsights.recommendations.map((rec) =>
        toInventoryRecommendation({
          id: rec.id,
          title: rec.title,
          category: rec.category,
        }),
      ),
      marketIntelligence: {
        marketPosition: intelligence.marketIntelligence.pricePositioning,
        estimatedDemand: intelligence.marketIntelligence.marketDemand,
        priceConfidence: "Awaiting live market data",
        daysToSellEstimate: intelligence.marketIntelligence.daysToSellEstimate,
        marketTrend: intelligence.marketIntelligence.supplyTrend,
        competitorComparison: "Awaiting live market data",
        liveConnected: intelligence.marketIntelligence.status !== "awaiting-live-market-data",
        label: intelligence.marketIntelligence.status === "awaiting-live-market-data"
          ? "Awaiting live market data"
          : "Live market intelligence available",
      },
      photos: typedPhotos.map((photo) => ({
        id: photo.id,
        url: photo.file_url,
        isPrimary: photo.is_primary,
        sortOrder: photo.sort_order,
        qualityStatus: photo.quality_status,
        processingStatus: photo.processing_status,
      })),
      documents: typedDocs.map((doc) => ({
        id: doc.id,
        type: doc.document_type as VehicleWorkspacePayload["documents"][number]["type"],
        fileName: doc.file_name,
        fileUrl: doc.file_url,
        uploadedAt: doc.uploaded_at,
        uploadedBy: doc.uploaded_by,
      })),
      pricingHistory: ((pricing ?? []) as PriceHistoryRow[]).map((point) => ({
        id: point.id,
        priceCents: point.price_cents,
        reason: point.reason,
        changedAt: point.changed_at,
        changedBy: point.changed_by,
      })),
      history: ((history ?? []) as HistoryRow[]).map((entry) => ({
        id: entry.id,
        eventType: entry.event_type,
        message: entry.message,
        createdAt: entry.created_at,
      })),
      auditTrail: ((audit ?? []) as AuditRow[]).map((entry) => ({
        id: entry.id,
        actorId: entry.actor_id,
        actorType: entry.actor_type,
        action: entry.action,
        payload: entry.payload,
        createdAt: entry.created_at,
      })),
    };
  } catch (error) {
    if (isMissingInventoryTableError(error)) {
      return getVehicleWorkspaceFromStore(dealershipId, vehicleId, accessToken);
    }
    throw error;
  }
}

async function logHistory(vehicleId: string, dealershipId: string, eventType: string, message: string, accessToken?: string) {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      inventoryHistory: [
        ...current.inventoryHistory,
        {
          id: crypto.randomUUID(),
          vehicleId,
          dealershipId,
          eventType,
          message,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    return;
  }

  await supabase.from("inventory_vehicle_history").insert({
    id: crypto.randomUUID(),
    vehicle_id: vehicleId,
    dealership_id: dealershipId,
    event_type: eventType,
    message,
    created_at: new Date().toISOString(),
  });
}

async function logAudit(vehicleId: string, dealershipId: string, action: string, payload: string, accessToken?: string) {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      inventoryAudit: [
        ...current.inventoryAudit,
        {
          id: crypto.randomUUID(),
          vehicleId,
          dealershipId,
          actorId: "system",
          actorType: "system",
          action,
          payload,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    return;
  }

  await supabase.from("inventory_vehicle_audit").insert({
    id: crypto.randomUUID(),
    vehicle_id: vehicleId,
    dealership_id: dealershipId,
    actor_id: "system",
    actor_type: "system",
    action,
    payload,
    created_at: new Date().toISOString(),
  });
}

async function logMarketAnalyticsEvent(params: {
  readonly vehicleId: string;
  readonly dealershipId: string;
  readonly eventType: "conversion-event";
  readonly eventName: string;
  readonly payload: Record<string, unknown>;
  readonly accessToken?: string;
}) {
  const supabase = createSupabaseServerClient(params.accessToken);
  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      marketAnalyticsEvents: [
        ...current.marketAnalyticsEvents,
        {
          id: crypto.randomUUID(),
          dealershipId: params.dealershipId,
          vehicleId: params.vehicleId,
          eventType: params.eventType,
          eventName: params.eventName,
          eventTimestamp: new Date().toISOString(),
          actorId: "system",
          actorType: "system",
          sessionId: null,
          source: "inventory-intelligence",
          payload: params.payload,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    return;
  }

  await supabase.from("market_analytics_events").insert({
    id: crypto.randomUUID(),
    dealership_id: params.dealershipId,
    vehicle_id: params.vehicleId,
    event_type: params.eventType,
    event_name: params.eventName,
    event_timestamp: new Date().toISOString(),
    actor_id: "system",
    actor_type: "system",
    source: "inventory-intelligence",
    payload: params.payload,
    created_at: new Date().toISOString(),
  });
}

async function getCurrentLifecycleStatus(
  dealershipId: string,
  vehicleId: string,
  accessToken?: string,
): Promise<InventoryLifecycleStatus | null> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    const store = await readPlatformStore();
    const vehicle = store.inventoryVehicles.find((item) => item.id === vehicleId && item.dealershipId === dealershipId);
    return (vehicle?.lifecycleStatus as InventoryLifecycleStatus | undefined) ?? null;
  }

  const { data, error } = await supabase
    .from("inventory_vehicles")
    .select("lifecycle_status")
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (error) {
    if (isMissingInventoryTableError(new Error(error.message))) {
      const store = await readPlatformStore();
      const vehicle = store.inventoryVehicles.find((item) => item.id === vehicleId && item.dealershipId === dealershipId);
      return (vehicle?.lifecycleStatus as InventoryLifecycleStatus | undefined) ?? null;
    }
    throw new Error(error.message);
  }

  if (!data?.lifecycle_status) {
    const store = await readPlatformStore();
    const vehicle = store.inventoryVehicles.find((item) => item.id === vehicleId && item.dealershipId === dealershipId);
    return (vehicle?.lifecycleStatus as InventoryLifecycleStatus | undefined) ?? null;
  }

  return data.lifecycle_status as InventoryLifecycleStatus;
}

async function getCurrentLifecycleStatuses(
  dealershipId: string,
  vehicleIds: readonly string[],
  accessToken?: string,
): Promise<ReadonlyMap<string, InventoryLifecycleStatus>> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    const store = await readPlatformStore();
    return new Map(
      store.inventoryVehicles
        .filter((item) => item.dealershipId === dealershipId && vehicleIds.includes(item.id))
        .map((item) => [item.id, item.lifecycleStatus as InventoryLifecycleStatus]),
    );
  }

  const { data, error } = await supabase
    .from("inventory_vehicles")
    .select("id, lifecycle_status")
    .eq("dealership_id", dealershipId)
    .in("id", vehicleIds as string[]);

  if (error) {
    if (isMissingInventoryTableError(new Error(error.message))) {
      const store = await readPlatformStore();
      return new Map(
        store.inventoryVehicles
          .filter((item) => item.dealershipId === dealershipId && vehicleIds.includes(item.id))
          .map((item) => [item.id, item.lifecycleStatus as InventoryLifecycleStatus]),
      );
    }
    throw new Error(error.message);
  }

  const map = new Map(
    (data ?? []).map((row) => [row.id as string, row.lifecycle_status as InventoryLifecycleStatus]),
  );

  if (map.size < vehicleIds.length) {
    const store = await readPlatformStore();
    for (const item of store.inventoryVehicles) {
      if (item.dealershipId !== dealershipId) continue;
      if (!vehicleIds.includes(item.id)) continue;
      if (!map.has(item.id)) {
        map.set(item.id, item.lifecycleStatus as InventoryLifecycleStatus);
      }
    }
  }

  return map;
}

export async function updateVehicleLifecycleStatus(
  dealershipId: string,
  vehicleId: string,
  status: InventoryLifecycleStatus,
  accessToken?: string,
): Promise<void> {
  const currentStatus = await getCurrentLifecycleStatus(dealershipId, vehicleId, accessToken);
  if (!currentStatus) {
    throw new Error("Vehicle not found.");
  }

  if (!isValidLifecycleTransition(currentStatus, status)) {
    throw new Error(`Invalid lifecycle transition: ${currentStatus} -> ${status}.`);
  }

  if (currentStatus === status) {
    await logAudit(
      vehicleId,
      dealershipId,
      "status-noop",
      JSON.stringify({ fromStatus: currentStatus, toStatus: status, idempotent: true }),
      accessToken,
    );
    return;
  }

  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      inventoryVehicles: current.inventoryVehicles.map((vehicle) =>
        vehicle.id === vehicleId && vehicle.dealershipId === dealershipId
          ? { ...vehicle, lifecycleStatus: status, updatedAt: new Date().toISOString() }
          : vehicle,
      ),
    }));

    await logHistory(vehicleId, dealershipId, "status-changed", `Lifecycle moved from ${currentStatus} to ${status}`, accessToken);
    await logAudit(vehicleId, dealershipId, "status-changed", JSON.stringify({ fromStatus: currentStatus, toStatus: status, idempotent: false }), accessToken);
    await logMarketAnalyticsEvent({
      vehicleId,
      dealershipId,
      eventType: "conversion-event",
      eventName: getLifecycleEventName(status),
      payload: { fromStatus: currentStatus, toStatus: status },
      accessToken,
    });
    return;
  }

  const { error } = await supabase
    .from("inventory_vehicles")
    .update({ lifecycle_status: status, updated_at: new Date().toISOString() })
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId);

  if (error) {
    if (isMissingInventoryTableError(new Error(error.message))) {
      await updatePlatformStore((current) => ({
        ...current,
        inventoryVehicles: current.inventoryVehicles.map((vehicle) =>
          vehicle.id === vehicleId && vehicle.dealershipId === dealershipId
            ? { ...vehicle, lifecycleStatus: status, updatedAt: new Date().toISOString() }
            : vehicle,
        ),
      }));
    } else {
      throw new Error(error.message);
    }
  }

  await updatePlatformStore((current) => ({
    ...current,
    inventoryVehicles: current.inventoryVehicles.map((vehicle) =>
      vehicle.id === vehicleId && vehicle.dealershipId === dealershipId
        ? { ...vehicle, lifecycleStatus: status, updatedAt: new Date().toISOString() }
        : vehicle,
    ),
  }));

  await logHistory(vehicleId, dealershipId, "status-changed", `Lifecycle moved from ${currentStatus} to ${status}`, accessToken);
  await logAudit(vehicleId, dealershipId, "status-changed", JSON.stringify({ fromStatus: currentStatus, toStatus: status, idempotent: false }), accessToken);
  await logMarketAnalyticsEvent({
    vehicleId,
    dealershipId,
    eventType: "conversion-event",
    eventName: getLifecycleEventName(status),
    payload: { fromStatus: currentStatus, toStatus: status },
    accessToken,
  });
}

export async function applyBulkInventoryAction(
  request: BulkInventoryActionRequest,
  accessToken?: string,
): Promise<void> {
  if (request.vehicleIds.length === 0) return;

  const targetStatus: InventoryLifecycleStatus = request.action === "archive"
    ? "archived"
    : request.action === "restore"
      ? "published"
    : request.action === "mark-ai-review"
      ? "ai-review"
      : "ready-to-publish";

  const currentStatuses = await getCurrentLifecycleStatuses(request.dealershipId, request.vehicleIds, accessToken);
  for (const vehicleId of request.vehicleIds) {
    const current = currentStatuses.get(vehicleId);
    if (!current) {
      throw new Error(`Vehicle not found for bulk action: ${vehicleId}`);
    }
    if (!isValidLifecycleTransition(current, targetStatus)) {
      throw new Error(`Invalid lifecycle transition in bulk action: ${current} -> ${targetStatus} (${vehicleId}).`);
    }
  }

  for (const vehicleId of request.vehicleIds) {
    const fromStatus = currentStatuses.get(vehicleId);
    await updateVehicleLifecycleStatus(request.dealershipId, vehicleId, targetStatus, accessToken);
    await logHistory(vehicleId, request.dealershipId, "bulk-action", `Bulk action applied: ${request.action}`, accessToken);
    await logAudit(
      vehicleId,
      request.dealershipId,
      "bulk-action",
      JSON.stringify({ ...request, fromStatus, toStatus: targetStatus }),
      accessToken,
    );
  }

  for (const vehicleId of request.vehicleIds) {
    await logMarketAnalyticsEvent({
      vehicleId,
      dealershipId: request.dealershipId,
      eventType: "conversion-event",
      eventName: "bulk-lifecycle-action",
      payload: {
        action: request.action,
        targetStatus,
      },
      accessToken,
    });
  }
}

async function addVehicleMediaToLocalStore(
  dealershipId: string,
  vehicleId: string,
  payload: { readonly fileName: string; readonly fileUrl: string; readonly qualityStatus?: "good" | "review" | "poor" },
  accessToken?: string,
): Promise<void> {
  {
    await updatePlatformStore((current) => {
      const existing = current.inventoryMedia
        .filter((item) => item.vehicleId === vehicleId)
        .sort((a, b) => b.sortOrder - a.sortOrder);
      const sortOrder = (existing[0]?.sortOrder ?? 0) + 1;

      return {
        ...current,
        inventoryMedia: [
          ...current.inventoryMedia,
          {
            id: crypto.randomUUID(),
            dealershipId,
            vehicleId,
            fileName: payload.fileName,
            fileUrl: payload.fileUrl,
            isPrimary: sortOrder === 1,
            sortOrder,
            qualityStatus: payload.qualityStatus ?? "review",
            processingStatus: "uploaded",
            aiEnhancementStatus: "not-started",
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });

    await logHistory(vehicleId, dealershipId, "photo-uploaded", `Photo uploaded: ${payload.fileName}`, accessToken);
    await logAudit(vehicleId, dealershipId, "photo-uploaded", JSON.stringify(payload), accessToken);
    return;
  }
}

export async function addVehicleMedia(
  dealershipId: string,
  vehicleId: string,
  payload: { readonly fileName: string; readonly fileUrl: string; readonly qualityStatus?: "good" | "review" | "poor" },
  accessToken?: string,
): Promise<void> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    return addVehicleMediaToLocalStore(dealershipId, vehicleId, payload, accessToken);
  }

  const { data: existing, error: existingError } = await supabase
    .from("inventory_vehicle_media")
    .select("id, sort_order")
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (existingError) {
    if (isMissingInventoryTableError(new Error(existingError.message))) {
      return addVehicleMediaToLocalStore(dealershipId, vehicleId, payload, accessToken);
    }
    throw new Error(existingError.message);
  }

  const sortOrder = (existing?.[0]?.sort_order ?? 0) + 1;
  const mediaId = crypto.randomUUID();

  const { error } = await supabase.from("inventory_vehicle_media").insert({
    id: mediaId,
    dealership_id: dealershipId,
    vehicle_id: vehicleId,
    file_name: payload.fileName,
    file_url: payload.fileUrl,
    is_primary: sortOrder === 1,
    sort_order: sortOrder,
    quality_status: payload.qualityStatus ?? "review",
    processing_status: "uploaded",
    ai_enhancement_status: "not-started",
    created_at: new Date().toISOString(),
  });

  if (error) {
    if (isMissingInventoryTableError(new Error(error.message))) {
      return addVehicleMediaToLocalStore(dealershipId, vehicleId, payload, accessToken);
    }
    throw new Error(error.message);
  }

  await logHistory(vehicleId, dealershipId, "photo-uploaded", `Photo uploaded: ${payload.fileName}`, accessToken);
  await logAudit(vehicleId, dealershipId, "photo-uploaded", JSON.stringify(payload), accessToken);
}

async function reorderVehicleMediaInLocalStore(
  dealershipId: string,
  vehicleId: string,
  mediaIds: readonly string[],
  accessToken?: string,
): Promise<void> {
  await updatePlatformStore((current) => ({
    ...current,
    inventoryMedia: current.inventoryMedia.map((media) => {
      if (media.dealershipId !== dealershipId || media.vehicleId !== vehicleId) return media;
      const index = mediaIds.indexOf(media.id);
      if (index === -1) return media;
      return { ...media, sortOrder: index + 1 };
    }),
  }));

  await logHistory(vehicleId, dealershipId, "updated", "Photo order updated", accessToken);
  await logAudit(vehicleId, dealershipId, "photo-reorder", JSON.stringify({ mediaIds }), accessToken);
}

export async function reorderVehicleMedia(
  dealershipId: string,
  vehicleId: string,
  mediaIds: readonly string[],
  accessToken?: string,
): Promise<void> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    return reorderVehicleMediaInLocalStore(dealershipId, vehicleId, mediaIds, accessToken);
  }

  for (let index = 0; index < mediaIds.length; index += 1) {
    const mediaId = mediaIds[index]!;
    const { error } = await supabase
      .from("inventory_vehicle_media")
      .update({ sort_order: index + 1 })
      .eq("id", mediaId)
      .eq("vehicle_id", vehicleId)
      .eq("dealership_id", dealershipId);

    if (error) {
      if (isMissingInventoryTableError(new Error(error.message))) {
        return reorderVehicleMediaInLocalStore(dealershipId, vehicleId, mediaIds, accessToken);
      }
      throw new Error(error.message);
    }
  }

  await logHistory(vehicleId, dealershipId, "updated", "Photo order updated", accessToken);
  await logAudit(vehicleId, dealershipId, "photo-reorder", JSON.stringify({ mediaIds }), accessToken);
}

async function setPrimaryMediaInLocalStore(
  dealershipId: string,
  vehicleId: string,
  mediaId: string,
  accessToken?: string,
): Promise<void> {
  await updatePlatformStore((current) => ({
    ...current,
    inventoryMedia: current.inventoryMedia.map((media) => {
      if (media.dealershipId !== dealershipId || media.vehicleId !== vehicleId) return media;
      return { ...media, isPrimary: media.id === mediaId };
    }),
  }));

  await logHistory(vehicleId, dealershipId, "updated", "Primary photo changed", accessToken);
  await logAudit(vehicleId, dealershipId, "photo-primary", JSON.stringify({ mediaId }), accessToken);
}

export async function setPrimaryMedia(
  dealershipId: string,
  vehicleId: string,
  mediaId: string,
  accessToken?: string,
): Promise<void> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    return setPrimaryMediaInLocalStore(dealershipId, vehicleId, mediaId, accessToken);
  }

  const { error: clearError } = await supabase
    .from("inventory_vehicle_media")
    .update({ is_primary: false })
    .eq("vehicle_id", vehicleId)
    .eq("dealership_id", dealershipId);

  if (clearError) {
    if (isMissingInventoryTableError(new Error(clearError.message))) {
      return setPrimaryMediaInLocalStore(dealershipId, vehicleId, mediaId, accessToken);
    }
    throw new Error(clearError.message);
  }

  const { error } = await supabase
    .from("inventory_vehicle_media")
    .update({ is_primary: true })
    .eq("id", mediaId)
    .eq("vehicle_id", vehicleId)
    .eq("dealership_id", dealershipId);

  if (error) {
    if (isMissingInventoryTableError(new Error(error.message))) {
      return setPrimaryMediaInLocalStore(dealershipId, vehicleId, mediaId, accessToken);
    }
    throw new Error(error.message);
  }

  await logHistory(vehicleId, dealershipId, "updated", "Primary photo changed", accessToken);
  await logAudit(vehicleId, dealershipId, "photo-primary", JSON.stringify({ mediaId }), accessToken);
}

interface VehicleDocumentPayload {
  readonly type:
    | "registration-papers"
    | "service-history"
    | "roadworthy-certificate"
    | "finance-settlement"
    | "warranty"
    | "inspection-report";
  readonly fileName: string;
  readonly fileUrl: string;
  readonly uploadedBy: string;
}

async function addVehicleDocumentToLocalStore(
  dealershipId: string,
  vehicleId: string,
  payload: VehicleDocumentPayload,
  accessToken?: string,
): Promise<void> {
  {
    await updatePlatformStore((current) => ({
      ...current,
      inventoryDocuments: [
        ...current.inventoryDocuments,
        {
          id: crypto.randomUUID(),
          dealershipId,
          vehicleId,
          documentType: payload.type,
          fileName: payload.fileName,
          fileUrl: payload.fileUrl,
          uploadedBy: payload.uploadedBy,
          uploadedAt: new Date().toISOString(),
        },
      ],
    }));

    await logHistory(vehicleId, dealershipId, "user-action", `Document uploaded: ${payload.type}`, accessToken);
    await logAudit(vehicleId, dealershipId, "document-upload", JSON.stringify(payload), accessToken);
    return;
  }
}

export async function addVehicleDocument(
  dealershipId: string,
  vehicleId: string,
  payload: VehicleDocumentPayload,
  accessToken?: string,
): Promise<void> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    return addVehicleDocumentToLocalStore(dealershipId, vehicleId, payload, accessToken);
  }

  const { error } = await supabase.from("inventory_vehicle_documents").insert({
    id: crypto.randomUUID(),
    dealership_id: dealershipId,
    vehicle_id: vehicleId,
    document_type: payload.type,
    file_name: payload.fileName,
    file_url: payload.fileUrl,
    uploaded_by: payload.uploadedBy,
    uploaded_at: new Date().toISOString(),
  });

  if (error) {
    if (isMissingInventoryTableError(new Error(error.message))) {
      return addVehicleDocumentToLocalStore(dealershipId, vehicleId, payload, accessToken);
    }
    throw new Error(error.message);
  }

  await logHistory(vehicleId, dealershipId, "user-action", `Document uploaded: ${payload.type}`, accessToken);
  await logAudit(vehicleId, dealershipId, "document-upload", JSON.stringify(payload), accessToken);
}
