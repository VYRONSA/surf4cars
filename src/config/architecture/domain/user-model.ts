/**
 * SURF FOR CARS — User & Role Model
 *
 * Extended role architecture with inheritance for the data layer.
 */

export const USER_ROLES = {
  platformAdmin: {
    id: "platform-admin",
    label: "Platform Admin",
    scope: "platform",
    inheritsFrom: null,
    domainAccess: ["administration", "platform", "audit", "system"],
  },
  dealerOwner: {
    id: "dealer-owner",
    label: "Dealer Owner",
    scope: "dealership",
    inheritsFrom: null,
    domainAccess: ["dealer", "inventory", "vehicles", "marketing", "ai", "billing"],
  },
  branchManager: {
    id: "branch-manager",
    label: "Branch Manager",
    scope: "branch",
    inheritsFrom: "dealer-owner",
    domainAccess: ["inventory", "crm", "analytics", "marketing"],
  },
  salesperson: {
    id: "salesperson",
    label: "Salesperson",
    scope: "branch",
    inheritsFrom: "branch-manager",
    domainAccess: ["crm", "inventory", "vehicles"],
  },
  marketingStaff: {
    id: "marketing-staff",
    label: "Marketing Staff",
    scope: "dealership",
    inheritsFrom: "salesperson",
    domainAccess: ["marketing", "media", "ai"],
  },
  inventoryStaff: {
    id: "inventory-staff",
    label: "Inventory Staff",
    scope: "branch",
    inheritsFrom: "salesperson",
    domainAccess: ["inventory", "vehicles", "media"],
  },
  buyer: {
    id: "buyer",
    label: "Buyer",
    scope: "buyer",
    inheritsFrom: null,
    domainAccess: ["buyer", "search", "messaging", "reviews"],
  },
  developer: {
    id: "developer",
    label: "Developer",
    scope: "dealership",
    inheritsFrom: null,
    domainAccess: ["developer"],
  },
  supportAgent: {
    id: "support-agent",
    label: "Support Agent",
    scope: "platform",
    inheritsFrom: "platform-admin",
    domainAccess: ["administration", "crm", "messaging"],
  },
} as const;

export type UserRoleId = (typeof USER_ROLES)[keyof typeof USER_ROLES]["id"];

export const ROLE_INHERITANCE_CHAIN: Record<UserRoleId, readonly UserRoleId[]> = {
  "platform-admin": ["platform-admin"],
  "dealer-owner": ["dealer-owner"],
  "branch-manager": ["dealer-owner", "branch-manager"],
  salesperson: ["dealer-owner", "branch-manager", "salesperson"],
  "marketing-staff": ["dealer-owner", "branch-manager", "salesperson", "marketing-staff"],
  "inventory-staff": ["dealer-owner", "branch-manager", "salesperson", "inventory-staff"],
  buyer: ["buyer"],
  developer: ["developer"],
  "support-agent": ["platform-admin", "support-agent"],
};

export const USER_ENTITY_MODEL = {
  rootEntity: "User",
  childEntities: [
    "UserProfile",
    "UserMembership",
    "UserSettings",
    "UserSession",
    "UserInvitation",
    "UserActivityLog",
  ],
  relationships: {
    userToDealership: "many-to-many via UserMembership",
    userToBranch: "optional scope on UserMembership",
    userToDepartment: "optional scope on UserMembership",
    userToRole: "many-to-many via RoleAssignment",
    userToBuyerProfile: "one-to-one optional (buyer portal)",
  },
  lifecycle: [
    "invited",
    "pending-verification",
    "active",
    "suspended",
    "deactivated",
    "deleted",
  ],
  futureRoles: [
    "finance-manager",
    "service-advisor",
    "fleet-manager",
    "partner-integrator",
    "content-editor",
    "ai-operator",
  ],
} as const;

export const BUYER_ENTITY_MODEL = {
  rootEntity: "BuyerProfile",
  childEntities: [
    "SavedVehicle",
    "SavedCollection",
    "SavedSearch",
    "PriceAlert",
    "RecentlyViewed",
    "BuyerPreference",
    "BuyerActivity",
  ],
  ownership: "buyer",
  notes: [
    "Buyer data is platform-scoped, not dealer-scoped",
    "Activity stored as append-only event stream",
    "GDPR deletion removes PII, anonymises activity",
  ],
} as const;
