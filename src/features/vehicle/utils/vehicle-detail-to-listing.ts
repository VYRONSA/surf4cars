import { toShowcaseVehicleListing } from "@/services/vehicle-engine";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";
import type { UnifiedVehicleRecord } from "@/domain/vehicle";
import { PREMIUM_IMAGES } from "@/config/images";

export function unifiedVehicleToListing(record: UnifiedVehicleRecord): ShowcaseVehicleListing {
  return toShowcaseVehicleListing(record);
}

export function vehicleDetailToListing(vehicle: VehicleDetail): ShowcaseVehicleListing & { slug: string } {
  const primary = vehicle.gallery[0];
  const financeShort = vehicle.financeEstimate.replace(/ at .+$/, "");

  return {
    id: vehicle.id,
    slug: vehicle.slug,
    title: vehicle.title,
    price: vehicle.price,
    year: vehicle.year,
    mileage: vehicle.mileage,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    dealer: vehicle.dealer.name,
    location: vehicle.location,
    financeEstimate: financeShort.includes("/mo") ? financeShort : vehicle.financeEstimate,
    aiMatchScore: vehicle.aiMatchScore,
    imageSrc: primary?.src ?? PREMIUM_IMAGES.vehicles.details,
    imagePosition: primary?.objectPosition ?? "center",
    featured: vehicle.featured,
    reducedPrice: vehicle.reducedPrice,
    verified: vehicle.verified,
  };
}
