import type {
  BuyerAlertRecord,
  BuyerPreferenceProfile,
  BuyerSearchRequest,
  CompareIntelligenceRequest,
  SavedSearchRecord,
  SavedVehicleRecord,
} from "@/features/buyer-intelligence/types/buyer-intelligence.types";

function getParam(url: URL, key: string): string {
  const value = (url.searchParams.get(key) ?? "").trim();
  if (!value) {
    throw new Error(`${key} is required.`);
  }
  return value;
}

async function parseJsonBody<T>(request: Request): Promise<T> {
  const body = (await request.json().catch(() => null)) as T | null;
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be valid JSON.");
  }
  return body;
}

export function parseBuyerIdFromUrl(request: Request): string {
  return getParam(new URL(request.url), "buyerId");
}

export async function parseBuyerSearchRequest(request: Request): Promise<BuyerSearchRequest> {
  const body = await parseJsonBody<BuyerSearchRequest>(request);
  if (!body.query?.trim()) {
    throw new Error("query is required.");
  }
  return body;
}

export async function parseBuyerProfileUpsertRequest(request: Request): Promise<Omit<BuyerPreferenceProfile, "updatedAt">> {
  const body = await parseJsonBody<Omit<BuyerPreferenceProfile, "updatedAt">>(request);
  if (!body.buyerId?.trim()) {
    throw new Error("buyerId is required.");
  }
  return body;
}

export async function parseSavedSearchCreateRequest(request: Request): Promise<Pick<SavedSearchRecord, "buyerId" | "name" | "query" | "alertsEnabled">> {
  const body = await parseJsonBody<Pick<SavedSearchRecord, "buyerId" | "name" | "query" | "alertsEnabled">>(request);
  if (!body.buyerId?.trim()) throw new Error("buyerId is required.");
  if (!body.name?.trim()) throw new Error("name is required.");
  if (!body.query?.trim()) throw new Error("query is required.");
  return body;
}

export async function parseSavedSearchDeleteRequest(request: Request): Promise<{ readonly buyerId: string; readonly id: string }> {
  const body = await parseJsonBody<{ readonly buyerId?: string; readonly id?: string }>(request);
  if (!body.buyerId?.trim()) throw new Error("buyerId is required.");
  if (!body.id?.trim()) throw new Error("id is required.");
  return { buyerId: body.buyerId, id: body.id };
}

export async function parseSavedVehicleCreateRequest(request: Request): Promise<Pick<SavedVehicleRecord, "buyerId" | "vehicleId">> {
  const body = await parseJsonBody<Pick<SavedVehicleRecord, "buyerId" | "vehicleId">>(request);
  if (!body.buyerId?.trim()) throw new Error("buyerId is required.");
  if (!body.vehicleId?.trim()) throw new Error("vehicleId is required.");
  return body;
}

export async function parseSavedVehicleDeleteRequest(request: Request): Promise<{ readonly buyerId: string; readonly id: string }> {
  const body = await parseJsonBody<{ readonly buyerId?: string; readonly id?: string }>(request);
  if (!body.buyerId?.trim()) throw new Error("buyerId is required.");
  if (!body.id?.trim()) throw new Error("id is required.");
  return { buyerId: body.buyerId, id: body.id };
}

export async function parseAlertCreateRequest(request: Request): Promise<Omit<BuyerAlertRecord, "id" | "createdAt">> {
  const body = await parseJsonBody<Omit<BuyerAlertRecord, "id" | "createdAt">>(request);
  if (!body.buyerId?.trim()) throw new Error("buyerId is required.");
  return body;
}

export async function parseCompareRequest(request: Request): Promise<CompareIntelligenceRequest> {
  const body = await parseJsonBody<CompareIntelligenceRequest>(request);
  if (!Array.isArray(body.vehicleIds) || body.vehicleIds.length < 2) {
    throw new Error("vehicleIds must include at least 2 vehicles.");
  }
  return body;
}
