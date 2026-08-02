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

/**
 * Where an image came from. Only `dealer` depicts the vehicle being sold, and only `dealer` may therefore be
 * presented without a label. See supabase/migrations/20260731160000_pcp015d_media_provenance.sql.
 */
export type VehicleMediaProvenance = "dealer" | "library" | "manufacturer";

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
  /** Absent only for non-photographic assets, where the question does not arise. */
  readonly provenance?: VehicleMediaProvenance;
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
