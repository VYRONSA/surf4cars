import { readPlatformStore, updatePlatformStore } from "@/lib/local-persistence/platform-store";
import { createDomainServerClient } from "@/lib/supabase/service-client";
import { resolveRolePermissions } from "@/features/dealer-onboarding/config/staff-roles";
import type {
  InviteTeamMemberRequest,
  DealershipBranchRecord,
  DealershipProfileRecord,
  TeamMembershipRecord,
  UpdateBranchRequest,
  UpdateDealershipProfileRequest,
  UpdateTeamMemberRequest,
} from "@/features/dealership/types/dealership-management.types";

/*
  Mirrors the `dealerships` table as it actually is.

  `registration_number`, `vat_number`, `email`, `telephone` and `whatsapp` are nullable. They were declared
  here as plain `string` while the columns were `not null`, and that constraint is exactly what forced the
  seed to invent 128 sets of contact details and legal identifiers. The columns now permit "not supplied",
  so this type has to as well — a nullable column typed as non-null is a lie the compiler will defend.
*/
interface DealershipRow {
  readonly id: string;
  readonly business_name: string;
  readonly trading_name: string;
  readonly registration_number: string | null;
  readonly vat_number: string | null;
  readonly dealer_licence_number: string | null;
  readonly business_type: string;
  readonly physical_address: string;
  readonly province: string;
  readonly city: string;
  readonly postal_code: string;
  readonly gps_latitude: string;
  readonly gps_longitude: string;
  readonly telephone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly logo_data_url: string | null;
  readonly cover_data_url: string | null;
  readonly primary_color: string;
  readonly secondary_color: string;
  readonly updated_at: string;
}

interface BranchRow {
  readonly id: string;
  readonly dealership_id: string;
  readonly name: string;
  readonly address: string;
  readonly province: string;
  readonly city: string;
  readonly postal_code: string;
  readonly telephone: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly business_hours: string;
  readonly branch_manager: string;
  readonly updated_at: string;
}

interface TeamMembershipRow {
  readonly id: string;
  readonly dealership_id: string;
  readonly branch_id: string;
  readonly user_id: string | null;
  readonly full_name: string;
  readonly email: string;
  readonly role_id: string;
  readonly permissions: readonly string[];
  readonly status: string;
  readonly invited_at: string;
  readonly accepted_at: string | null;
  readonly updated_at: string;
}

/**
 * A blank input means "not supplied", and that has exactly one representation: NULL.
 *
 * Without this, clearing a field in the dealer's profile form would store "" — a third state alongside NULL
 * and a real value, indistinguishable from a supplied blank, and invisible to every `is not null` check the
 * Founder Quality Centre relies on. It is the same fabrication problem the seed had, one layer up.
 */
const blankToNull = (value: string | null | undefined): string | null => {
  const text = String(value ?? "").trim();
  return text.length === 0 ? null : text;
};

function toProfileFromLocal(input: {
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
}): DealershipProfileRecord {
  return {
    id: input.id,
    businessName: input.businessName,
    tradingName: input.tradingName,
    registrationNumber: input.registrationNumber,
    vatNumber: input.vatNumber,
    dealerLicenceNumber: input.dealerLicenceNumber,
    businessType: input.businessType,
    physicalAddress: input.physicalAddress,
    province: input.province,
    city: input.city,
    postalCode: input.postalCode,
    gpsLatitude: input.gpsLatitude,
    gpsLongitude: input.gpsLongitude,
    telephone: input.telephone,
    whatsapp: input.whatsapp,
    email: input.email,
    website: input.website,
    logoDataUrl: input.logoDataUrl,
    coverDataUrl: input.coverDataUrl,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    updatedAt: input.updatedAt,
  };
}

