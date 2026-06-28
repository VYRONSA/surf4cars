import type { UploadFormData } from "@/features/vehicle-upload/types/upload.types";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import { PREMIUM_IMAGES } from "@/config/images";

function formatPrice(value: string): string {
  const num = Number(value.replace(/[^\d]/g, ""));
  if (!num) return "R —";
  return `R ${num.toLocaleString("en-ZA")}`;
}

function buildTitle(data: UploadFormData): string {
  const { year, make, model, variant } = data.identification;
  const parts = [year, make, model, variant].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "New Vehicle Listing";
}

export function buildPreviewListing(data: UploadFormData): ShowcaseVehicleListing {
  const primary = data.media.find((m) => m.isPrimary) ?? data.media[0];
  const sellingPrice = data.pricing.sellingPrice;

  return {
    id: "upload-preview",
    slug: "preview",
    title: buildTitle(data),
    price: formatPrice(sellingPrice),
    year: Number(data.identification.year) || new Date().getFullYear(),
    mileage: data.specifications.mileage ? `${data.specifications.mileage} km` : "— km",
    fuel: data.specifications.fuel || "—",
    transmission: data.specifications.transmission || "—",
    dealer: "Atlantic Auto Collective",
    location: "Cape Town, WC",
    financeEstimate: data.pricing.monthlyFinanceEstimate || "Finance available",
    aiMatchScore: Math.min(98, 60 + data.media.length * 3 + Math.min(data.description.length / 20, 20)),
    imageSrc: primary?.previewUrl ?? PREMIUM_IMAGES.vehicles.details,
    imagePosition: "center 40%",
    featured: data.publishing.featuredListing,
    verified: true,
  };
}

export function estimateProfit(data: UploadFormData): number | null {
  const purchase = Number(data.pricing.purchasePrice.replace(/[^\d]/g, ""));
  const selling = Number(data.pricing.sellingPrice.replace(/[^\d]/g, ""));
  if (!purchase || !selling) return null;
  return selling - purchase;
}
