export type VehicleMediaKind =
  | "photo"
  | "video"
  | "image-360"
  | "document"
  | "inspection-report"
  | "service-history"
  | "brochure"
  | "ar-asset"
  | "vr-asset";

export type VehiclePhotoCategory =
  | "exterior"
  | "interior"
  | "wheels"
  | "engine"
  | "boot"
  | "dashboard"
  | "rear-seats";

export interface VehicleMediaAsset {
  readonly id: string;
  readonly kind: VehicleMediaKind;
  readonly url: string;
  readonly alt: string;
  readonly category?: VehiclePhotoCategory;
  readonly objectPosition?: string;
  readonly sortOrder: number;
  readonly isPrimary: boolean;
  readonly mimeType?: string;
  readonly fileName?: string;
}

export interface VehicleMediaBundle {
  readonly photos: readonly VehicleMediaAsset[];
  readonly videos: readonly VehicleMediaAsset[];
  readonly images360: readonly VehicleMediaAsset[];
  readonly documents: readonly VehicleMediaAsset[];
  readonly inspectionReports: readonly VehicleMediaAsset[];
  readonly serviceHistory: readonly VehicleMediaAsset[];
  readonly brochures: readonly VehicleMediaAsset[];
  readonly futureAssets: readonly VehicleMediaAsset[];
}
