import { createAuthenticatedHeaders } from "@/features/authentication";
import type {
  InviteTeamMemberRequest,
  DealershipBranchRecord,
  DealershipProfileRecord,
  TeamMembershipRecord,
  UpdateBranchRequest,
  UpdateDealershipProfileRequest,
  UpdateTeamMemberRequest,
} from "@/features/dealership/types/dealership-management.types";

function withDealership(path: string, dealershipId: string): string {
  const params = new URLSearchParams({ dealershipId });
  return `${path}?${params.toString()}`;
}

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const body = (await response.json().catch(() => null)) as { readonly error?: string } | null;
  if (!response.ok) {
    throw new Error(body?.error ?? fallback);
  }
  return body as T;
}

export async function getDealershipProfileData(dealershipId: string): Promise<DealershipProfileRecord> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(withDealership("/api/v1/dealer/profile", dealershipId), {
    cache: "no-store",
    headers,
  });

  return parseResponse<DealershipProfileRecord>(response, "Failed to load dealership profile.");
}

export async function saveDealershipProfileData(
  dealershipId: string,
  payload: UpdateDealershipProfileRequest,
): Promise<DealershipProfileRecord> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(withDealership("/api/v1/dealer/profile", dealershipId), {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse<DealershipProfileRecord>(response, "Failed to save dealership profile.");
}

export async function getDealershipBranchesData(
  dealershipId: string,
): Promise<readonly DealershipBranchRecord[]> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(withDealership("/api/v1/dealer/branches", dealershipId), {
    cache: "no-store",
    headers,
  });

  return parseResponse<readonly DealershipBranchRecord[]>(response, "Failed to load branches.");
}

export async function saveDealershipBranchData(
  dealershipId: string,
  branchId: string,
  payload: UpdateBranchRequest,
): Promise<DealershipBranchRecord> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(
    withDealership(`/api/v1/dealer/branches/${encodeURIComponent(branchId)}`, dealershipId),
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    },
  );

  return parseResponse<DealershipBranchRecord>(response, "Failed to save branch.");
}

export async function getDealershipTeamData(
  dealershipId: string,
): Promise<readonly TeamMembershipRecord[]> {
  const headers = await createAuthenticatedHeaders();
  const response = await fetch(withDealership("/api/v1/dealer/team", dealershipId), {
    cache: "no-store",
    headers,
  });

  return parseResponse<readonly TeamMembershipRecord[]>(response, "Failed to load team members.");
}

export async function inviteDealershipTeamMemberData(
  dealershipId: string,
  payload: InviteTeamMemberRequest,
): Promise<TeamMembershipRecord> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(withDealership("/api/v1/dealer/team", dealershipId), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse<TeamMembershipRecord>(response, "Failed to invite team member.");
}

export async function updateDealershipTeamMemberData(
  dealershipId: string,
  membershipId: string,
  payload: UpdateTeamMemberRequest,
): Promise<TeamMembershipRecord> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(
    withDealership(`/api/v1/dealer/team/${encodeURIComponent(membershipId)}`, dealershipId),
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    },
  );

  return parseResponse<TeamMembershipRecord>(response, "Failed to update team member.");
}
