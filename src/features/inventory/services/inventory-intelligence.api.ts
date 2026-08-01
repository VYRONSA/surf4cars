import type {
  BulkInventoryActionRequest,
  InventoryDashboardPayload,
  InventoryLifecycleStatus,
  InventoryListPayload,
  InventoryListQuery,
  VehicleWorkspacePayload,
} from "@/features/inventory/types/inventory-intelligence.types";
import { createAuthenticatedHeaders } from "@/features/authentication";

function withQuery(path: string, query: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  return `${path}?${search.toString()}`;
}

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const body = (await response.json().catch(() => null)) as { readonly error?: string } | null;
  if (!response.ok) {
    throw new Error(body?.error ?? fallback);
  }
  return body as T;
}

export async function getInventoryDashboardData(dealershipId: string): Promise<InventoryDashboardPayload> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(
    withQuery("/api/v1/dealer/inventory/dashboard", { dealershipId }),
    { cache: "no-store", headers },
  );
  return parseResponse<InventoryDashboardPayload>(response, "Failed to load inventory dashboard.");
}

export async function getInventoryListData(query: InventoryListQuery): Promise<InventoryListPayload> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(
    withQuery("/api/v1/dealer/inventory/vehicles", {
      dealershipId: query.dealershipId,
      search: query.search,
      status: query.status,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    }),
    { cache: "no-store", headers },
  );
  return parseResponse<InventoryListPayload>(response, "Failed to load inventory list.");
}

export async function runBulkInventoryAction(payload: BulkInventoryActionRequest): Promise<void> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch("/api/v1/dealer/inventory/vehicles/bulk-actions", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  await parseResponse<{ readonly ok: boolean }>(response, "Failed to apply bulk action.");
}

export async function getVehicleWorkspaceData(
  dealershipId: string,
  vehicleId: string,
): Promise<VehicleWorkspacePayload> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(
    withQuery(`/api/v1/dealer/inventory/vehicles/${vehicleId}`, { dealershipId }),
    { cache: "no-store", headers },
  );

  return parseResponse<VehicleWorkspacePayload>(response, "Failed to load vehicle workspace.");
}

export async function patchVehicleLifecycleStatus(
  dealershipId: string,
  vehicleId: string,
  status: InventoryLifecycleStatus,
): Promise<void> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(
    withQuery(`/api/v1/dealer/inventory/vehicles/${vehicleId}/status`, { dealershipId }),
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    },
  );

  await parseResponse<{ readonly ok: boolean }>(response, "Failed to update status.");
}

export async function createVehicleMedia(
  dealershipId: string,
  vehicleId: string,
  payload: { readonly fileName: string; readonly fileUrl: string; readonly qualityStatus?: "good" | "review" | "poor" },
): Promise<void> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(
    withQuery(`/api/v1/dealer/inventory/vehicles/${vehicleId}/media`, { dealershipId }),
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
  );

  await parseResponse<{ readonly ok: boolean }>(response, "Failed to add media.");
}

export async function reorderVehicleMediaItems(
  dealershipId: string,
  vehicleId: string,
  mediaIds: readonly string[],
): Promise<void> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(
    withQuery(`/api/v1/dealer/inventory/vehicles/${vehicleId}/media`, { dealershipId, mode: "reorder" }),
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ mediaIds }),
    },
  );

  await parseResponse<{ readonly ok: boolean }>(response, "Failed to reorder media.");
}

export async function setPrimaryVehicleMediaItem(
  dealershipId: string,
  vehicleId: string,
  mediaId: string,
): Promise<void> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(
    withQuery(`/api/v1/dealer/inventory/vehicles/${vehicleId}/media`, { dealershipId, mode: "primary" }),
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ mediaId }),
    },
  );

  await parseResponse<{ readonly ok: boolean }>(response, "Failed to set primary media.");
}

export async function createVehicleDocument(
  dealershipId: string,
  vehicleId: string,
  payload: {
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
  },
): Promise<void> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(
    withQuery(`/api/v1/dealer/inventory/vehicles/${vehicleId}/documents`, { dealershipId }),
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
  );

  await parseResponse<{ readonly ok: boolean }>(response, "Failed to add document.");
}
