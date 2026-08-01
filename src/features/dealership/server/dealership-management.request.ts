import type {
  InviteTeamMemberRequest,
  UpdateBranchRequest,
  UpdateDealershipProfileRequest,
  UpdateTeamMemberRequest,
} from "@/features/dealership/types/dealership-management.types";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const next = value.trim();
  return next.length > 0 ? next : null;
}

function requireEmail(value: unknown, field: string): string {
  const next = requireText(value, field);
  if (!emailRegex.test(next)) {
    throw new Error(`${field} is invalid.`);
  }
  return next;
}

function requireHexColor(value: unknown, field: string): string {
  const next = requireText(value, field);
  if (!/^#[0-9a-fA-F]{6}$/.test(next)) {
    throw new Error(`${field} must be a valid hex color.`);
  }
  return next;
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid request payload.");
  }

  return value as Record<string, unknown>;
}

export function parseDealershipIdFromUrl(url: URL): string {
  const dealershipId = url.searchParams.get("dealershipId")?.trim();
  if (!dealershipId) {
    throw new Error("dealershipId is required.");
  }
  return dealershipId;
}

export async function parseDealershipProfileUpdateRequest(
  request: Request,
): Promise<UpdateDealershipProfileRequest> {
  const body = asObject(await request.json());

  const website = optionalText(body.website);
  if (website && !website.startsWith("http://") && !website.startsWith("https://")) {
    throw new Error("website must start with http:// or https://.");
  }

  return {
    businessName: requireText(body.businessName, "businessName"),
    tradingName: requireText(body.tradingName, "tradingName"),
    registrationNumber: requireText(body.registrationNumber, "registrationNumber"),
    vatNumber: requireText(body.vatNumber, "vatNumber"),
    dealerLicenceNumber: optionalText(body.dealerLicenceNumber),
    businessType: requireText(body.businessType, "businessType"),
    physicalAddress: requireText(body.physicalAddress, "physicalAddress"),
    province: requireText(body.province, "province"),
    city: requireText(body.city, "city"),
    postalCode: requireText(body.postalCode, "postalCode"),
    gpsLatitude: requireText(body.gpsLatitude, "gpsLatitude"),
    gpsLongitude: requireText(body.gpsLongitude, "gpsLongitude"),
    telephone: requireText(body.telephone, "telephone"),
    whatsapp: requireText(body.whatsapp, "whatsapp"),
    email: requireEmail(body.email, "email"),
    website,
    primaryColor: requireHexColor(body.primaryColor, "primaryColor"),
    secondaryColor: requireHexColor(body.secondaryColor, "secondaryColor"),
  };
}

export async function parseBranchUpdateRequest(request: Request): Promise<UpdateBranchRequest> {
  const body = asObject(await request.json());

  return {
    name: requireText(body.name, "name"),
    address: requireText(body.address, "address"),
    province: requireText(body.province, "province"),
    city: requireText(body.city, "city"),
    postalCode: requireText(body.postalCode, "postalCode"),
    telephone: requireText(body.telephone, "telephone"),
    whatsapp: requireText(body.whatsapp, "whatsapp"),
    email: requireEmail(body.email, "email"),
    businessHours: requireText(body.businessHours, "businessHours"),
    branchManager: requireText(body.branchManager, "branchManager"),
  };
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be true or false.`);
  }
  return value;
}

function requireTeamStatus(value: unknown): "invited" | "active" | "deactivated" | "removed" {
  const status = requireText(value, "status");
  if (status === "invited" || status === "active" || status === "deactivated" || status === "removed") {
    return status;
  }
  throw new Error("status is invalid.");
}

export async function parseTeamInviteRequest(request: Request): Promise<InviteTeamMemberRequest> {
  const body = asObject(await request.json());

  return {
    fullName: requireText(body.fullName, "fullName"),
    email: requireEmail(body.email, "email").toLowerCase(),
    roleId: requireText(body.roleId, "roleId"),
    branchId: requireText(body.branchId, "branchId"),
  };
}

export async function parseTeamMemberUpdateRequest(request: Request): Promise<UpdateTeamMemberRequest> {
  const body = asObject(await request.json());

  return {
    roleId: requireText(body.roleId, "roleId"),
    branchId: requireText(body.branchId, "branchId"),
    status: requireTeamStatus(body.status),
    removeAccess: requireBoolean(body.removeAccess, "removeAccess"),
  };
}
