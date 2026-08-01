"use client";

import { useState } from "react";

import { FormField, Input } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Plus, Trash2 } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { OnboardingNavigation } from "@/features/dealer-onboarding/components/onboarding-navigation";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { STAFF_ROLES, resolveRolePermissions } from "@/features/dealer-onboarding/config/staff-roles";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import type { StaffRoleId } from "@/features/dealer-onboarding/types/onboarding.types";
import { validateTeam } from "@/features/dealer-onboarding/utils/onboarding-validators";
import { cn } from "@/utils";

export function StepTeam() {
  const {
    data,
    updateOwnerAccount,
    addStaffInvite,
    updateStaffInvite,
    removeStaffInvite,
    clearError,
  } = useOnboarding();
  const [validationError, setValidationError] = useState<string | null>(null);
  const { ownerAccount } = data;

  function validate() {
    const result = validateTeam(data);
    setValidationError(result.valid ? null : (result.message ?? "Please complete this step."));
    return result.valid;
  }

  function updateOwner(values: Partial<typeof ownerAccount>) {
    clearError();
    setValidationError(null);
    updateOwnerAccount(values);
  }

  function updateInviteRole(inviteId: string, role: StaffRoleId) {
    clearError();
    const permissions = resolveRolePermissions(role);
    updateStaffInvite(inviteId, {
      role,
      permissions,
    });
  }

  function addInvite() {
    clearError();
    setValidationError(null);
    addStaffInvite();
  }

  return (
    <div className={cn(onboardingStyles.panel, "animate-slide-up-sfc")}>
      <header>
        <Text variant="h3" as="h2">
          Create owner account and invite staff
        </Text>
        <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
          The owner account unlocks the platform. Add your first team members and role assignments now.
        </Text>
      </header>

      <div className="mt-8 space-y-5">
        <FormField label="Owner Full Name" htmlFor="owner-full-name" required>
          <Input
            id="owner-full-name"
            value={ownerAccount.fullName}
            onChange={(e) => updateOwner({ fullName: e.target.value })}
            placeholder="Your full name"
            autoComplete="name"
          />
        </FormField>

        <FormField label="Owner Email" htmlFor="owner-email" required>
          <Input
            id="owner-email"
            type="email"
            value={ownerAccount.email}
            onChange={(e) => updateOwner({ email: e.target.value })}
            placeholder="you@dealership.co.za"
            autoComplete="email"
          />
        </FormField>

        <FormField label="Owner Password" htmlFor="owner-password" required helperText="Minimum 8 characters">
          <Input
            id="owner-password"
            type="password"
            value={ownerAccount.password}
            onChange={(e) => updateOwner({ password: e.target.value })}
            placeholder="Create a secure password"
            autoComplete="new-password"
          />
        </FormField>

        <div className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <Text variant="h6" as="h3">
              Staff Invitations
            </Text>
            <button
              type="button"
              onClick={addInvite}
              className={cn(onboardingStyles.secondaryButton, "h-10 px-4")}
            >
              <Icon icon={Plus} size="sm" aria-hidden />
              Invite Staff
            </button>
          </div>

          {data.staffInvites.length === 0 && (
            <Text variant="body-sm" tone="muted">
              No staff invited yet. You can continue with owner only, or invite now.
            </Text>
          )}

          {data.staffInvites.map((invite, index) => (
            <div
              key={invite.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <Text variant="label" tone="muted">
                  Staff Member {index + 1}
                </Text>
                <button
                  type="button"
                  onClick={() => removeStaffInvite(invite.id)}
                  className={cn(onboardingStyles.ghostButton, "h-8 px-2 text-[var(--color-danger)] hover:text-[var(--color-danger)]")}
                >
                  <Icon icon={Trash2} size="sm" aria-hidden />
                  Remove
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full Name" htmlFor={`invite-name-${invite.id}`} required>
                  <Input
                    id={`invite-name-${invite.id}`}
                    value={invite.fullName}
                    onChange={(e) => updateStaffInvite(invite.id, { fullName: e.target.value })}
                    placeholder="Team member name"
                  />
                </FormField>

                <FormField label="Email" htmlFor={`invite-email-${invite.id}`} required>
                  <Input
                    id={`invite-email-${invite.id}`}
                    type="email"
                    value={invite.email}
                    onChange={(e) => updateStaffInvite(invite.id, { email: e.target.value })}
                    placeholder="team@dealership.co.za"
                  />
                </FormField>
              </div>

              <FormField label="Role" htmlFor={`invite-role-${invite.id}`} required className="mt-4">
                <select
                  id={`invite-role-${invite.id}`}
                  value={invite.role}
                  onChange={(e) => updateInviteRole(invite.id, e.target.value as StaffRoleId)}
                  className="h-10 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-[length:var(--text-body-sm)]"
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </FormField>

              {invite.permissions.length > 0 && (
                <Text variant="caption" tone="muted" className="mt-3 block">
                  {invite.permissions.length} permissions auto-assigned from the existing permission model.
                </Text>
              )}
            </div>
          ))}
        </div>

        {validationError && (
          <Text variant="body-sm" tone="danger" role="alert">
            {validationError}
          </Text>
        )}
      </div>

      <div className="mt-10">
        <OnboardingNavigation onContinue={validate} />
      </div>
    </div>
  );
}
