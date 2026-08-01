import type { UploadFormData } from "@/features/vehicle-upload/types/upload.types";

export interface ListingBuilderDraftRequest {
  readonly dealershipId: string;
  readonly draftId: string;
  readonly currentStepIndex: number;
  readonly revision: number;
  readonly updatedAt: string;
  readonly payload: UploadFormData;
}

export interface ListingBuilderDraftQuery {
  readonly dealershipId: string;
  readonly draftId?: string;
}

export interface ListingBuilderPublishRequest {
  readonly dealershipId: string;
  readonly branchId?: string;
  readonly draftId?: string;
  readonly vehicleId?: string;
  readonly payload: UploadFormData;
  readonly publishNow: boolean;
}

export function parseListingBuilderDraftQuery(url: URL): ListingBuilderDraftQuery {
  const dealershipId = url.searchParams.get("dealershipId")?.trim();
  if (!dealershipId) {
    throw new Error("dealershipId is required.");
  }

  const draftId = url.searchParams.get("draftId")?.trim();

  return {
    dealershipId,
    draftId: draftId && draftId.length > 0 ? draftId : undefined,
  };
}

export async function parseListingBuilderDraftRequest(request: Request): Promise<ListingBuilderDraftRequest> {
  const body = (await request.json()) as Partial<ListingBuilderDraftRequest>;

  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }

  if (!body.draftId?.trim()) {
    throw new Error("draftId is required.");
  }

  if (!body.payload) {
    throw new Error("payload is required.");
  }

  return {
    dealershipId: body.dealershipId,
    draftId: body.draftId,
    currentStepIndex: body.currentStepIndex ?? 0,
    revision: Math.max(0, body.revision ?? 0),
    updatedAt: body.updatedAt ?? new Date().toISOString(),
    payload: body.payload,
  };
}

export async function parseListingBuilderPublishRequest(request: Request): Promise<ListingBuilderPublishRequest> {
  const body = (await request.json()) as Partial<ListingBuilderPublishRequest>;

  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }

  if (!body.payload) {
    throw new Error("payload is required.");
  }

  return {
    dealershipId: body.dealershipId,
    branchId: body.branchId,
    draftId: body.draftId?.trim() || undefined,
    vehicleId: body.vehicleId?.trim() || undefined,
    payload: body.payload,
    publishNow: body.publishNow ?? false,
  };
}
