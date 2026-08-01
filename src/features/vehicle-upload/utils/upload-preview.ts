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
    /*
      A preview must not promise the dealer something the buyer will not see.
      ======================================================================
      This block previously showed "Atlantic Auto Collective" in "Cape Town, WC" with a Verified
      badge and "Finance available" — none of it belonging to the dealer looking at it, and none of
      it true of the listing they were about to publish.

      "Atlantic Auto Collective" is the specific name AGENTS.md warns about: an earlier seed derived
      `atlanticauto.co.za` from it and the domain resolved to a live third-party business.

      "Your dealership" is deliberately not a plausible trading name. An obviously blank placeholder
      gets replaced; a convincing one gets shipped.
    */
    dealer: "Your dealership",
    location: "",
    financeEstimate: data.pricing.monthlyFinanceEstimate || undefined,
    aiMatchScore: 0,
    imageSrc: primary?.previewUrl ?? PREMIUM_IMAGES.vehicles.details,
    imagePosition: "center 40%",
    featured: data.publishing.featuredListing,
  };
}

export function estimateProfit(data: UploadFormData): number | null {
  const purchase = Number(data.pricing.purchasePrice.replace(/[^\d]/g, ""));
  const selling = Number(data.pricing.sellingPrice.replace(/[^\d]/g, ""));
  if (!purchase || !selling) return null;
  return selling - purchase;
}