function toProfileFromSupabase(row: DealershipRow): DealershipProfileRecord {
  return {
    id: row.id,
    businessName: row.business_name,
    tradingName: row.trading_name,
    registrationNumber: row.registration_number,
    vatNumber: row.vat_number,
    dealerLicenceNumber: row.dealer_licence_number,
    businessType: row.business_type,
    physicalAddress: row.physical_address,
    province: row.province,
    city: row.city,
    postalCode: row.postal_code,
    gpsLatitude: row.gps_latitude,
    gpsLongitude: row.gps_longitude,
    telephone: row.telephone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    logoDataUrl: row.logo_data_url,
    coverDataUrl: row.cover_data_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    updatedAt: row.updated_at,
  };
}

function toBranchFromLocal(input: {
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
}): DealershipBranchRecord {
  return {
    id: input.id,
    dealershipId: input.dealershipId,
    name: input.name,
    address: input.address,
    province: input.province,
    city: input.city,
    postalCode: input.postalCode,
    telephone: input.telephone,
    whatsapp: input.whatsapp,
    email: input.email,
    businessHours: input.businessHours,
    branchManager: input.branchManager,
    updatedAt: input.updatedAt,
  };
}

function toBranchFromSupabase(row: BranchRow): DealershipBranchRecord {
  return {
    id: row.id,
    dealershipId: row.dealership_id,
    name: row.name,
    address: row.address,
    province: row.province,
    city: row.city,
    postalCode: row.postal_code,
    telephone: row.telephone,
    whatsapp: row.whatsapp,
    email: row.email,
    businessHours: row.business_hours,
    branchManager: row.branch_manager,
    updatedAt: row.updated_at,
  };
}

function toTeamMembershipFromLocal(input: {
  readonly id: string;
  readonly dealershipId: string;
  readonly branchId: string;
  readonly userId: string | null;
  readonly fullName: string;
  readonly email: string;
  readonly roleId: string;
  readonly permissions: readonly string[];
  readonly status: string;
  readonly invitedAt: string;
  readonly acceptedAt: string | null;
  readonly updatedAt: string;
}): TeamMembershipRecord {
  const status = input.status === "active"
    || input.status === "deactivated"
    || input.status === "removed"
    || input.status === "invited"
    ? input.status
    : "invited";

  return {
    id: input.id,
    dealershipId: input.dealershipId,
    branchId: input.branchId,
    userId: input.userId,
    fullName: input.fullName,
    email: input.email,
    roleId: input.roleId,
    permissions: input.permissions,
    status,
    invitedAt: input.invitedAt,
    acceptedAt: input.acceptedAt,
    updatedAt: input.updatedAt,
  };
}

function toTeamMembershipFromSupabase(row: TeamMembershipRow): TeamMembershipRecord {
  return toTeamMembershipFromLocal({
    id: row.id,
    dealershipId: row.dealership_id,
    branchId: row.branch_id,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    roleId: row.role_id,
    permissions: row.permissions,
    status: row.status,
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
    updatedAt: row.updated_at,
  });
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

async function logTeamAuditEvent(params: {
  readonly dealershipId: string;
  readonly membershipId: string;
  readonly eventName: string;
  readonly payload: Record<string, unknown>;
  readonly accessToken?: string;
}) {
  const nowIso = new Date().toISOString();
  const supabase = createDomainServerClient(params.accessToken);

  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      marketAnalyticsEvents: [
        ...current.marketAnalyticsEvents,
        {
          id: crypto.randomUUID(),
          dealershipId: params.dealershipId,
          vehicleId: null,
          eventType: "team-management",
          eventName: params.eventName,
          eventTimestamp: nowIso,
          actorId: null,
          actorType: "system",
          sessionId: null,
          source: "dealership-team",
          payload: {
            membershipId: params.membershipId,
            ...params.payload,
          },
          createdAt: nowIso,
        },
      ],
    }));
    return;
  }

  await supabase.from("market_analytics_events").insert({
    id: crypto.randomUUID(),
    dealership_id: params.dealershipId,
    vehicle_id: null,
    event_type: "team-management",
    event_name: params.eventName,
    event_timestamp: nowIso,
    actor_id: null,
    actor_type: "system",
    source: "dealership-team",
    payload: {
      membershipId: params.membershipId,
      ...params.payload,
    },
    created_at: nowIso,
  });
}

