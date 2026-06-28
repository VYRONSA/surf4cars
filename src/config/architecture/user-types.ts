/**
 * SURF FOR CARS — User Types & Role Hierarchy
 *
 * Defines all platform personas, their scope, and inheritance.
 * Architecture only — no runtime auth implementation.
 */

export const USER_TYPES = {
  publicVisitor: {
    id: "public-visitor",
    label: "Public Visitor",
    description: "Unauthenticated marketplace and marketing visitor",
    portal: "public",
    authenticationRequired: false,
    inheritsFrom: null,
  },
  buyer: {
    id: "buyer",
    label: "Buyer",
    description: "Registered vehicle shopper with saved activity",
    portal: "buyer",
    authenticationRequired: true,
    inheritsFrom: null,
  },
  dealer: {
    id: "dealer",
    label: "Dealer",
    description: "Generic dealer staff member — base dealer portal access",
    portal: "dealer",
    authenticationRequired: true,
    inheritsFrom: null,
  },
  salesperson: {
    id: "salesperson",
    label: "Salesperson",
    description: "Front-line sales staff — leads, inventory view, CRM",
    portal: "dealer",
    authenticationRequired: true,
    inheritsFrom: "dealer",
  },
  branchManager: {
    id: "branch-manager",
    label: "Branch Manager",
    description: "Branch-level operations — inventory, team, branch analytics",
    portal: "dealer",
    authenticationRequired: true,
    inheritsFrom: "salesperson",
  },
  dealerOwner: {
    id: "dealer-owner",
    label: "Dealer Owner",
    description: "Full dealer organisation control — billing, branches, brand",
    portal: "dealer",
    authenticationRequired: true,
    inheritsFrom: "branch-manager",
  },
  platformAdministrator: {
    id: "platform-administrator",
    label: "Platform Administrator",
    description: "SURF FOR CARS platform operations and moderation",
    portal: "admin",
    authenticationRequired: true,
    inheritsFrom: null,
  },
  developer: {
    id: "developer",
    label: "Developer",
    description: "API integrations, webhooks, and platform extensibility",
    portal: "developer",
    authenticationRequired: true,
    inheritsFrom: null,
  },
} as const;

export type UserTypeId = (typeof USER_TYPES)[keyof typeof USER_TYPES]["id"];

export type PortalId = "public" | "buyer" | "dealer" | "admin" | "developer" | "auth";

export interface UserTypeDefinition {
  readonly id: UserTypeId;
  readonly label: string;
  readonly description: string;
  readonly portal: PortalId;
  readonly authenticationRequired: boolean;
  readonly inheritsFrom: string | null;
}

export const USER_TYPE_IDS = Object.values(USER_TYPES).map((u) => u.id) as UserTypeId[];

export function getUserTypeById(id: UserTypeId) {
  return Object.values(USER_TYPES).find((u) => u.id === id);
}

export function getRoleInheritanceChain(id: UserTypeId): readonly UserTypeId[] {
  const chain: UserTypeId[] = [id];
  let current = getUserTypeById(id);

  while (current?.inheritsFrom) {
    const parent = Object.values(USER_TYPES).find((u) => u.id === current?.inheritsFrom);
    if (!parent) break;
    chain.unshift(parent.id as UserTypeId);
    current = parent;
  }

  return chain;
}
