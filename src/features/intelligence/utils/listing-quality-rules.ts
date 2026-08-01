import type {
  ListingQualityInput,
  ListingQualityResult,
} from "@/features/intelligence/types/intelligence.types";

export const LISTING_QUALITY_REQUIRED_FIELDS = [
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
] as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluateListingQualityRules(input: ListingQualityInput): Pick<
  ListingQualityResult,
  "qualityScore" | "missingInformation" | "suggestedImprovements"
> {
  const missingInformation: string[] = [];

  if (!input.title?.trim()) missingInformation.push("Listing title");
  if (!input.description?.trim()) missingInformation.push("Listing description");
  if (!input.seoTitle?.trim()) missingInformation.push("SEO title");
  if (!input.seoDescription?.trim()) missingInformation.push("SEO description");
  if (!input.vin?.trim()) missingInformation.push("VIN");
  if (!input.registrationNumber?.trim()) missingInformation.push("Registration number");
  if (!input.mileageKm && input.mileageKm !== 0) missingInformation.push("Mileage");
  if (!input.askingPriceCents) missingInformation.push("Asking price");
  if (!input.photoCount || input.photoCount < 6) missingInformation.push("At least 6 listing photos");
  if (!input.hasPrimaryPhoto) missingInformation.push("Primary image");

  let score = 100;
  score -= missingInformation.length * 7;
  if ((input.photoCount ?? 0) < 4) score -= 12;

  return {
    qualityScore: clampScore(score),
    missingInformation,
    suggestedImprovements: missingInformation.map((field) => `Complete ${field.toLowerCase()}.`),
  };
}