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

/**
 * An email address, or nothing at all.
 *
 * WHY THE CONTACT FIELDS BECAME OPTIONAL
 * ======================================
 * They were `requireText` and `requireEmail`. The columns are nullable, the service layer runs every
 * one of them through `blankToNull`, and the platform's stated preference is that "NULL is preferred
 * in development *and* in production; 'Not provided' is a finished state, not a gap to be filled".
 *
 * The validator contradicted all three. A dealership with no WhatsApp number could not save its
 * profile at all without typing something into the WhatsApp box — so the form did not merely permit
 * a fabricated contact detail, it required one before it would let the dealer proceed. The same held
 * for VAT and company registration numbers, which many small dealerships do not have to hand.
 *
 * This is the seed's mistake with a user interface attached, and it would have produced exactly the
 * same result: plausible contact details that reach somebody, entered because the form insisted.
 */
function optionalEmail(value: unknown, field: string): string | null {
  const next = optionalText(value);
  if (next === null) return null;
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
    /* Legal identifiers are optional. A dealership below the VAT threshold has no VAT number, and a
       form that insists on one gets `4200000273` — a value that looks exactly like a real VAT number
       and that nobody ever checks. */
    registrationNumber: optionalText(body.registrationNumber),
    vatNumber: optionalText(body.vatNumber),
    dealerLicenceNumber: optionalText(body.dealerLicenceNumber),
    businessType: requireText(body.businessType, "businessType"),
    physicalAddress: requireText(body.physicalAddress, "physicalAddress"),
    province: requireText(body.province, "province"),
    city: requireText(body.city, "city"),
    postalCode: requireText(body.postalCode, "postalCode"),
    gpsLatitude: requireText(body.gpsLatitude, "gpsLatitude"),
    gpsLongitude: requireText(body.gpsLongitude, "gpsLongitude"),
    telephone: optionalText(body.telephone),
    whatsapp: optionalText(body.whatsapp),
    email: optionalEmail(body.email, "email"),
    website,
    primaryColor: requireHexColor(body.primaryColor, "primaryColor"),
    secondaryColor: requireHexColor(body.secondaryColor, "secondaryColor"),
  };
}

export async function parseBranchUpdateRequest(request: Request): Promise<UpdateBranchRequest> {
  const body = asObject(await request.json());

  return {
    /* Structural fields stay required — a branch without a name or a town is not a branch anybody
       can be sent to. Contact details and the manager's name are things a dealership supplies when
       it has them. */
    name: requireText(body.name, "name"),
    address: requireText(body.address, "address"),
    province: requireText(body.province, "province"),
    city: requireText(body.city, "city"),
    postalCode: requireText(body.postalCode, "postalCode"),
    telephone: optionalText(body.telephone),
    whatsapp: optionalText(body.whatsapp),
    email: optionalEmail(body.email, "email"),
    businessHours: optionalText(body.businessHours) ?? "",
    branchManager: optionalText(body.branchManager) ?? "",
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
