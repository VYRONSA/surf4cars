import type { VehicleCondition } from "@/domain/vehicle/types/vehicle-core.types";

export const UPLOAD_STEPS = [
  { id: "media", label: "Vehicle Photos", shortLabel: "Photos" },
  { id: "specifications", label: "Licence Disc", shortLabel: "Licence" },
  { id: "identification", label: "Vehicle Identification", shortLabel: "Identify" },
  { id: "features", label: "SURF Review", shortLabel: "Review" },
  { id: "description", label: "Description Builder", shortLabel: "Copy" },
  { id: "pricing", label: "Pricing Workspace", shortLabel: "Pricing" },
  { id: "review", label: "Review & Publish", shortLabel: "Publish" },
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
  readonly width?: number;
  readonly height?: number;
  readonly angleTag?: "front" | "rear" | "left" | "right" | "interior" | "dashboard" | "engine" | "boot" | "wheel" | "other";
  readonly fingerprint?: string;
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

export interface UploadLicenceDiscData {
  readonly fileName: string;
  readonly fileUrl: string;
  readonly analysisStatus: "idle" | "pending" | "complete";
  readonly analysisMessage: string;
  readonly extractedRegistration: string;
  readonly extractedVin: string;
  readonly extractedExpiryDate: string;
}

export interface UploadVehicleIdentificationData {
  readonly analysisStatus: "idle" | "pending" | "complete";
  readonly analysisMessage: string;
  readonly provider: "none" | "openai" | "anthropic" | "internal";
}

export interface UploadIntelligenceReviewData {
  readonly status: "idle" | "pending" | "complete";
  readonly qualityScore: number;
  readonly missingInformation: readonly string[];
  readonly missingPhotos: readonly string[];
  readonly suggestedImprovements: readonly string[];
}

export interface UploadDescriptionBuilderData {
  readonly title: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly generationStatus: "idle" | "pending" | "complete";
  readonly generationMessage: string;
}

export interface UploadPricingWorkspaceData {
  readonly recommendedPriceCents: number | null;
  readonly confidence: string;
  readonly marketPosition: string;
  readonly status: "idle" | "pending" | "complete";
  readonly statusMessage: string;
}

export interface UploadPublishResult {
  readonly status: "idle" | "pending" | "published" | "failed";
  readonly message: string;
  readonly vehicleId: string | null;
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
  readonly licenceDisc: UploadLicenceDiscData;
  readonly identificationAi: UploadVehicleIdentificationData;
  readonly intelligenceReview: UploadIntelligenceReviewData;
  readonly descriptionBuilder: UploadDescriptionBuilderData;
  readonly pricingWorkspace: UploadPricingWorkspaceData;
  readonly publishResult: UploadPublishResult;
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
  readonly revision: number;
  readonly updatedAt: string;
  readonly dealershipId: string | null;
  readonly sourceTabId?: string;
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
  licenceDisc: {
    fileName: "",
    fileUrl: "",
    analysisStatus: "idle",
    analysisMessage: "Awaiting OCR analysis",
    extractedRegistration: "",
    extractedVin: "",
    extractedExpiryDate: "",
  },
  identificationAi: {
    analysisStatus: "idle",
    analysisMessage: "Awaiting AI analysis",
    provider: "none",
  },
  intelligenceReview: {
    status: "idle",
    qualityScore: 0,
    missingInformation: [],
    missingPhotos: [],
    suggestedImprovements: [],
  },
  descriptionBuilder: {
    title: "",
    description: "",
    highlights: [],
    seoTitle: "",
    seoDescription: "",
    generationStatus: "idle",
    generationMessage: "Awaiting AI analysis",
  },
  pricingWorkspace: {
    recommendedPriceCents: null,
    confidence: "pending-live-market-data",
    marketPosition: "Awaiting live market data",
    status: "idle",
    statusMessage: "Awaiting live market data",
  },
  publishResult: {
    status: "idle",
    message: "",
    vehicleId: null,
  },
};
