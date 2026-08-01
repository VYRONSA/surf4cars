/**
 * A dealership as the platform holds it.
 *
 * The nullable fields are nullable because the dealership may genuinely not have supplied them — and in two
 * cases may genuinely not have them at all: VAT registration is voluntary in South Africa below R1 million
 * turnover, and a sole proprietor has no CIPC registration number. These were previously non-null all the
 * way from the column to here, which is why 128 records carried invented values.
 *
 * Render absence as absence. Do not coerce to an empty string on the way out — "" is indistinguishable from
 * a supplied blank and puts the fabrication problem back, one layer higher.
 */
export interface DealershipProfileRecord {
  readonly id: string;
  readonly businessName: string;
  readonly tradingName: string;
  readonly registrationNumber: string | null;
  readonly vatNumber: string | null;
  readonly dealerLicenceNumber: string | null;
  readonly businessType: string;
  readonly physicalAddress: string;
  readonly province: string;
  readonly city: string;
  readonly postalCode: string;
  readonly gpsLatitude: string;
  readonly gpsLongitude: string;
  readonly telephone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly logoDataUrl: string | null;
  readonly coverDataUrl: string | null;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly updatedAt: string;
}

/**
 * What the dealer's own profile form submits.
 *
 * The optional identifiers and contact fields are nullable here for the same reason they are nullable on the
 * record: the dealer may not have them. A blank input is normalised to NULL at the write boundary rather
 * than stored as "", so that "not supplied" has exactly one representation in the database.
 */
export interface UpdateDealershipProfileRequest {
  readonly businessName: string;
  readonly tradingName: string;
  readonly registrationNumber: string | null;
  readonly vatNumber: string | null;
  readonly dealerLicenceNumber: string | null;
  readonly businessType: string;
  readonly physicalAddress: string;
  readonly province: string;
  readonly city: string;
  readonly postalCode: string;
  readonly gpsLatitude: string;
  readonly gpsLongitude: string;
  readonly telephone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly primaryColor: string;
  readonly secondaryColor: string;
}

export interface DealershipBranchRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly name: string;
  readonly address: string;
  readonly province: string;
  readonly city: string;
  readonly postalCode: string;
  readonly telephone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly businessHours: string;
  readonly branchManager: string;
  readonly updatedAt: string;
}

export interface UpdateBranchRequest {
  readonly name: string;
  readonly address: string;
  readonly province: string;
  readonly city: string;
  readonly postalCode: string;
  readonly telephone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly businessHours: string;
  readonly branchManager: string;
}

export type TeamMembershipStatus = "invited" | "active" | "deactivated" | "removed";

export interface TeamMembershipRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly branchId: string;
  readonly userId: string | null;
  readonly fullName: string;
  readonly email: string;
  readonly roleId: string;
  readonly permissions: readonly string[];
  readonly status: TeamMembershipStatus;
  readonly invitedAt: string;
  readonly acceptedAt: string | null;
  readonly updatedAt: string;
}

export interface InviteTeamMemberRequest {
  readonly fullName: string;
  readonly email: string;
  readonly roleId: string;
  readonly branchId: string;
}

export interface UpdateTeamMemberRequest {
  readonly roleId: string;
  readonly branchId: string;
  readonly status: TeamMembershipStatus;
  readonly removeAccess: boolean;
}
