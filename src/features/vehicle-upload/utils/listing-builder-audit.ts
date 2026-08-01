import type { VehicleWorkspacePayload } from "@/features/inventory/types/inventory-intelligence.types";
import { INITIAL_UPLOAD_DATA, type UploadFormData } from "@/features/vehicle-upload/types/upload.types";

export interface ListingBuilderAuditPayload {
  readonly publishNow?: boolean;
  readonly source?: string;
  readonly draftId?: string;
  readonly idempotencyKey?: string;
  readonly listingBuilderSnapshot?: UploadFormData;
}

export function createListingBuilderAuditPayload(params: {
  readonly dealershipId: string;
  readonly draftId?: string;
  readonly publishNow: boolean;
  readonly payload: UploadFormData;
}): ListingBuilderAuditPayload {
  return {
    publishNow: params.publishNow,
    source: "ai-vehicle-listing-builder",
    draftId: params.draftId,
    idempotencyKey: params.draftId
      ? `publish:${params.dealershipId}:${params.draftId}:${params.publishNow ? "published" : "draft"}`
      : undefined,
    listingBuilderSnapshot: params.payload,
  };
}

export function parseListingBuilderAuditPayload(payload: string | null | undefined): ListingBuilderAuditPayload {
  if (!payload) return {};

  try {
    return JSON.parse(payload) as ListingBuilderAuditPayload;
  } catch {
    return {};
  }
}

export function buildUploadFormDataFromWorkspace(workspace: VehicleWorkspacePayload): UploadFormData {
  const auditPayload = workspace.auditTrail
    .filter((entry) => entry.action === "listing-builder-publish")
    .map((entry) => parseListingBuilderAuditPayload(entry.payload))
    .find((entry) => entry.listingBuilderSnapshot);

  if (auditPayload?.listingBuilderSnapshot) {
    return {
      ...auditPayload.listingBuilderSnapshot,
      publishResult: {
        status: "idle",
        message: "",
        vehicleId: workspace.vehicle.id,
      },
    };
  }

  const registrationDocument = workspace.documents.find((document) => document.type === "registration-papers");

  return {
    ...INITIAL_UPLOAD_DATA,
    identification: {
      ...INITIAL_UPLOAD_DATA.identification,
      stockNumber: workspace.vehicle.stockNumber,
      vin: workspace.vehicle.vin,
      registration: workspace.vehicle.registrationNumber,
      make: workspace.vehicle.make,
      model: workspace.vehicle.model,
      variant: workspace.vehicle.title.replace(`${workspace.vehicle.year} ${workspace.vehicle.make} ${workspace.vehicle.model}`, "").trim(),
      year: String(workspace.vehicle.year),
    },
    pricing: {
      ...INITIAL_UPLOAD_DATA.pricing,
      sellingPrice: String(Math.round(workspace.vehicle.askingPriceCents / 100)),
    },
    specifications: {
      ...INITIAL_UPLOAD_DATA.specifications,
      mileage: String(workspace.vehicle.mileageKm),
      transmission: workspace.photos.length > 0 ? INITIAL_UPLOAD_DATA.specifications.transmission : INITIAL_UPLOAD_DATA.specifications.transmission,
    },
    media: workspace.photos.map((photo) => ({
      id: photo.id,
      kind: "photo" as const,
      name: photo.url.split("/").pop() || `photo-${photo.id}`,
      previewUrl: photo.url,
      isPrimary: photo.isPrimary,
      uploadProgress: photo.processingStatus === "ready" ? 100 : photo.processingStatus === "processing" ? 60 : 20,
    })),
    descriptionBuilder: {
      ...INITIAL_UPLOAD_DATA.descriptionBuilder,
      title: workspace.vehicle.title,
    },
    licenceDisc: {
      ...INITIAL_UPLOAD_DATA.licenceDisc,
      fileName: registrationDocument?.fileName || "",
      fileUrl: registrationDocument?.fileUrl || "",
      analysisStatus: registrationDocument ? "complete" : "idle",
      analysisMessage: registrationDocument ? "Recovered from existing listing." : INITIAL_UPLOAD_DATA.licenceDisc.analysisMessage,
      extractedRegistration: workspace.vehicle.registrationNumber,
      extractedVin: workspace.vehicle.vin,
    },
    intelligenceReview: {
      ...INITIAL_UPLOAD_DATA.intelligenceReview,
      status: workspace.vehicle.listingQualityScore > 0 ? "complete" : "idle",
      qualityScore: workspace.vehicle.listingQualityScore,
      suggestedImprovements: workspace.recommendations.map((recommendation) => recommendation.label),
    },
    publishResult: {
      status: "idle",
      message: "",
      vehicleId: workspace.vehicle.id,
    },
  };
}