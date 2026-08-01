import type {
  BulkInventoryActionRequest,
  InventoryLifecycleStatus,
  InventoryListQuery,
  InventorySortKey,
} from "@/features/inventory/types/inventory-intelligence.types";
import { parseAuthBearerToken } from "@/features/authentication";

const VALID_STATUSES: readonly InventoryLifecycleStatus[] = [
  "draft",
  "ai-review",
  "ready-to-publish",
  "published",
  "reserved",
  "performance-monitoring",
  "sold",
  "archived",
  "deleted",
];

const VALID_SORTS: readonly InventorySortKey[] = [
  "updated-at",
  "listing-quality",
  "price",
  "days-to-sell",
  "days-in-stock",
  "created-at",
];

export const parseBearerToken = parseAuthBearerToken;

export function parseInventoryListQuery(input: URLSearchParams): InventoryListQuery {
  const dealershipId = input.get("dealershipId") ?? "";
  if (!dealershipId) {
    throw new Error("dealershipId is required.");
  }

  const statusCandidate = input.get("status");
  const sortCandidate = input.get("sort");

  const status = statusCandidate && VALID_STATUSES.includes(statusCandidate as InventoryLifecycleStatus)
    ? (statusCandidate as InventoryLifecycleStatus)
    : undefined;

  const sort = sortCandidate && VALID_SORTS.includes(sortCandidate as InventorySortKey)
    ? (sortCandidate as InventorySortKey)
    : undefined;

  const pageValue = Number(input.get("page") ?? "1");
  const pageSizeValue = Number(input.get("pageSize") ?? "24");

  return {
    dealershipId,
    search: input.get("search") ?? undefined,
    status,
    sort,
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
    pageSize: Number.isFinite(pageSizeValue) && pageSizeValue > 0 ? pageSizeValue : 24,
  };
}

export async function parseBulkActionRequest(input: Request): Promise<BulkInventoryActionRequest> {
  const body = (await input.json()) as Partial<BulkInventoryActionRequest>;

  if (!body.dealershipId) {
    throw new Error("dealershipId is required.");
  }

  if (!Array.isArray(body.vehicleIds)) {
    throw new Error("vehicleIds must be an array.");
  }

  if (!body.action || !["archive", "restore", "mark-ai-review", "mark-ready"].includes(body.action)) {
    throw new Error("Invalid bulk action.");
  }

  return {
    dealershipId: body.dealershipId,
    vehicleIds: body.vehicleIds,
    action: body.action as BulkInventoryActionRequest["action"],
  };
}

export async function parseStatusUpdate(input: Request): Promise<InventoryLifecycleStatus> {
  const body = (await input.json()) as { readonly status?: string };
  if (!body.status || !VALID_STATUSES.includes(body.status as InventoryLifecycleStatus)) {
    throw new Error("Invalid lifecycle status.");
  }
  return body.status as InventoryLifecycleStatus;
}

export async function parseMediaCreateRequest(input: Request): Promise<{
  readonly fileName: string;
  readonly fileUrl: string;
  readonly qualityStatus?: "good" | "review" | "poor";
}> {
  const body = (await input.json()) as {
    readonly fileName?: string;
    readonly fileUrl?: string;
    readonly qualityStatus?: "good" | "review" | "poor";
  };

  if (!body.fileName?.trim()) {
    throw new Error("fileName is required.");
  }

  if (!body.fileUrl?.trim()) {
    throw new Error("fileUrl is required.");
  }

  return {
    fileName: body.fileName,
    fileUrl: body.fileUrl,
    qualityStatus: body.qualityStatus,
  };
}

export async function parseMediaReorderRequest(input: Request): Promise<{
  readonly mediaIds: readonly string[];
}> {
  const body = (await input.json()) as { readonly mediaIds?: readonly string[] };
  if (!Array.isArray(body.mediaIds) || body.mediaIds.length === 0) {
    throw new Error("mediaIds must be a non-empty array.");
  }

  return {
    mediaIds: body.mediaIds,
  };
}

export async function parsePrimaryMediaRequest(input: Request): Promise<{
  readonly mediaId: string;
}> {
  const body = (await input.json()) as { readonly mediaId?: string };
  if (!body.mediaId) {
    throw new Error("mediaId is required.");
  }

  return {
    mediaId: body.mediaId,
  };
}

export async function parseDocumentCreateRequest(input: Request): Promise<{
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
}> {
  const body = (await input.json()) as {
    readonly type?:
      | "registration-papers"
      | "service-history"
      | "roadworthy-certificate"
      | "finance-settlement"
      | "warranty"
      | "inspection-report";
    readonly fileName?: string;
    readonly fileUrl?: string;
    readonly uploadedBy?: string;
  };

  if (!body.type) {
    throw new Error("Document type is required.");
  }

  if (!body.fileName?.trim()) {
    throw new Error("fileName is required.");
  }

  if (!body.fileUrl?.trim()) {
    throw new Error("fileUrl is required.");
  }

  if (!body.uploadedBy?.trim()) {
    throw new Error("uploadedBy is required.");
  }

  return {
    type: body.type,
    fileName: body.fileName,
    fileUrl: body.fileUrl,
    uploadedBy: body.uploadedBy,
  };
}