export async function getDealershipProfile(
  dealershipId: string,
  accessToken?: string,
): Promise<DealershipProfileRecord> {
  const supabase = createDomainServerClient(accessToken);

  if (!supabase) {
    const store = await readPlatformStore();
    const record = store.dealerships.find((item) => item.id === dealershipId);
    if (!record) {
      throw new Error("Dealership profile not found.");
    }

    return toProfileFromLocal(record);
  }

  const { data, error } = await supabase
    .from("dealerships")
    .select("*")
    .eq("id", dealershipId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Dealership profile not found.");
  }

  return toProfileFromSupabase(data as DealershipRow);
}

export async function updateDealershipProfile(
  dealershipId: string,
  payload: UpdateDealershipProfileRequest,
  accessToken?: string,
): Promise<DealershipProfileRecord> {
  const supabase = createDomainServerClient(accessToken);

  if (!supabase) {
    const nowIso = new Date().toISOString();
    const next = await updatePlatformStore((current) => ({
      ...current,
      dealerships: current.dealerships.map((item) =>
        item.id === dealershipId
          ? {
              ...item,
              businessName: payload.businessName,
              tradingName: payload.tradingName,
              registrationNumber: payload.registrationNumber,
              vatNumber: payload.vatNumber,
              dealerLicenceNumber: payload.dealerLicenceNumber,
              businessType: payload.businessType,
              physicalAddress: payload.physicalAddress,
              province: payload.province,
              city: payload.city,
              postalCode: payload.postalCode,
              gpsLatitude: payload.gpsLatitude,
              gpsLongitude: payload.gpsLongitude,
              telephone: blankToNull(payload.telephone),
              whatsapp: blankToNull(payload.whatsapp),
              email: blankToNull(payload.email),
              website: blankToNull(payload.website),
              primaryColor: payload.primaryColor,
              secondaryColor: payload.secondaryColor,
              updatedAt: nowIso,
            }
          : item,
      ),
    }));

    const record = next.dealerships.find((item) => item.id === dealershipId);
    if (!record) {
      throw new Error("Dealership profile not found.");
    }

    return toProfileFromLocal(record);
  }

  const { error: updateError } = await supabase
    .from("dealerships")
    .update({
      business_name: payload.businessName,
      trading_name: payload.tradingName,
      registration_number: blankToNull(payload.registrationNumber),
      vat_number: blankToNull(payload.vatNumber),
      dealer_licence_number: blankToNull(payload.dealerLicenceNumber),
      business_type: payload.businessType,
      physical_address: payload.physicalAddress,
      province: payload.province,
      city: payload.city,
      postal_code: payload.postalCode,
      gps_latitude: payload.gpsLatitude,
      gps_longitude: payload.gpsLongitude,
      telephone: blankToNull(payload.telephone),
      whatsapp: blankToNull(payload.whatsapp),
      email: blankToNull(payload.email),
      website: blankToNull(payload.website),
      primary_color: payload.primaryColor,
      secondary_color: payload.secondaryColor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealershipId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return getDealershipProfile(dealershipId, accessToken);
}

export async function getDealershipBranches(
  dealershipId: string,
  accessToken?: string,
): Promise<readonly DealershipBranchRecord[]> {
  const supabase = createDomainServerClient(accessToken);

  if (!supabase) {
    const store = await readPlatformStore();
    return store.branches
      .filter((item) => item.dealershipId === dealershipId)
      .map((item) => toBranchFromLocal(item));
  }

  const { data, error } = await supabase
    .from("dealership_branches")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => toBranchFromSupabase(item as BranchRow));
}

export async function updateDealershipBranch(
  dealershipId: string,
  branchId: string,
  payload: UpdateBranchRequest,
  accessToken?: string,
): Promise<DealershipBranchRecord> {
  const supabase = createDomainServerClient(accessToken);

  if (!supabase) {
    const nowIso = new Date().toISOString();
    const next = await updatePlatformStore((current) => ({
      ...current,
      branches: current.branches.map((item) =>
        item.id === branchId && item.dealershipId === dealershipId
          ? {
              ...item,
              name: payload.name,
              address: payload.address,
              province: payload.province,
              city: payload.city,
              postalCode: payload.postalCode,
              telephone: blankToNull(payload.telephone),
              whatsapp: blankToNull(payload.whatsapp),
              email: blankToNull(payload.email),
              businessHours: payload.businessHours,
              branchManager: payload.branchManager,
              updatedAt: nowIso,
            }
          : item,
      ),
    }));

    const record = next.branches.find((item) => item.id === branchId && item.dealershipId === dealershipId);
    if (!record) {
      throw new Error("Branch not found.");
    }

    return toBranchFromLocal(record);
  }

  const { error: updateError } = await supabase
    .from("dealership_branches")
    .update({
      name: payload.name,
      address: payload.address,
      province: payload.province,
      city: payload.city,
      postal_code: payload.postalCode,
      telephone: blankToNull(payload.telephone),
      whatsapp: blankToNull(payload.whatsapp),
      email: blankToNull(payload.email),
      business_hours: payload.businessHours,
      branch_manager: payload.branchManager,
      updated_at: new Date().toISOString(),
    })
    .eq("id", branchId)
    .eq("dealership_id", dealershipId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const branches = await getDealershipBranches(dealershipId, accessToken);
  const branch = branches.find((item) => item.id === branchId);

  if (!branch) {
    throw new Error("Branch not found.");
  }

  return branch;
}

/**
 * Opening a branch.
 *
 * Contact details are optional and stay NULL when not supplied. A branch a dealer has just created
 * genuinely has no telephone number recorded yet, and inventing one — or storing "" so the field
 * looks answered — is how 128 dealerships ended up with contact details nobody had ever given us.
 */
export async function createDealershipBranch(
  dealershipId: string,
  payload: UpdateBranchRequest,
  accessToken?: string,
): Promise<DealershipBranchRecord> {
  const supabase = createDomainServerClient(accessToken);
  const nowIso = new Date().toISOString();
  const id = `branch-${crypto.randomUUID()}`;

  if (!payload.name?.trim()) {
    throw new Error("Give the branch a name.");
  }

  if (!supabase) {
    const next = await updatePlatformStore((current) => ({
      ...current,
      branches: [
        ...current.branches,
        {
          id,
          dealershipId,
          name: payload.name,
          address: payload.address,
          province: payload.province,
          city: payload.city,
          postalCode: payload.postalCode,
          telephone: blankToNull(payload.telephone),
          whatsapp: blankToNull(payload.whatsapp),
          email: blankToNull(payload.email),
          businessHours: payload.businessHours,
          branchManager: payload.branchManager,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
    }));

    const record = next.branches.find((item) => item.id === id);
    if (!record) throw new Error("Failed to create the branch.");
    return toBranchFromLocal(record);
  }

  const { error } = await supabase.from("dealership_branches").insert({
    id,
    dealership_id: dealershipId,
    name: payload.name,
    address: payload.address,
    province: payload.province,
    city: payload.city,
    postal_code: payload.postalCode,
    telephone: blankToNull(payload.telephone),
    whatsapp: blankToNull(payload.whatsapp),
    email: blankToNull(payload.email),
    business_hours: payload.businessHours,
    branch_manager: payload.branchManager,
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (error) throw new Error(error.message);

  const branches = await getDealershipBranches(dealershipId, accessToken);
  const branch = branches.find((item) => item.id === id);
  if (!branch) throw new Error("Failed to create the branch.");
  return branch;
}

/**
 * Closing a branch — and the reason this refuses more often than it succeeds.
 *
 * THE CASCADE THIS EXISTS TO PREVENT
 * ==================================
 * `inventory_vehicles.branch_id` is `not null references dealership_branches(id) on delete cascade`.
 * A plain delete would therefore take every vehicle at that branch with it, silently, along with
 * their photographs and equipment — a dealer tidying up a branch they no longer trade from would
 * destroy the stock they had just spent a morning importing, and nothing would tell them until a
 * buyer asked where the cars went.
 *
 * The same cascade reaches `dealership_staff_memberships`, so the team assigned there would go too.
 *
 * So the branch is only removed when nothing points at it, and the refusal names the count and the
 * fix. A dealership that genuinely wants the stock gone deletes or moves the vehicles first, which
 * is a decision they take deliberately rather than one this function takes for them.
 */
export async function deleteDealershipBranch(
  dealershipId: string,
  branchId: string,
  accessToken?: string,
): Promise<void> {
  const supabase = createDomainServerClient(accessToken);

  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      branches: current.branches.filter(
        (item) => !(item.id === branchId && item.dealershipId === dealershipId),
      ),
    }));
    return;
  }

  const branches = await getDealershipBranches(dealershipId, accessToken);
  if (branches.length <= 1) {
    throw new Error(
      "This is your only branch. A dealership needs at least one, so add the new one before closing this.",
    );
  }

  const { count: vehicleCount, error: vehicleError } = await supabase
    .from("inventory_vehicles")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId)
    .eq("dealership_id", dealershipId);

  if (vehicleError) throw new Error(vehicleError.message);

  if ((vehicleCount ?? 0) > 0) {
    throw new Error(
      `${vehicleCount} ${vehicleCount === 1 ? "vehicle is" : "vehicles are"} still listed at this branch. Move them to another branch first — closing it now would delete them.`,
    );
  }

  const { count: staffCount, error: staffError } = await supabase
    .from("dealership_staff_memberships")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId)
    .eq("dealership_id", dealershipId)
    .neq("status", "removed");

  if (staffError) throw new Error(staffError.message);

  if ((staffCount ?? 0) > 0) {
    throw new Error(
      `${staffCount} ${staffCount === 1 ? "person is" : "people are"} assigned to this branch. Move them to another branch first.`,
    );
  }

  const { error } = await supabase
    .from("dealership_branches")
    .delete()
    .eq("id", branchId)
    .eq("dealership_id", dealershipId);

  if (error) throw new Error(error.message);
}

