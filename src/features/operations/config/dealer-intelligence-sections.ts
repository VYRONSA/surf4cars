export type DealerIntelligenceSectionId =
  | "overview"
  | "discovery-queue"
  | "dealership-directory"
  | "dealer-profiles"
  | "branch-discovery"
  | "brand-detection"
  | "contact-discovery"
  | "website-analysis"
  | "ai-classification"
  | "verification"
  | "duplicate-detection"
  | "change-monitoring"
  | "data-quality"
  | "activity";

export interface DealerIntelligenceSection {
  readonly id: DealerIntelligenceSectionId;
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

export const DEALER_INTELLIGENCE_SECTIONS: readonly DealerIntelligenceSection[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/operations/dealer-intelligence",
    description: "Executive summary of dealer intelligence coverage and readiness.",
  },
  {
    id: "discovery-queue",
    label: "Discovery Queue",
    href: "/operations/dealer-intelligence/discovery-queue",
    description: "Dealerships awaiting verification and enrichment decisions.",
  },
  {
    id: "dealership-directory",
    label: "Dealership Directory",
    href: "/operations/dealer-intelligence/dealership-directory",
    description: "Operational directory with search-ready dealership metadata.",
  },
  {
    id: "dealer-profiles",
    label: "Dealer Profiles",
    href: "/operations/dealer-intelligence/dealer-profiles",
    description: "Internal profile intelligence for each dealership.",
  },
  {
    id: "branch-discovery",
    label: "Branch Discovery",
    href: "/operations/dealer-intelligence/branch-discovery",
    description: "Known branch footprint and discovery confidence.",
  },
  {
    id: "brand-detection",
    label: "Brand Detection",
    href: "/operations/dealer-intelligence/brand-detection",
    description: "Known brands inferred from existing platform data.",
  },
  {
    id: "contact-discovery",
    label: "Contact Discovery",
    href: "/operations/dealer-intelligence/contact-discovery",
    description: "Known contacts and contact completeness status.",
  },
  {
    id: "website-analysis",
    label: "Website Analysis",
    href: "/operations/dealer-intelligence/website-analysis",
    description: "Website presence and readiness for deeper analysis.",
  },
  {
    id: "ai-classification",
    label: "AI Classification",
    href: "/operations/dealer-intelligence/ai-classification",
    description: "Internal AI/rules classification output with clear provider status.",
  },
  {
    id: "verification",
    label: "Verification",
    href: "/operations/dealer-intelligence/verification",
    description: "Verification status lifecycle and operations ownership.",
  },
  {
    id: "duplicate-detection",
    label: "Duplicate Detection",
    href: "/operations/dealer-intelligence/duplicate-detection",
    description: "Potential duplicate dealerships based on known identifiers.",
  },
  {
    id: "change-monitoring",
    label: "Change Monitoring",
    href: "/operations/dealer-intelligence/change-monitoring",
    description: "Observed dealership changes from existing event streams.",
  },
  {
    id: "data-quality",
    label: "Data Quality",
    href: "/operations/dealer-intelligence/data-quality",
    description: "Profile quality scores based only on known facts.",
  },
  {
    id: "activity",
    label: "Activity",
    href: "/operations/dealer-intelligence/activity",
    description: "Operational activity and audit traceability.",
  },
] as const;

export function getDealerIntelligenceSectionBySlug(
  slug: string,
): DealerIntelligenceSection | null {
  return DEALER_INTELLIGENCE_SECTIONS.find((section) => section.id === slug) ?? null;
}
