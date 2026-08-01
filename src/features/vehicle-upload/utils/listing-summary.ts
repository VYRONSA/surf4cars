import type { UploadFormData, UploadMediaItem } from "@/features/vehicle-upload/types/upload.types";

export function resolveListingTitle(data: UploadFormData): string {
  const aiTitle = data.descriptionBuilder.title.trim();
  if (aiTitle) return aiTitle;

  return [
    data.identification.year,
    data.identification.make,
    data.identification.model,
    data.identification.variant,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function resolveListingDescription(data: UploadFormData): string {
  return data.descriptionBuilder.description.trim() || data.description.trim();
}

export function resolveListingVin(data: UploadFormData): string {
  return data.identification.vin.trim() || data.licenceDisc.extractedVin.trim();
}

export function resolveListingRegistration(data: UploadFormData): string {
  return data.identification.registration.trim() || data.licenceDisc.extractedRegistration.trim();
}

export function countListingPhotos(data: UploadFormData): number {
  return data.media.filter((item) => item.kind === "photo").length;
}

export function hasPrimaryListingPhoto(data: UploadFormData): boolean {
  return data.media.some((item) => item.kind === "photo" && item.isPrimary);
}

export function resolvePrimaryListingMedia(data: UploadFormData): UploadMediaItem | null {
  return data.media.find((item) => item.kind === "photo" && item.isPrimary)
    ?? data.media.find((item) => item.kind === "photo")
    ?? null;
}