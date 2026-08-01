import { getEffectivePermissions, type UserTypeId } from "@/config/architecture";
import type { StaffRoleId } from "@/features/dealer-onboarding/types/onboarding.types";

export interface StaffRoleDefinition {
  readonly id: StaffRoleId;
  readonly label: string;
  readonly userType: UserTypeId | null;
  readonly fallbackPermissions: readonly string[];
}

export const STAFF_ROLES: readonly StaffRoleDefinition[] = [
  {
    id: "owner",
    label: "Owner",
    userType: "dealer-owner",
    fallbackPermissions: [],
  },
  {
    id: "dealer-principal",
    label: "Dealer Principal",
    userType: "branch-manager",
    fallbackPermissions: ["dealer:team:view", "dealer:reports:view"],
  },
  {
    id: "sales-manager",
    label: "Sales Manager",
    userType: "branch-manager",
    fallbackPermissions: ["dealer:inventory:publish", "dealer:leads:manage"],
  },
  {
    id: "sales-executive",
    label: "Sales Executive",
    userType: "salesperson",
    fallbackPermissions: ["dealer:inventory:write", "dealer:leads:manage"],
  },
  {
    id: "administrator",
    label: "Administrator",
    userType: "dealer",
    fallbackPermissions: ["dealer:settings:view", "dealer:team:view", "dealer:documents:manage"],
  },
  {
    id: "photographer",
    label: "Photographer",
    userType: "dealer",
    fallbackPermissions: ["dealer:media:manage", "dealer:inventory:read"],
  },
  {
    id: "marketing",
    label: "Marketing",
    userType: null,
    fallbackPermissions: ["dealer:marketing:write", "dealer:media:manage", "dealer:analytics:view"],
  },
  {
    id: "finance-insurance",
    label: "Finance & Insurance",
    userType: null,
    fallbackPermissions: ["dealer:leads:read", "dealer:crm:write", "dealer:reports:view"],
  },
] as const;

export function resolveRolePermissions(roleId: StaffRoleId): readonly string[] {
  const role = STAFF_ROLES.find((item) => item.id === roleId);
  if (!role) return [];
  if (role.userType) {
    return getEffectivePermissions(role.userType);
  }
  return role.fallbackPermissions;
}
