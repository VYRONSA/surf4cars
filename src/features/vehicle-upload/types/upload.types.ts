import type { VehicleCondition } from "@/domain/vehicle/types/vehicle-core.types";

export const UPLOAD_STEPS = [
  { id: "identification", label: "Identification", shortLabel: "Vehicle" },
  { id: "pricing", label: "Pricing", shortLabel: "Pricing" },
  { id: "specifications", label: "Specifications", shortLabel: "Specs" },
  { id: "features", label: "Features", shortLabel: "Features" },
  { id: "media", label: "Media", shortLabel: "Media" },
  { id: "description", label: "Description", shortLabel: "Description" },
  { id: "publishing", label: "Publishing", shortLabel: "Publish" },
  { id: "review", label: "Review", shortLabel: "Review" },
] as const;

export type UploadStepId = (typeof UPLOAD_STEPS)[number]["id"];

export type UploadCondition = VehicleCondition;

export type UploadPublishMode = "draft" | "publish-now" | "schedule";

export interface UploadMediaItem {
  readonly id: string;
  readonly kind: "photo" | "video" | "image-360" | "document";
  readonly name: string;
  readonly previewUrl: string;
  readonly isPrimary: boolean;
  readonly uploadProgress: number;
}

export interface UploadIdentificationData {
  readonly vin: string;
  readonly registration: string;
  readonly stockNumber: string;
  readonly make: string;
  readonly model: string;
  readonly variant: string;
  readonly year: string;
  readonly condition: UploadCondition;
}

export interface UploadPricingData {
  readonly purchasePrice: string;
  readonly sellingPrice: string;
  readonly retailPrice: string;
  readonly tradePrice: string;
  readonly financeAvailable: boolean;
  readonly monthlyFinanceEstimate: string;
  readonly tradeInAccepted: boolean;
}

export interface UploadSpecificationsData {
  readonly mileage: string;
  readonly transmission: string;
  readonly fuel: string;
  readonly engine: string;
  readonly power: string;
  readonly torque: string;
  readonly driveType: string;
  readonly bodyType: string;
  readonly doors: string;
  readonly seats: string;
  readonly colour: string;
}

export interface UploadPublishingData {
  readonly mode: UploadPublishMode;
  readonly scheduledDate: string;
  readonly featuredListing: boolean;
  readonly marketplace: boolean;
  readonly dealerWebsite: boolean;
  readonly googleAds: boolean;
  readonly facebook: boolean;
  readonly instagram: boolean;
  readonly whatsapp: boolean;
  readonly tiktok: boolean;
  readonly email: boolean;
}

export interface UploadFormData {
  readonly identification: UploadIdentificationData;
  readonly pricing: UploadPricingData;
  readonly specifications: UploadSpecificationsData;
  readonly selectedFeatures: readonly string[];
  readonly media: readonly UploadMediaItem[];
  readonly description: string;
  readonly publishing: UploadPublishingData;
}

export interface UploadDraftMeta {
  readonly draftId: string;
  readonly lastSavedAt: string;
  readonly completedSteps: readonly UploadStepId[];
}

export interface UploadContextSnapshot {
  readonly data: UploadFormData;
  readonly currentStepIndex: number;
  readonly completedSteps: readonly UploadStepId[];
  readonly draftId: string;
}

export const INITIAL_UPLOAD_DATA: UploadFormData = {
  identification: {
    vin: "",
    registration: "",
    stockNumber: "",
    make: "",
    model: "",
    variant: "",
    year: "",
    condition: "used",
  },
  pricing: {
    purchasePrice: "",
    sellingPrice: "",
    retailPrice: "",
    tradePrice: "",
    financeAvailable: true,
    monthlyFinanceEstimate: "",
    tradeInAccepted: false,
  },
  specifications: {
    mileage: "",
    transmission: "Automatic",
    fuel: "Petrol",
    engine: "",
    power: "",
    torque: "",
    driveType: "AWD",
    bodyType: "SUV",
    doors: "5",
    seats: "5",
    colour: "",
  },
  selectedFeatures: [],
  media: [],
  description: "",
  publishing: {
    mode: "draft",
    scheduledDate: "",
    featuredListing: false,
    marketplace: true,
    dealerWebsite: true,
    googleAds: false,
    facebook: false,
    instagram: false,
    whatsapp: false,
    tiktok: false,
    email: false,
  },
};
