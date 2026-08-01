import type { BranchInfo, OnboardingFormData, StaffInvite } from "@/features/dealer-onboarding/types/onboarding.types";

interface ValidationResult {
  readonly valid: boolean;
  readonly message?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function isEmail(value: string): boolean {
  return emailRegex.test(value.trim());
}

export function validateDealership(data: OnboardingFormData): ValidationResult {
  const item = data.dealership;

  if (isBlank(item.businessName)) return { valid: false, message: "Business name is required." };
  if (isBlank(item.tradingName)) return { valid: false, message: "Trading name is required." };
  if (isBlank(item.registrationNumber)) return { valid: false, message: "Registration number is required." };
  if (isBlank(item.vatNumber)) return { valid: false, message: "VAT number is required." };
  if (!item.businessType) return { valid: false, message: "Business type is required." };
  if (isBlank(item.physicalAddress)) return { valid: false, message: "Physical address is required." };
  if (isBlank(item.province)) return { valid: false, message: "Province is required." };
  if (isBlank(item.city)) return { valid: false, message: "City is required." };
  if (isBlank(item.postalCode)) return { valid: false, message: "Postal code is required." };
  if (isBlank(item.telephone)) return { valid: false, message: "Telephone is required." };
  if (isBlank(item.whatsapp)) return { valid: false, message: "WhatsApp is required." };
  if (!isEmail(item.email)) return { valid: false, message: "Dealership email is invalid." };
  if (isBlank(item.gps.latitude)) return { valid: false, message: "GPS latitude is required." };
  if (isBlank(item.gps.longitude)) return { valid: false, message: "GPS longitude is required." };
  if (item.website && !item.website.startsWith("http://") && !item.website.startsWith("https://")) {
    return { valid: false, message: "Website must start with http:// or https://." };
  }

  return { valid: true };
}

export function validateBranding(data: OnboardingFormData): ValidationResult {
  if (!data.branding.logoPreview) {
    return { valid: false, message: "Please upload a dealership logo." };
  }
  if (!data.branding.coverPreview) {
    return { valid: false, message: "Please upload a dealership cover image." };
  }
  return { valid: true };
}

function validateBranch(branch: BranchInfo, index: number): ValidationResult {
  const label = `Branch ${index + 1}`;

  if (isBlank(branch.branchName)) return { valid: false, message: `${label}: branch name is required.` };
  if (isBlank(branch.address)) return { valid: false, message: `${label}: address is required.` };
  if (isBlank(branch.province)) return { valid: false, message: `${label}: province is required.` };
  if (isBlank(branch.city)) return { valid: false, message: `${label}: city is required.` };
  if (isBlank(branch.postalCode)) return { valid: false, message: `${label}: postal code is required.` };
  if (isBlank(branch.telephone)) return { valid: false, message: `${label}: telephone is required.` };
  if (isBlank(branch.whatsapp)) return { valid: false, message: `${label}: WhatsApp is required.` };
  if (!isEmail(branch.email)) return { valid: false, message: `${label}: email is invalid.` };
  if (isBlank(branch.businessHours)) return { valid: false, message: `${label}: business hours are required.` };
  if (isBlank(branch.branchManager)) return { valid: false, message: `${label}: branch manager is required.` };

  return { valid: true };
}

export function validateBranches(data: OnboardingFormData): ValidationResult {
  if (data.branches.length === 0) {
    return { valid: false, message: "At least one branch is required." };
  }

  for (let i = 0; i < data.branches.length; i += 1) {
    const result = validateBranch(data.branches[i]!, i);
    if (!result.valid) return result;
  }

  return { valid: true };
}

function validateInvite(invite: StaffInvite, index: number): ValidationResult {
  const label = `Staff invite ${index + 1}`;

  if (isBlank(invite.fullName)) return { valid: false, message: `${label}: full name is required.` };
  if (!isEmail(invite.email)) return { valid: false, message: `${label}: email is invalid.` };

  return { valid: true };
}

export function validateTeam(data: OnboardingFormData): ValidationResult {
  const owner = data.ownerAccount;

  if (isBlank(owner.fullName)) return { valid: false, message: "Owner full name is required." };
  if (!isEmail(owner.email)) return { valid: false, message: "Owner email is invalid." };
  if (owner.password.length < 8) return { valid: false, message: "Owner password must be at least 8 characters." };

  for (let i = 0; i < data.staffInvites.length; i += 1) {
    const result = validateInvite(data.staffInvites[i]!, i);
    if (!result.valid) return result;
  }

  return { valid: true };
}

export function validateSubscription(data: OnboardingFormData): ValidationResult {
  if (!data.subscriptionPackage) {
    return { valid: false, message: "Please select a package." };
  }
  return { valid: true };
}

export function validateForCompletion(data: OnboardingFormData): ValidationResult {
  const validators = [
    validateDealership,
    validateBranding,
    validateBranches,
    validateTeam,
    validateSubscription,
  ];

  for (const validator of validators) {
    const result = validator(data);
    if (!result.valid) return result;
  }

  return { valid: true };
}
