export type PartnerCentreSectionId =
  | "overview"
  | "partner-directory"
  | "partner-profile"
  | "lead-distribution"
  | "performance"
  | "integrations"
  | "timeline"
  | "audit";

export interface PartnerCentreSection {
  readonly id: PartnerCentreSectionId;
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

export const PARTNER_CENTRE_SECTIONS: readonly PartnerCentreSection[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/operations/partner-centre",
    description: "Executive relationship posture across all partner categories.",
  },
  {
    id: "partner-directory",
    label: "Partner Directory",
    href: "/operations/partner-centre/partner-directory",
    description: "Unified operational directory with status, owners, and readiness.",
  },
  {
    id: "partner-profile",
    label: "Partner Profile",
    href: "/operations/partner-centre/partner-profile",
    description: "Detailed business profile, services, and relationship intelligence.",
  },
  {
    id: "lead-distribution",
    label: "Lead Distribution",
    href: "/operations/partner-centre/lead-distribution",
    description: "Lead routing and allocation framework extension points.",
  },
  {
    id: "performance",
    label: "Performance",
    href: "/operations/partner-centre/performance",
    description: "Applications, completion, acceptance, response, and service quality posture.",
  },
  {
    id: "integrations",
    label: "Integrations",
    href: "/operations/partner-centre/integrations",
    description: "API and webhook readiness framework for future partner integrations.",
  },
  {
    id: "timeline",
    label: "Timeline",
    href: "/operations/partner-centre/timeline",
    description: "Partner relationship history for operational traceability.",
  },
  {
    id: "audit",
    label: "Audit",
    href: "/operations/partner-centre/audit",
    description: "Partner change audit events via existing operations pipeline.",
  },
] as const;

export function getPartnerCentreSectionBySlug(slug: string): PartnerCentreSection | null {
  return PARTNER_CENTRE_SECTIONS.find((section) => section.id === slug) ?? null;
}
