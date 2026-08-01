"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form";
import { PageContainer, PageHeader } from "@/components/shell/page/page-container";
import { Text } from "@/components/ui/typography";
import { STAFF_ROLES } from "@/features/dealer-onboarding/config/staff-roles";
import { getActiveDealershipId } from "@/features/inventory/utils/active-dealership";
import {
  getDealershipBranchesData,
  getDealershipTeamData,
  inviteDealershipTeamMemberData,
  updateDealershipTeamMemberData,
} from "@/features/dealership/services/dealership-management.api";
import type {
  DealershipBranchRecord,
  TeamMembershipRecord,
  TeamMembershipStatus,
  UpdateTeamMemberRequest,
} from "@/features/dealership/types/dealership-management.types";

interface TeamInviteDraft {
  readonly fullName: string;
  readonly email: string;
  readonly roleId: string;
  readonly branchId: string;
}

function defaultInvite(branchId: string | null): TeamInviteDraft {
  return {
    fullName: "",
    email: "",
    roleId: "sales-executive",
    branchId: branchId ?? "",
  };
}

function toUpdateDraft(member: TeamMembershipRecord): UpdateTeamMemberRequest {
  return {
    roleId: member.roleId,
    branchId: member.branchId,
    status: member.status,
    removeAccess: false,
  };
}

const STATUS_OPTIONS: readonly TeamMembershipStatus[] = ["invited", "active", "deactivated", "removed"];

