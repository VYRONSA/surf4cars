export type VehicleGalleryCategory =
  | "exterior"
  | "interior"
  | "wheels"
  | "engine"
  | "boot"
  | "dashboard"
  | "rear-seats";

export interface VehicleGalleryImage {
  readonly id: string;
  readonly src: string;
  readonly alt: string;
  readonly category: VehicleGalleryCategory;
  readonly objectPosition?: string;
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
  readonly featured?: boolean;
  readonly reducedPrice?: boolean;
  readonly aiMatchScore: number;
}