export async function getDealershipTeam(
  dealershipId: string,
  accessToken?: string,
): Promise<readonly TeamMembershipRecord[]> {
  const supabase = createDomainServerClient(accessToken);

  if (!supabase) {
    const store = await readPlatformStore();
    return store.staffMemberships
      .filter((item) => item.dealershipId === dealershipId)
      .map((item) => toTeamMembershipFromLocal(item))
      .sort((a, b) => a.invitedAt.localeCompare(b.invitedAt));
  }

  const { data, error } = await supabase
    .from("dealership_staff_memberships")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("invited_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => toTeamMembershipFromSupabase(item as TeamMembershipRow));
}

export async function inviteDealershipTeamMember(
  dealershipId: string,
  payload: InviteTeamMemberRequest,
  accessToken?: string,
): Promise<TeamMembershipRecord> {
  const supabase = createDomainServerClient(accessToken);
  const nowIso = new Date().toISOString();
  const normalizedEmail = normalizeEmail(payload.email);
  const permissions = resolveRolePermissions(payload.roleId as never);

  if (!supabase) {
    const next = await updatePlatformStore((current) => {
      const existing = current.staffMemberships.find(
        (item) => item.dealershipId === dealershipId && normalizeEmail(item.email) === normalizedEmail,
      );

      if (existing) {
        return {
          ...current,
          staffMemberships: current.staffMemberships.map((item) =>
            item.id === existing.id
              ? {
                  ...item,
                  fullName: payload.fullName,
                  email: normalizedEmail,
                  roleId: payload.roleId,
                  branchId: payload.branchId,
                  permissions,
                  status: "invited",
                  invitedAt: nowIso,
                  updatedAt: nowIso,
                }
              : item,
          ),
        };
      }

      return {
        ...current,
        staffMemberships: [
          ...current.staffMemberships,
          {
            id: `staff-${crypto.randomUUID()}`,
            dealershipId,
            branchId: payload.branchId,
            userId: null,
            fullName: payload.fullName,
            email: normalizedEmail,
            roleId: payload.roleId,
            permissions,
            status: "invited",
            invitedAt: nowIso,
            acceptedAt: null,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        ],
      };
    });

    const membership = next.staffMemberships.find(
      (item) => item.dealershipId === dealershipId && normalizeEmail(item.email) === normalizedEmail,
    );

    if (!membership) {
      throw new Error("Failed to invite team member.");
    }

    await logTeamAuditEvent({
      dealershipId,
      membershipId: membership.id,
      eventName: "team-member-invited",
      payload: { email: normalizedEmail, roleId: payload.roleId, branchId: payload.branchId },
      accessToken,
    });

    return toTeamMembershipFromLocal(membership);
  }

  const { error: upsertError } = await supabase
    .from("dealership_staff_memberships")
    .upsert(
      {
        id: `staff-${crypto.randomUUID()}`,
        dealership_id: dealershipId,
        branch_id: payload.branchId,
        full_name: payload.fullName,
        email: normalizedEmail,
        role_id: payload.roleId,
        permissions,
        status: "invited",
        invited_at: nowIso,
        updated_at: nowIso,
      },
      {
        onConflict: "dealership_id,email",
      },
    );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const members = await getDealershipTeam(dealershipId, accessToken);
  const membership = members.find((item) => normalizeEmail(item.email) === normalizedEmail);

  if (!membership) {
    throw new Error("Failed to invite team member.");
  }

  await logTeamAuditEvent({
    dealershipId,
    membershipId: membership.id,
    eventName: "team-member-invited",
    payload: { email: normalizedEmail, roleId: payload.roleId, branchId: payload.branchId },
    accessToken,
  });

  return membership;
}

export async function updateDealershipTeamMember(
  dealershipId: string,
  membershipId: string,
  payload: UpdateTeamMemberRequest,
  accessToken?: string,
): Promise<TeamMembershipRecord> {
  const supabase = createDomainServerClient(accessToken);
  const nextStatus = payload.removeAccess ? "removed" : payload.status;
  const nextPermissions = payload.removeAccess
    ? []
    : resolveRolePermissions(payload.roleId as never);
  const nowIso = new Date().toISOString();

  if (!supabase) {
    const next = await updatePlatformStore((current) => ({
      ...current,
      staffMemberships: current.staffMemberships.map((item) =>
        item.id === membershipId && item.dealershipId === dealershipId
          ? {
              ...item,
              branchId: payload.branchId,
              roleId: payload.roleId,
              permissions: nextPermissions,
              status: nextStatus,
              updatedAt: nowIso,
            }
          : item,
      ),
    }));

    const membership = next.staffMemberships.find(
      (item) => item.id === membershipId && item.dealershipId === dealershipId,
    );

    if (!membership) {
      throw new Error("Team member not found.");
    }

    await logTeamAuditEvent({
      dealershipId,
      membershipId,
      eventName: payload.removeAccess ? "team-member-access-removed" : "team-member-updated",
      payload: {
        roleId: payload.roleId,
        branchId: payload.branchId,
        status: nextStatus,
      },
      accessToken,
    });

    return toTeamMembershipFromLocal(membership);
  }

  const { error: updateError } = await supabase
    .from("dealership_staff_memberships")
    .update({
      branch_id: payload.branchId,
      role_id: payload.roleId,
      permissions: nextPermissions,
      status: nextStatus,
      updated_at: nowIso,
    })
    .eq("id", membershipId)
    .eq("dealership_id", dealershipId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const members = await getDealershipTeam(dealershipId, accessToken);
  const membership = members.find((item) => item.id === membershipId);

  if (!membership) {
    throw new Error("Team member not found.");
  }

  await logTeamAuditEvent({
    dealershipId,
    membershipId,
    eventName: payload.removeAccess ? "team-member-access-removed" : "team-member-updated",
    payload: {
      roleId: payload.roleId,
      branchId: payload.branchId,
      status: nextStatus,
    },
    accessToken,
  });

  return membership;
}
