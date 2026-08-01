import type {
  BuyerAlertRecord,
  BuyerPreferenceProfile,
  BuyerRecommendationResponse,
  BuyerSearchResponse,
  CompareIntelligenceResponse,
  SavedSearchRecord,
  SavedVehicleRecord,
} from "@/features/buyer-intelligence/types/buyer-intelligence.types";
import { createAuthenticatedHeaders } from "@/features/authentication";

interface ApiError {
  readonly error?: string;
}

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiError | T | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? (payload as ApiError).error
      : undefined;
    throw new Error(message ?? fallback);
  }

  return payload as T;
}

export async function runBuyerSearch(payload: { readonly buyerId?: string; readonly query: string }): Promise<BuyerSearchResponse> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/buyer/search", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse<BuyerSearchResponse>(response, "Failed buyer search.");
}

export async function getBuyerProfile(buyerId: string): Promise<BuyerPreferenceProfile | null> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(`/api/v1/buyer/profile?buyerId=${encodeURIComponent(buyerId)}`, {
    cache: "no-store",
    headers,
  });
  return parseResponse<BuyerPreferenceProfile | null>(response, "Failed to load buyer profile.");
}

export async function upsertBuyerProfile(payload: Omit<BuyerPreferenceProfile, "updatedAt">): Promise<BuyerPreferenceProfile> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/buyer/profile", {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse<BuyerPreferenceProfile>(response, "Failed to save buyer profile.");
}

export async function getBuyerRecommendations(buyerId: string): Promise<BuyerRecommendationResponse> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/buyer/recommendations", {
    method: "POST",
    headers,
    body: JSON.stringify({ buyerId }),
  });

  return parseResponse<BuyerRecommendationResponse>(response, "Failed to load recommendations.");
}

export async function runCompareIntelligence(vehicleIds: readonly string[], buyerId?: string): Promise<CompareIntelligenceResponse> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/buyer/compare", {
    method: "POST",
    headers,
    body: JSON.stringify({ vehicleIds, buyerId }),
  });

  return parseResponse<CompareIntelligenceResponse>(response, "Failed compare intelligence.");
}

export async function listSavedSearches(buyerId: string): Promise<readonly SavedSearchRecord[]> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(`/api/v1/buyer/saved-searches?buyerId=${encodeURIComponent(buyerId)}`, {
    cache: "no-store",
    headers,
  });
  return parseResponse<readonly SavedSearchRecord[]>(response, "Failed to load saved searches.");
}

export async function createSavedSearch(payload: {
  readonly buyerId: string;
  readonly name: string;
  readonly query: string;
  readonly alertsEnabled: boolean;
}): Promise<SavedSearchRecord> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/buyer/saved-searches", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse<SavedSearchRecord>(response, "Failed to create saved search.");
}

export async function deleteSavedSearch(payload: { readonly buyerId: string; readonly id: string }): Promise<void> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/buyer/saved-searches", {
    method: "DELETE",
    headers,
    body: JSON.stringify(payload),
  });

  await parseResponse<{ readonly ok: boolean }>(response, "Failed to delete saved search.");
}

export async function listSavedVehicles(buyerId: string): Promise<readonly SavedVehicleRecord[]> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(`/api/v1/buyer/saved-vehicles?buyerId=${encodeURIComponent(buyerId)}`, {
    cache: "no-store",
    headers,
  });
  return parseResponse<readonly SavedVehicleRecord[]>(response, "Failed to load saved vehicles.");
}

export async function createSavedVehicle(payload: { readonly buyerId: string; readonly vehicleId: string }): Promise<SavedVehicleRecord> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/buyer/saved-vehicles", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse<SavedVehicleRecord>(response, "Failed to save vehicle.");
}

export async function deleteSavedVehicle(payload: { readonly buyerId: string; readonly id: string }): Promise<void> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/buyer/saved-vehicles", {
    method: "DELETE",
    headers,
    body: JSON.stringify(payload),
  });

  await parseResponse<{ readonly ok: boolean }>(response, "Failed to delete saved vehicle.");
}

export async function listBuyerAlerts(buyerId: string): Promise<readonly BuyerAlertRecord[]> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(`/api/v1/buyer/alerts?buyerId=${encodeURIComponent(buyerId)}`, {
    cache: "no-store",
    headers,
  });
  return parseResponse<readonly BuyerAlertRecord[]>(response, "Failed to load alerts.");
}

export async function createBuyerAlert(payload: Omit<BuyerAlertRecord, "id" | "createdAt">): Promise<BuyerAlertRecord> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/buyer/alerts", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse<BuyerAlertRecord>(response, "Failed to create alert.");
}
