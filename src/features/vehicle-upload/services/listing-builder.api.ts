import type {
  DescriptionBuilderResult,
  IntelligenceAnalysisBundle,
  LicenceDiscOcrResult,
  MarketIntelligenceResult,
  PricingIntelligenceResult,
  VehicleIdentificationResult,
} from "@/features/intelligence";
import { createAuthenticatedHeaders } from "@/features/authentication";
import type { UploadFormData } from "@/features/vehicle-upload/types/upload.types";

interface ListingBuilderDraftRecord {
  readonly draftId: string;
  readonly currentStepIndex: number;
  readonly revision: number;
  readonly updatedAt: string;
  readonly payload: UploadFormData;
}

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

export async function runLicenceDiscOcr(input: {
  readonly imageUrl?: string;
  readonly imageName?: string;
}): Promise<LicenceDiscOcrResult> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/intelligence/license-disc-ocr", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  return parseResponse<LicenceDiscOcrResult>(response, "Failed to run licence disc OCR.");
}

export async function runVehicleIdentification(input: {
  readonly photoUrls: readonly string[];
  readonly licenceDiscRegistration?: string;
  readonly vin?: string;
}): Promise<VehicleIdentificationResult> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/intelligence/vehicle-identification", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  return parseResponse<VehicleIdentificationResult>(response, "Failed to run vehicle identification.");
}

export async function runDescriptionBuilder(input: {
  readonly make?: string;
  readonly model?: string;
  readonly variant?: string;
  readonly year?: number;
  readonly mileageKm?: number;
  readonly fuelType?: string;
  readonly transmission?: string;
  readonly highlights?: readonly string[];
}): Promise<DescriptionBuilderResult> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/intelligence/description-builder", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  return parseResponse<DescriptionBuilderResult>(response, "Failed to run description builder.");
}

export async function runSurfReview(payload: {
  readonly listing: {
    readonly listingId?: string;
    readonly title?: string;
    readonly description?: string;
    readonly seoTitle?: string;
    readonly seoDescription?: string;
    readonly askingPriceCents?: number | null;
    readonly currency?: string;
    readonly vin?: string;
    readonly registrationNumber?: string;
    readonly mileageKm?: number | null;
    readonly photoCount?: number;
    readonly hasPrimaryPhoto?: boolean;
    readonly serviceHistoryAvailable?: boolean;
  };
  readonly pricing: {
    readonly listingId?: string;
    readonly make?: string;
    readonly model?: string;
    readonly year?: number;
    readonly mileageKm?: number | null;
    readonly askingPriceCents?: number | null;
    readonly currency?: string;
    readonly daysInStock?: number;
  };
  readonly images: {
    readonly listingId?: string;
    readonly images: readonly {
      readonly imageId: string;
      readonly width: number | null;
      readonly height: number | null;
      readonly angleTag?: "front" | "rear" | "left" | "right" | "interior" | "dashboard" | "engine" | "boot" | "wheel" | "other";
      readonly fingerprint?: string;
    }[];
  };
  readonly market: {
    readonly listingId?: string;
    readonly make?: string;
    readonly model?: string;
    readonly year?: number;
    readonly askingPriceCents?: number | null;
    readonly province?: string;
  };
  readonly lifecycleStatus?: string;
  readonly leadCount30d?: number;
  readonly daysInStock?: number;
  readonly serviceHistoryAvailable?: boolean;
}): Promise<IntelligenceAnalysisBundle> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/intelligence/analyze", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse<IntelligenceAnalysisBundle>(response, "Failed to run SURF intelligence review.");
}

export async function runPricingIntelligence(input: {
  readonly listingId?: string;
  readonly make?: string;
  readonly model?: string;
  readonly year?: number;
  readonly mileageKm?: number | null;
  readonly askingPriceCents?: number | null;
  readonly currency?: string;
  readonly daysInStock?: number;
}): Promise<PricingIntelligenceResult> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/intelligence/pricing", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  return parseResponse<PricingIntelligenceResult>(response, "Failed to run pricing intelligence.");
}

export async function runMarketIntelligence(input: {
  readonly listingId?: string;
  readonly make?: string;
  readonly model?: string;
  readonly year?: number;
  readonly askingPriceCents?: number | null;
  readonly province?: string;
}): Promise<MarketIntelligenceResult> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/intelligence/market", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  return parseResponse<MarketIntelligenceResult>(response, "Failed to run market intelligence.");
}

export async function saveListingBuilderDraft(payload: {
  readonly dealershipId: string;
  readonly draftId: string;
  readonly currentStepIndex: number;
  readonly revision: number;
  readonly updatedAt: string;
  readonly data: UploadFormData;
}): Promise<void> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/dealer/listing-builder/draft", {
    method: "POST",
    headers,
    body: JSON.stringify({
      dealershipId: payload.dealershipId,
      draftId: payload.draftId,
      currentStepIndex: payload.currentStepIndex,
      revision: payload.revision,
      updatedAt: payload.updatedAt,
      payload: payload.data,
    }),
  });

  await parseResponse<{ readonly ok: boolean }>(response, "Failed to save listing draft.");
}

export async function getListingBuilderDraft(payload: {
  readonly dealershipId: string;
  readonly draftId?: string;
}): Promise<ListingBuilderDraftRecord | null> {
  const headers = await createAuthenticatedHeaders();
  const url = new URL("/api/v1/dealer/listing-builder/draft", window.location.origin);
  url.searchParams.set("dealershipId", payload.dealershipId);
  if (payload.draftId) {
    url.searchParams.set("draftId", payload.draftId);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  const result = await parseResponse<{ readonly draft: ListingBuilderDraftRecord | null }>(
    response,
    "Failed to load listing draft.",
  );

  return result.draft;
}

export async function publishListingFromBuilder(payload: {
  readonly dealershipId: string;
  readonly branchId?: string;
  readonly draftId?: string;
  readonly vehicleId?: string;
  readonly publishNow: boolean;
  readonly data: UploadFormData;
}): Promise<{ readonly vehicleId: string; readonly lifecycleStatus: "draft" | "published"; readonly qualityScore: number | null }> {
  const headers = await createAuthenticatedHeaders({ "Content-Type": "application/json" });
  const response = await fetch("/api/v1/dealer/listing-builder/publish", {
    method: "POST",
    headers,
    body: JSON.stringify({
      dealershipId: payload.dealershipId,
      branchId: payload.branchId,
      draftId: payload.draftId,
      vehicleId: payload.vehicleId,
      publishNow: payload.publishNow,
      payload: payload.data,
    }),
  });

  return parseResponse<{ readonly vehicleId: string; readonly lifecycleStatus: "draft" | "published"; readonly qualityScore: number | null }>(
    response,
    "Failed to publish listing.",
  );
}
