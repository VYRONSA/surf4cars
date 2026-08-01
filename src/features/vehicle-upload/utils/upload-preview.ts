import type { UploadFormData } from "@/features/vehicle-upload/types/upload.types";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import { PREMIUM_IMAGES } from "@/config/images";
import { resolveListingTitle, resolvePrimaryListingMedia } from "@/features/vehicle-upload/utils/listing-summary";

function formatPrice(value: string): string {
  const num = Number(value.replace(/[^\d]/g, ""));
  if (!num) return "R —";
  return `R ${num.toLocaleString("en-ZA")}`;
}

export function buildPreviewListing(data: UploadFormData): ShowcaseVehicleListing {
  const primary = resolvePrimaryListingMedia(data);
  const sellingPrice = data.pricing.sellingPrice;
  const title = resolveListingTitle(data);

  return {
    id: "upload-preview",
    slug: "preview",
    title: title || "New Vehicle Listing",
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
