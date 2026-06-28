import type { UploadFormData } from "@/features/vehicle-upload/types/upload.types";

export interface UploadPublishScores {
  readonly listingScore: number;
  readonly qualityScore: number;
}

export function computePublishScores(data: UploadFormData): UploadPublishScores {
  let listing = 45;
  let quality = 50;

  if (data.identification.make && data.identification.model) listing += 8;
  if (data.identification.vin.length >= 11) listing += 5;
  if (data.pricing.sellingPrice) listing += 10;
  if (data.specifications.mileage) listing += 7;
  if (data.selectedFeatures.length >= 3) listing += 5;
  listing += Math.min(data.media.length * 3, 24);
  listing += Math.min(Math.floor(data.description.length / 25), 12);

  quality = Math.round(listing * 0.92);
  if (data.media.length >= 10) quality += 6;
  if (data.description.length >= 200) quality += 4;

  return {
    listingScore: Math.min(98, listing),
    qualityScore: Math.min(96, quality),
  };
}
