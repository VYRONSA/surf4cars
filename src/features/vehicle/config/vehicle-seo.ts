import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";

export interface VehicleSeoMetadata {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath: string;
  readonly indexable: boolean;
}

export function resolveVehicleSeoMetadata(vehicle: VehicleDetail): VehicleSeoMetadata {
  return {
    title: `${vehicle.title} for Sale`,
    description: `${vehicle.title} — ${vehicle.price}. ${vehicle.mileage}, ${vehicle.fuel}, ${vehicle.transmission}. ${vehicle.location}. View on SURF FOR CARS.`,
    canonicalPath: `/vehicle/${vehicle.slug}`,
    indexable: true,
  };
}

export function resolveVehicleNotFoundSeo(): VehicleSeoMetadata {
  return {
    title: "Vehicle Not Found",
    description: "This vehicle listing is no longer available on SURF FOR CARS.",
    canonicalPath: "/search",
    indexable: false,
  };
}