export function DealershipTeamPage({
  initialDealershipId = null,
}: {
  readonly initialDealershipId?: string | null;
}) {
  const [dealershipId, setDealershipId] = useState<string | null>(initialDealershipId);
  const [branches, setBranches] = useState<readonly DealershipBranchRecord[]>([]);
  const [members, setMembers] = useState<readonly TeamMembershipRecord[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [inviteDraft, setInviteDraft] = useState<TeamInviteDraft>(() => defaultInvite(null));
  const [memberDraft, setMemberDraft] = useState<UpdateTeamMemberRequest | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(initialDealershipId));
  const [isInviting, setIsInviting] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialDealershipId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextDealershipId = getActiveDealershipId();
      setDealershipId(nextDealershipId);
      setIsLoading(Boolean(nextDealershipId));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialDealershipId]);

  useEffect(() => {
    if (!dealershipId) {
      return;
    }

    let cancelled = false;

    void Promise.all([
      getDealershipBranchesData(dealershipId),
      getDealershipTeamData(dealershipId),
    ])
      .then(([nextBranches, nextMembers]) => {
        if (cancelled) return;

        const firstBranchId = nextBranches[0]?.id ?? null;
        const firstMember = nextMembers[0] ?? null;

        setBranches(nextBranches);
        setMembers(nextMembers);
        setInviteDraft(defaultInvite(firstBranchId));
        setActiveMemberId(firstMember?.id ?? null);
        setMemberDraft(firstMember ? toUpdateDraft(firstMember) : null);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to load team workspace.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dealershipId]);

  const activeMember = useMemo(
    () => members.find((item) => item.id === activeMemberId) ?? null,
    [activeMemberId, members],
  );

  const hasMemberChanges = useMemo(() => {
    if (!activeMember || !memberDraft) return false;
    return JSON.stringify(toUpdateDraft(activeMember)) !== JSON.stringify(memberDraft);
  }, [activeMember, memberDraft]);

  function selectMember(memberId: string) {
    const selected = members.find((item) => item.id === memberId);
    setActiveMemberId(memberId);
    setMemberDraft(selected ? toUpdateDraft(selected) : null);
    setError(null);
    setSuccess(null);
  }

  async function inviteMember() {
    if (!dealershipId) return;

    setIsInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await inviteDealershipTeamMemberData(dealershipId, inviteDraft);
      const nextMembers = members.some((item) => item.id === created.id)
        ? members.map((item) => (item.id === created.id ? created : item))
        : [...members, created];

      setMembers(nextMembers);
      setActiveMemberId(created.id);
      setMemberDraft(toUpdateDraft(created));
      setInviteDraft(defaultInvite(branches[0]?.id ?? created.branchId));
      setSuccess("Team invite processed.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to invite team member.");
    } finally {
      setIsInviting(false);
    }
  }

  async function updateMember(overrides?: Partial<UpdateTeamMemberRequest>) {
    if (!dealershipId || !activeMemberId || !memberDraft) return;

    setIsSavingMember(true);
    setError(null);
    setSuccess(null);

    const payload: UpdateTeamMemberRequest = {
      ...memberDraft,
      ...overrides,
    };

    try {
      const updated = await updateDealershipTeamMemberData(dealershipId, activeMemberId, payload);
      setMembers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setMemberDraft(toUpdateDraft(updated));
      setSuccess(payload.removeAccess ? "Team member access removed." : "Team member updated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update team member.");
    } finally {
      setIsSavingMember(false);
    }
  }

  if (!dealershipId) {
    return (
      <PageContainer variant="analytics">
        <PageHeader
          title="Team Management"
          description="Select an active dealership context to manage team memberships."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="analytics">
      <PageHeader
        title="Team Management"
        description="Invite, update, and secure team access without rerunning onboarding."
      />

      <div className="space-y-6">
        {error && <Text tone="danger">{error}</Text>}
        {success && <Text tone="success">{success}</Text>}

        <Card>
          <CardHeader>
            <CardTitle>Invite Staff</CardTitle>
            <CardDescription>Create or retry an invitation without duplicate memberships.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <Text tone="muted">Loading invite form...</Text>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Full Name" htmlFor="invite-full-name" required>
                    <Input
                      id="invite-full-name"
                      value={inviteDraft.fullName}
                      onChange={(e) => setInviteDraft((prev) => ({ ...prev, fullName: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Email" htmlFor="invite-email" required>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteDraft.email}
                      onChange={(e) => setInviteDraft((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Role" htmlFor="invite-role" required>
                    <select
                      id="invite-role"
                      className="h-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                      value={inviteDraft.roleId}
                      onChange={(e) => setInviteDraft((prev) => ({ ...prev, roleId: e.target.value }))}
                    >
                      {STAFF_ROLES.map((role) => (
                        <option key={role.id} value={role.id}>{role.label}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Branch" htmlFor="invite-branch" required>
                    <select
                      id="invite-branch"
                      className="h-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                      value={inviteDraft.branchId}
                      onChange={(e) => setInviteDraft((prev) => ({ ...prev, branchId: e.target.value }))}
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <Button
                  onClick={inviteMember}
                  loading={isInviting}
                  disabled={!inviteDraft.fullName || !inviteDraft.email || !inviteDraft.branchId}
                >
                  Invite Staff
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Current dealership memberships and statuses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Text tone="muted">Loading team members...</Text>
              ) : members.length === 0 ? (
                <Text tone="muted">No memberships found.</Text>
              ) : (
                members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className={`w-full rounded-[var(--radius-lg)] border px-3 py-3 text-left ${member.id === activeMemberId ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)]"}`}
                    onClick={() => selectMember(member.id)}
                  >
                    <Text variant="label" className="block">{member.fullName}</Text>
                    <Text variant="body-sm" tone="muted">{member.email}</Text>
                    <Text variant="body-sm" tone="muted">Status: {member.status}</Text>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membership Details</CardTitle>
              <CardDescription>Edit role, branch assignment, status, or remove access safely.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!memberDraft || !activeMember ? (
                <Text tone="muted">Select a team member to edit.</Text>
              ) : (
                <>
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField label="Role" htmlFor="member-role" required>
                      <select
                        id="member-role"
                        className="h-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                        value={memberDraft.roleId}
                        onChange={(e) => setMemberDraft((prev) => (prev ? { ...prev, roleId: e.target.value } : prev))}
                      >
                        {STAFF_ROLES.map((role) => (
                          <option key={role.id} value={role.id}>{role.label}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Branch" htmlFor="member-branch" required>
                      <select
                        id="member-branch"
                        className="h-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                        value={memberDraft.branchId}
                        onChange={(e) => setMemberDraft((prev) => (prev ? { ...prev, branchId: e.target.value } : prev))}
                      >
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Membership Status" htmlFor="member-status" required>
                    <select
                      id="member-status"
                      className="h-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                      value={memberDraft.status}
                      onChange={(e) => setMemberDraft((prev) => (prev ? {
                        ...prev,
                        status: e.target.value as TeamMembershipStatus,
                        removeAccess: false,
                      } : prev))}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </FormField>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => updateMember()} loading={isSavingMember} disabled={!hasMemberChanges}>
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => updateMember({ status: "active", removeAccess: false })}
                      loading={isSavingMember}
                      disabled={memberDraft.status === "active"}
                    >
                      Activate
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => updateMember({ status: "deactivated", removeAccess: false })}
                      loading={isSavingMember}
                      disabled={memberDraft.status === "deactivated"}
                    >
                      Deactivate
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => updateMember({ removeAccess: true, status: "removed" })}
                      loading={isSavingMember}
                      disabled={memberDraft.status === "removed"}
                    >
                      Remove Access
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
