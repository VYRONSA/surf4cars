export type OnboardingStepId =
  | "welcome"
  | "dealership"
  | "branding"
  | "branch"
  | "team"
  | "subscription"
  | "review"
  | "success";

export interface OnboardingStepDefinition {
  readonly id: OnboardingStepId;
  readonly label: string;
  readonly number: number;
}

export const ONBOARDING_STEPS: readonly OnboardingStepDefinition[] = [
  { id: "welcome", label: "Welcome", number: 1 },
  { id: "dealership", label: "Dealership", number: 2 },
  { id: "branding", label: "Branding", number: 3 },
  { id: "branch", label: "Branch", number: 4 },
  { id: "team", label: "Team", number: 5 },
  { id: "subscription", label: "Plan", number: 6 },
  { id: "review", label: "Review", number: 7 },
  { id: "success", label: "Complete", number: 8 },
] as const;

export type BusinessType =
  | "independent"
  | "franchise"
  | "motorcycle"
  | "commercial"
  | "luxury";

export type SubscriptionPackageId = "starter" | "growth" | "enterprise";

export interface DealershipInfo {
  readonly dealershipName: string;
  readonly tradingName: string;
  readonly businessType: BusinessType | "";
  readonly province: string;
  readonly city: string;
  readonly website: string;
}

export interface BrandingInfo {
  readonly logoPreview: string | null;
  readonly logoFileName: string | null;
  readonly coverPreview: string | null;
  readonly coverFileName: string | null;
  readonly primaryColor: string;
  readonly secondaryColor: string;
}

export interface BranchInfo {
  readonly branchName: string;
  readonly physicalAddress: string;
  readonly contactNumber: string;
  readonly businessHours: string;
}

export interface TeamInfo {
  readonly fullName: string;
  readonly position: string;
  readonly email: string;
  readonly password: string;
}

export interface OnboardingFormData {
  readonly dealership: DealershipInfo;
  readonly branding: BrandingInfo;
  readonly branch: BranchInfo;
  readonly team: TeamInfo;
  readonly subscriptionPackage: SubscriptionPackageId | "";
}

export const INITIAL_ONBOARDING_DATA: OnboardingFormData = {
  dealership: {
    dealershipName: "",
    tradingName: "",
    businessType: "",
    province: "",
    city: "",
    website: "",
  },
  branding: {
    logoPreview: null,
    logoFileName: null,
    coverPreview: null,
    coverFileName: null,
    primaryColor: "#0066ff",
    secondaryColor: "#c8a96e",
  },
  branch: {
    branchName: "",
    physicalAddress: "",
    contactNumber: "",
    businessHours: "",
  },
  team: {
    fullName: "",
    position: "",
    email: "",
    password: "",
  },
  subscriptionPackage: "",
};
