import {
  getAllVehicleDetailsSync,
  getAllVehicleSlugsSync,
  getVehicleDetailBySlugSync,
} from "@/services/vehicle-engine";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";

/** Marketplace vehicle details — projected from the Unified Vehicle Intelligence Engine. */
export const VEHICLE_SHOWCASE_DETAILS: readonly VehicleDetail[] = getAllVehicleDetailsSync();

export const VEHICLE_DETAIL_SLUGS = getAllVehicleSlugsSync();

export function getVehicleBySlug(slug: string): VehicleDetail | undefined {
  return getVehicleDetailBySlugSync(slug);
}

export function getAllVehicleSlugs(): readonly string[] {
  return getAllVehicleSlugsSync();
}
