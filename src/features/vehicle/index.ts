export { VehicleDetailPage } from "./vehicle-detail-page";
export type { VehicleDetailPageProps } from "./vehicle-detail-page";
export type {
  VehicleDetail,
  VehicleGalleryImage,
  VehicleFeature,
  VehicleSpecGroup,
  VehicleAiInsight,
  VehicleDealerProfile,
  VehicleTrustIndicator,
} from "./types/vehicle.types";
export {
  getAllVehicleSlugs,
  getVehicleBySlug,
  resolveVehicleSeoMetadata,
  resolveVehicleNotFoundSeo,
  VEHICLE_DETAIL_SLUGS,
  VEHICLE_SHOWCASE_DETAILS,
  vehiclePolish,
} from "./config";
