export type DealerManagementSectionId =
  | "overview"
  | "applications"
  | "dealerships"
  | "branches"
  | "dealer-users"
  | "subscriptions"
  | "billing"
  | "performance"
  | "health"
  | "notes"
  | "timeline"
  | "documents"
  | "contracts"
  | "audit";

export interface DealerManagementSection {
  readonly id: DealerManagementSectionId;
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

export const DEALER_MANAGEMENT_SECTIONS: readonly DealerManagementSection[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/operations/dealer-management",
    description: "Executive summary of dealer operations.",
  },
  {
    id: "applications",
    label: "Applications",
    href: "/operations/dealer-management/applications",
    description: "Unified dealership application queue.",
  },
  {
    id: "dealerships",
    label: "Dealerships",
    href: "/operations/dealer-management/dealerships",
    description: "Dealership profiles and lifecycle views.",
  },
  {
    id: "branches",
    label: "Branches",
    href: "/operations/dealer-management/branches",
    description: "Branch footprint and branch-level performance.",
  },
  {
    id: "dealer-users",
    label: "Dealer Users",
    href: "/operations/dealer-management/dealer-users",
    description: "Cross-dealer user and team access management.",
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    href: "/operations/dealer-management/subscriptions",
    description: "Package and renewal oversight.",
  },
  {
    id: "billing",
    label: "Billing",
    href: "/operations/dealer-management/billing",
    description: "Billing lifecycle and revenue readiness.",
  },
  {
    id: "performance",
    label: "Performance",
    href: "/operations/dealer-management/performance",
    description: "Dealer performance intelligence.",
  },
  {
    id: "health",
    label: "Health",
    href: "/operations/dealer-management/health",
    description: "Dealer health scoring and risk visibility.",
  },
  {
    id: "notes",
    label: "Notes",
    href: "/operations/dealer-management/notes",
    description: "Internal operations-only notes.",
  },
  {
    id: "timeline",
    label: "Timeline",
    href: "/operations/dealer-management/timeline",
    description: "Operational event timeline.",
  },
  {
    id: "documents",
    label: "Documents",
    href: "/operations/dealer-management/documents",
    description: "Dealer KYC and compliance documentation.",
  },
  {
    id: "contracts",
    label: "Contracts",
    href: "/operations/dealer-management/contracts",
    description: "Dealer agreement lifecycle.",
  },
  {
    id: "audit",
    label: "Audit",
    href: "/operations/dealer-management/audit",
    description: "Audit event stream for dealer operations.",
  },
] as const;

export function getDealerManagementSectionBySlug(
  slug: string,
): DealerManagementSection | null {
  return DEALER_MANAGEMENT_SECTIONS.find((section) => section.id === slug) ?? null;
}
