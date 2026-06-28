/**
 * SURF FOR CARS — Organization Model
 *
 * Hierarchical tenancy model supporting single and multi-branch dealers.
 */

export const ORGANIZATION_HIERARCHY = {
  platform: {
    level: 0,
    entity: "Platform",
    description: "SURF FOR CARS platform root — global policies and configuration",
    ownership: "platform",
    supportsMultiple: false,
  },
  dealerGroup: {
    level: 1,
    entity: "DealerGroup",
    description: "Optional parent group for multi-dealership organisations",
    ownership: "platform",
    supportsMultiple: true,
    optional: true,
  },
  dealership: {
    level: 2,
    entity: "Dealership",
    description: "Primary billing and subscription tenant — all dealer data scopes here",
    ownership: "dealer-group",
    supportsMultiple: true,
  },
  branch: {
    level: 3,
    entity: "Branch",
    description: "Physical or logical location — inventory and team can be branch-scoped",
    ownership: "dealership",
    supportsMultiple: true,
    minCount: 1,
  },
  department: {
    level: 4,
    entity: "Department",
    description: "Sales, service, marketing, inventory — optional organisational unit",
    ownership: "branch",
    supportsMultiple: true,
    optional: true,
  },
  team: {
    level: 5,
    entity: "Team",
    description: "Named team within a department or branch",
    ownership: "department",
    supportsMultiple: true,
    optional: true,
  },
  user: {
    level: 6,
    entity: "User",
    description: "Individual user with role assignments at org/branch/department level",
    ownership: "dealership",
    supportsMultiple: true,
  },
} as const;

export type OrganizationLevel = keyof typeof ORGANIZATION_HIERARCHY;

export const ORGANIZATION_SCENARIOS = {
  singleBranchDealer: {
    id: "single-branch",
    label: "Single Branch Dealer",
    description: "Independent dealer with one location",
    structure: ["dealership", "branch", "user"],
    notes: [
      "Default branch auto-created on onboarding",
      "All inventory assigned to single branch",
      "Simplified navigation — branch selector hidden",
    ],
  },
  multiBranchDealer: {
    id: "multi-branch",
    label: "Multi-Branch Dealer",
    description: "Dealer group with multiple locations",
    structure: ["dealership", "branch", "branch", "department", "team", "user"],
    notes: [
      "Branch-scoped inventory and analytics",
      "Branch managers see only their branch data",
      "Dealer owners see cross-branch comparison",
    ],
  },
  dealerGroup: {
    id: "dealer-group",
    label: "Dealer Group",
    description: "Parent organisation owning multiple dealerships",
    structure: ["dealerGroup", "dealership", "dealership", "branch", "user"],
    notes: [
      "Group-level reporting and brand standards",
      "Per-dealership billing and subscriptions",
      "Shared brand assets optional at group level",
    ],
  },
} as const;

export const TENANCY_RULES = {
  dataIsolation: [
    "All dealer data scoped by dealership_id",
    "Branch-scoped data additionally filtered by branch_id",
    "Row-level security enforced at database layer",
    "Cross-tenant queries prohibited at service layer",
  ],
  ownershipChain: [
    "Vehicle → Branch → Dealership → (DealerGroup) → Platform",
    "User membership → Dealership (+ optional Branch/Department)",
    "Buyer data → Buyer profile (platform-scoped, not dealer-scoped)",
  ],
  cascadingDeletes: [
    "Dealership archive cascades to branches, not hard delete",
    "Vehicle delist preserves history and analytics",
    "User deactivation preserves audit trail",
  ],
} as const;
