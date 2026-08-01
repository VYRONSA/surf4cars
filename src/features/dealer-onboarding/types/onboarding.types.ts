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

export type StaffRoleId =
  | "owner"
  | "dealer-principal"
  | "sales-manager"
  | "sales-executive"
  | "administrator"
  | "photographer"
  | "marketing"
  | "finance-insurance";

export interface GpsLocation {
  readonly latitude: string;
  readonly longitude: string;
}

export interface DealershipInfo {
  readonly businessName: string;
  readonly tradingName: string;
  readonly registrationNumber: string;
  readonly vatNumber: string;
  readonly dealerLicenceNumber: string;
  readonly businessType: BusinessType | "";
  readonly physicalAddress: string;
  readonly province: string;
  readonly city: string;
  readonly postalCode: string;
  readonly gps: GpsLocation;
  readonly telephone: string;
  readonly whatsapp: string;
  readonly email: string;
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
  readonly id: string;
  readonly branchName: string;
  readonly address: string;
  readonly province: string;
  readonly city: string;
  readonly postalCode: string;
  readonly telephone: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly businessHours: string;
  readonly branchManager: string;
}

export interface OwnerAccountInfo {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
}

export interface StaffInvite {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: StaffRoleId;
  readonly permissions: readonly string[];
}

export interface OnboardingContextSnapshot {
  readonly currentStepIndex: number;
  readonly revision: number;
  readonly data: OnboardingFormData;
}

export interface OnboardingCompletionResult {
  readonly dealershipId: string;
  readonly primaryBranchId: string;
  readonly ownerMembershipId: string;
}

export interface OnboardingFormData {
  readonly dealership: DealershipInfo;
  readonly branding: BrandingInfo;
  readonly branches: readonly BranchInfo[];
  readonly ownerAccount: OwnerAccountInfo;
  readonly staffInvites: readonly StaffInvite[];
  readonly subscriptionPackage: SubscriptionPackageId | "";
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultBranch(): BranchInfo {
  return {
    id: createId("branch"),
    branchName: "",
    address: "",
    province: "",
    city: "",
    postalCode: "",
    telephone: "",
    whatsapp: "",
    email: "",
    businessHours: "",
    branchManager: "",
  };
}

export function createDefaultStaffInvite(): StaffInvite {
  return {
    id: createId("invite"),
    fullName: "",
    email: "",
    role: "sales-executive",
    permissions: [],
  };
}

export const INITIAL_ONBOARDING_DATA: OnboardingFormData = {
  dealership: {
    businessName: "",
    tradingName: "",
    registrationNumber: "",
    vatNumber: "",
    dealerLicenceNumber: "",
    businessType: "",
    physicalAddress: "",
    province: "",
    city: "",
    postalCode: "",
    gps: {
      latitude: "",
      longitude: "",
    },
    telephone: "",
    whatsapp: "",
    email: "",
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
  branches: [createDefaultBranch()],
  ownerAccount: {
    fullName: "",
    email: "",
    password: "",
  },
  staffInvites: [],
  subscriptionPackage: "",
};
