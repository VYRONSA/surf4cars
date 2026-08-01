import { updatePlatformStore } from "@/lib/local-persistence/platform-store";
import { createDomainServerClient } from "@/lib/supabase/service-client";
import type {
  BranchInfo,
  OnboardingCompletionResult,
  OnboardingFormData,
  StaffInvite,
} from "@/features/dealer-onboarding/types/onboarding.types";

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function slugifyKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function createDeterministicId(prefix: string, key: string): string {
  return `${prefix}-${slugifyKey(key)}`;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}


async function withSupabaseTimeout<T>(operation: PromiseLike<T>, label: string, timeoutMs = 7000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Supabase ${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

const OWNER_PERMISSIONS = [
  "dealer:dashboard:view",
  "dealer:team:manage",
  "dealer:branches:manage",
  "dealer:billing:manage",
  "dealer:inventory:publish",
] as const;

function createLocalBranchRecord(branch: BranchInfo, dealershipId: string, branchId: string, nowIso: string) {
  return {
    id: branchId,
    dealershipId,
    name: branch.branchName,
    address: branch.address,
    province: branch.province,
    city: branch.city,
    postalCode: branch.postalCode,
    telephone: branch.telephone,
    whatsapp: branch.whatsapp,
    email: branch.email,
    businessHours: branch.businessHours,
    branchManager: branch.branchManager,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function createLocalDealershipRecord(
  payload: OnboardingFormData,
  dealershipId: string,
  ownerUserId: string,
  nowIso: string,
) {
  return {
    id: dealershipId,
    ownerUserId,
    businessName: payload.dealership.businessName,
    tradingName: payload.dealership.tradingName,
    registrationNumber: payload.dealership.registrationNumber,
    vatNumber: payload.dealership.vatNumber,
    dealerLicenceNumber: payload.dealership.dealerLicenceNumber || null,
    businessType: payload.dealership.businessType,
    physicalAddress: payload.dealership.physicalAddress,
    province: payload.dealership.province,
    city: payload.dealership.city,
    postalCode: payload.dealership.postalCode,
    gpsLatitude: payload.dealership.gps.latitude,
    gpsLongitude: payload.dealership.gps.longitude,
    telephone: payload.dealership.telephone,
    whatsapp: payload.dealership.whatsapp,
    email: payload.dealership.email,
    website: payload.dealership.website || null,
    logoDataUrl: payload.branding.logoPreview || null,
    coverDataUrl: payload.branding.coverPreview || null,
    primaryColor: payload.branding.primaryColor,
    secondaryColor: payload.branding.secondaryColor,
    onboardingStatus: "completed",
    subscriptionPackage: payload.subscriptionPackage,
    completedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function createLocalOwnerMembership(
  payload: OnboardingFormData,
  dealershipId: string,
  branchId: string,
  ownerUserId: string,
  ownerMembershipId: string,
  nowIso: string,
) {
  return {
    id: ownerMembershipId,
    dealershipId,
    branchId,
    userId: ownerUserId,
    fullName: payload.ownerAccount.fullName,
    email: payload.ownerAccount.email,
    roleId: "owner",
    permissions: [...OWNER_PERMISSIONS],
    status: "active",
    invitedAt: nowIso,
    acceptedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function createLocalInviteMembership(invite: StaffInvite, dealershipId: string, branchId: string, nowIso: string) {
  return {
    id: createId("staff"),
    dealershipId,
    branchId,
    userId: null,
    fullName: invite.fullName,
    email: invite.email,
    roleId: invite.role,
    permissions: invite.permissions,
    status: "invited",
    invitedAt: nowIso,
    acceptedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

async function completeOnboardingLocally(payload: OnboardingFormData): Promise<OnboardingCompletionResult> {
  const ownerKey = normalizeEmail(payload.ownerAccount.email);
  const nowIso = new Date().toISOString();
  let completion: OnboardingCompletionResult | null = null;

  await updatePlatformStore((current) => {
    const existingDealership = current.dealerships.find(
      (dealership) => normalizeEmail(dealership.ownerUserId) === ownerKey,
    );

    if (!existingDealership) {
      const dealershipId = createDeterministicId("dealership-owner", ownerKey);
      const primaryBranchId = createDeterministicId("branch-primary", dealershipId);
      const ownerMembershipId = createDeterministicId("membership-owner", dealershipId);

      completion = { dealershipId, primaryBranchId, ownerMembershipId };

      return {
        ...current,
        dealerships: [...current.dealerships, createLocalDealershipRecord(payload, dealershipId, ownerKey, nowIso)],
        branches: [
          ...current.branches,
          ...payload.branches.map((branch, index) =>
            createLocalBranchRecord(
              branch,
              dealershipId,
              index === 0 ? primaryBranchId : createDeterministicId("branch", `${dealershipId}-${index + 1}`),
              nowIso,
            ),
          ),
        ],
        staffMemberships: [
          ...current.staffMemberships,
          createLocalOwnerMembership(payload, dealershipId, primaryBranchId, ownerKey, ownerMembershipId, nowIso),
          ...payload.staffInvites.map((invite) => createLocalInviteMembership(invite, dealershipId, primaryBranchId, nowIso)),
        ],
        onboardingDrafts: current.onboardingDrafts.filter((draft) => draft.ownerEmail !== ownerKey),
      };
    }

    const dealershipId = existingDealership.id;
    const existingBranches = current.branches.filter((branch) => branch.dealershipId === dealershipId);
    const primaryBranchId = existingBranches[0]?.id ?? createDeterministicId("branch-primary", dealershipId);
    const existingOwnerMembership = current.staffMemberships.find(
      (membership) =>
        membership.dealershipId === dealershipId &&
        normalizeEmail(membership.email) === ownerKey &&
        membership.roleId === "owner",
    );
    const ownerMembershipId = existingOwnerMembership?.id ?? createDeterministicId("membership-owner", dealershipId);

    const nextDealerships = current.dealerships.map((dealership) =>
      dealership.id === dealershipId
        ? {
            ...createLocalDealershipRecord(payload, dealershipId, ownerKey, nowIso),
            id: dealership.id,
            createdAt: dealership.createdAt,
          }
        : dealership,
    );

    const nextBranches =
      existingBranches.length > 0
        ? current.branches
        : [
            ...current.branches,
            ...payload.branches.map((branch, index) =>
              createLocalBranchRecord(
                branch,
                dealershipId,
                index === 0 ? primaryBranchId : createDeterministicId("branch", `${dealershipId}-${index + 1}`),
                nowIso,
              ),
            ),
          ];

    let nextMemberships = current.staffMemberships;
    if (!existingOwnerMembership) {
      nextMemberships = [
        ...nextMemberships,
        createLocalOwnerMembership(payload, dealershipId, primaryBranchId, ownerKey, ownerMembershipId, nowIso),
      ];
    }

    const existingInviteEmails = new Set(
      nextMemberships
        .filter((membership) => membership.dealershipId === dealershipId)
        .map((membership) => normalizeEmail(membership.email)),
    );
    const missingInvites = payload.staffInvites.filter(
      (invite) => !existingInviteEmails.has(normalizeEmail(invite.email)),
    );

    if (missingInvites.length > 0) {
      nextMemberships = [
        ...nextMemberships,
        ...missingInvites.map((invite) => createLocalInviteMembership(invite, dealershipId, primaryBranchId, nowIso)),
      ];
    }

    completion = { dealershipId, primaryBranchId, ownerMembershipId };

    return {
      ...current,
      dealerships: nextDealerships,
      branches: nextBranches,
      staffMemberships: nextMemberships,
      onboardingDrafts: current.onboardingDrafts.filter((draft) => draft.ownerEmail !== ownerKey),
    };
  });

  return completion!;
}

/**
 * Resolves (creating if necessary) the auth account for a dealership owner. dealerships
 * .owner_user_id is a foreign key into auth.users, so a dealership cannot exist without one.
 */
async function resolveOwnerAccountId(email: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error("Server credentials are required to resolve the owner account.");
  }
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };

  const lookup = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1&filter=${encodeURIComponent(email)}`, { headers });
  if (lookup.ok) {
    const body = (await lookup.json()) as { users?: Array<{ id: string; email: string }> };
    const match = (body.users ?? []).find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
  }

  const created = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, email_confirm: true, app_metadata: { user_type: "dealer-owner" } }),
  });
  const createdBody = (await created.json()) as { id?: string; msg?: string };
  if (!created.ok || !createdBody.id) {
    throw new Error(`Could not provision owner account: ${created.status} ${createdBody.msg ?? ""}`);
  }
  return createdBody.id;
}

async function completeOnboardingWithSupabase(
  payload: OnboardingFormData,
  accessToken?: string,
  explicitOwnerUserId?: string,
): Promise<OnboardingCompletionResult> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  let ownerUserId = explicitOwnerUserId;
  if (!ownerUserId) {
    const auth = await withSupabaseTimeout(supabase.auth.getUser(), "onboarding auth lookup");
    ownerUserId = auth.data.user?.id;
  }
  if (!ownerUserId) {
    throw new Error("Authenticated and verified owner account is required.");
  }

  const ownerEmail = normalizeEmail(payload.ownerAccount.email);
  const completionPayload = {
    ...payload,
    ownerAccount: {
      ...payload.ownerAccount,
      email: ownerEmail,
    },
  };

  const { data: rpcResult, error: rpcError } = await withSupabaseTimeout(
    supabase.rpc(
      "complete_dealer_onboarding_atomic",
      { p_payload: completionPayload, p_owner_user_id: ownerUserId },
    ),
    "onboarding completion rpc",
    12000,
  );

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  if (
    typeof rpcResult !== "object"
    || rpcResult === null
    || typeof (rpcResult as { dealershipId?: unknown }).dealershipId !== "string"
    || typeof (rpcResult as { primaryBranchId?: unknown }).primaryBranchId !== "string"
    || typeof (rpcResult as { ownerMembershipId?: unknown }).ownerMembershipId !== "string"
  ) {
    throw new Error("Onboarding completion transaction returned an invalid result.");
  }

  return {
    dealershipId: (rpcResult as { dealershipId: string }).dealershipId,
    primaryBranchId: (rpcResult as { primaryBranchId: string }).primaryBranchId,
    ownerMembershipId: (rpcResult as { ownerMembershipId: string }).ownerMembershipId,
  };
}

export async function saveOnboardingDraft(
  payload: OnboardingFormData,
  currentStepIndex: number,
): Promise<void> {
  const supabase = createDomainServerClient();

  if (!supabase) {
    const ownerEmail = payload.ownerAccount.email.trim().toLowerCase() || createId("draft");
    const nowIso = new Date().toISOString();
    await updatePlatformStore((current) => ({
      ...current,
      onboardingDrafts: [
        ...current.onboardingDrafts.filter((draft) => draft.ownerEmail !== ownerEmail),
        {
          ownerEmail,
          currentStepIndex,
          payload,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
    }));
    return;
  }

  const ownerEmail = payload.ownerAccount.email.trim().toLowerCase();

  const { error } = await supabase.from("dealer_onboarding_drafts").upsert(
    {
      owner_email: ownerEmail,
      current_step_index: currentStepIndex,
      payload,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "owner_email",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function completeDealerOnboarding(
  payload: OnboardingFormData,
  accessToken?: string,
): Promise<OnboardingCompletionResult> {
  const supabase = createDomainServerClient(accessToken);

  if (!supabase) {
    return completeOnboardingLocally(payload);
  }

  // Without a Supabase session the server resolves the owner account itself and completes through
  // the same atomic RPC. Falling back to local persistence here was the last vehicle-domain
  // split-brain: onboarding wrote a dealership the Vehicle Engine could never see, so the first
  // publish failed on inventory_vehicles_dealership_id_fkey.
  if (!accessToken) {
    const ownerUserId = await resolveOwnerAccountId(normalizeEmail(payload.ownerAccount.email));
    return completeOnboardingWithSupabase(payload, undefined, ownerUserId);
  }

  return completeOnboardingWithSupabase(payload, accessToken);
}
