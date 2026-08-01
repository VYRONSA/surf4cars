import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
export type VehicleGalleryCategory =
  | "exterior"
  | "interior"
  | "wheels"
  | "engine"
  | "boot"
  | "dashboard"
  | "rear-seats";

/**
 * Where a photograph came from.
 *
 * Only `dealer` may be shown without qualification, because only `dealer` depicts the vehicle being sold.
 * The other two are legitimate images and illegitimate implications — the gallery labels them in the frame.
 */
export type VehicleImageProvenance = "dealer" | "library" | "manufacturer";

export interface VehicleGalleryImage {
  readonly id: string;
  readonly src: string;
  readonly alt: string;
  /** Absent when nobody has recorded what the photograph shows. Never inferred to "exterior". */
  readonly category?: VehicleGalleryCategory;
  readonly objectPosition?: string;
  /** Never optional: an image whose origin nobody decided is exactly what this field exists to prevent. */
  readonly provenance: VehicleImageProvenance;
}

export interface VehicleFeature {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

export interface VehicleSpecGroup {
  readonly id: string;
  readonly title: string;
  readonly specs: readonly { readonly label: string; readonly value: string }[];
}

export interface VehicleAiInsight {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly score?: number;
  readonly tone?: "positive" | "neutral" | "accent";
}

export interface VehicleDealerProfile {
  readonly dealershipId: string;
  readonly name: string;
  readonly slug: string;
  readonly logoInitials: string;
  readonly verified: boolean;
  readonly rating: number;
  readonly reviewCount: number;
  readonly responseTime: string;
  readonly yearsInBusiness: number;
  readonly vehiclesInStock: number;
  readonly phone: string;
  readonly whatsapp: string;
}

export interface VehicleTrustIndicator {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface VehicleDetail {
  readonly slug: string;
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  /** Carried separately from the title so market comparison can match on them exactly. */
  readonly make: string;
  readonly model: string;
  readonly price: string;
  readonly priceNumeric: number;
  readonly financeEstimate: string;
  readonly monthlyRepayment: string;
  readonly year: number;
  readonly mileage: string;
  readonly transmission: string;
  readonly fuel: string;
  readonly engine: string;
  readonly colour: string;
  readonly vin: string;
  readonly stockNumber: string;
  readonly availability: string;
  readonly verified: boolean;
  readonly location: string;
  readonly province: string;
  readonly bodyType: string;
  readonly gallery: readonly VehicleGalleryImage[];
  readonly description: readonly { readonly heading?: string; readonly paragraphs: readonly string[] }[];
  readonly features: readonly VehicleFeature[];
  readonly specGroups: readonly VehicleSpecGroup[];
  readonly dealer: VehicleDealerProfile;
  readonly aiInsights: readonly VehicleAiInsight[];
  readonly trustIndicators: readonly VehicleTrustIndicator[];
  readonly similarSlugs: readonly string[];
  readonly similarListings: readonly ShowcaseVehicleListing[];
  readonly featured?: boolean;
  readonly reducedPrice?: boolean;
  readonly aiMatchScore: number;
}
