import { evaluateListingQualityRules } from "@/features/intelligence/utils/listing-quality-rules";
import type { UploadFormData } from "@/features/vehicle-upload/types/upload.types";
import {
  countListingPhotos,
  hasPrimaryListingPhoto,
  resolveListingDescription,
  resolveListingRegistration,
  resolveListingTitle,
  resolveListingVin,
} from "@/features/vehicle-upload/utils/listing-summary";

export interface PublishReadinessResult {
  readonly isReady: boolean;
  readonly qualityScore: number;
  readonly blockingIssues: readonly string[];
  readonly requiredFields: readonly string[];
  readonly optionalFields: readonly string[];
  readonly aiGeneratedFields: readonly string[];
}

const QUALITY_SCORE_THRESHOLD = 80;

const REQUIRED_FIELDS: readonly string[] = [
  "Listing title",
  "Listing description",
  "SEO title",
  "SEO description",
  "VIN",
  "Registration number",
  "Mileage",
  "Asking price",
  "At least 6 listing photos",
  "Primary image",
];

const OPTIONAL_FIELDS: readonly string[] = [
  "Stock number",
  "Vehicle variant",
  "Retail price",
  "Trade price",
  "Service history documentation",
  "Licence disc file",
];

const AI_GENERATED_FIELDS: readonly string[] = [
  "SURF Intelligence review",
  "Description Builder title",
  "Description Builder description",
  "Description Builder SEO title",
  "Description Builder SEO description",
];

export function evaluatePublishReadiness(data: UploadFormData): PublishReadinessResult {
  const photoCount = countListingPhotos(data);
  const hasPrimaryPhoto = hasPrimaryListingPhoto(data);
  const title = resolveListingTitle(data);

  const qualityEvaluation = evaluateListingQualityRules({
    title,
    description: resolveListingDescription(data),
    seoTitle: data.descriptionBuilder.seoTitle,
    seoDescription: data.descriptionBuilder.seoDescription,
    vin: resolveListingVin(data),
    registrationNumber: resolveListingRegistration(data),
    mileageKm: data.specifications.mileage ? Number(data.specifications.mileage) : null,
    askingPriceCents: data.pricing.sellingPrice ? Math.round(Number(data.pricing.sellingPrice) * 100) : null,
    currency: "ZAR",
    photoCount,
    hasPrimaryPhoto,
    serviceHistoryAvailable: false,
  });

  const blockingIssues = [...qualityEvaluation.missingInformation];

  if (data.intelligenceReview.status !== "complete") {
    blockingIssues.push("Run SURF Intelligence Review and resolve flagged issues before publishing.");
  }

  const hasManualDescriptionCompletion = Boolean(
    data.descriptionBuilder.title.trim()
    && data.descriptionBuilder.description.trim()
    && data.descriptionBuilder.seoTitle.trim()
    && data.descriptionBuilder.seoDescription.trim(),
  );

  if (data.descriptionBuilder.generationStatus !== "complete" && !hasManualDescriptionCompletion) {
    blockingIssues.push("Run Description Builder so AI-generated listing copy is complete before publishing.");
  }

  if (qualityEvaluation.qualityScore < QUALITY_SCORE_THRESHOLD) {
    blockingIssues.push(`Listing quality score must be at least ${QUALITY_SCORE_THRESHOLD}/100 before publishing.`);
  }

  return {
    isReady: blockingIssues.length === 0,
    qualityScore: qualityEvaluation.qualityScore,
    blockingIssues,
    requiredFields: REQUIRED_FIELDS,
    optionalFields: OPTIONAL_FIELDS,
    aiGeneratedFields: AI_GENERATED_FIELDS,
  };
}