export type BusinessIntelligenceSectionId =
  | "overview"
  | "growth"
  | "revenue"
  | "marketplace"
  | "dealers"
  | "partners"
  | "applications"
  | "inventory"
  | "ai-intelligence"
  | "forecasts"
  | "executive-reports"
  | "executive-timeline"
  | "audit";

export interface BusinessIntelligenceSection {
  readonly id: BusinessIntelligenceSectionId;
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

export const BUSINESS_INTELLIGENCE_SECTIONS: readonly BusinessIntelligenceSection[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/operations/business-intelligence",
    description: "Executive health and growth posture across the SURF platform.",
  },
  {
    id: "growth",
    label: "Growth",
    href: "/operations/business-intelligence/growth",
    description: "Daily, weekly, monthly, quarterly, and annual growth trends.",
  },
  {
    id: "revenue",
    label: "Revenue",
    href: "/operations/business-intelligence/revenue",
    description: "Revenue intelligence consolidated from the Revenue Centre.",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    href: "/operations/business-intelligence/marketplace",
    description: "Marketplace performance, quality, and health intelligence.",
  },
  {
    id: "dealers",
    label: "Dealers",
    href: "/operations/business-intelligence/dealers",
    description: "Dealer growth, health, and operational performance.",
  },
  {
    id: "partners",
    label: "Partners",
    href: "/operations/business-intelligence/partners",
    description: "Partner growth, readiness, and commercial contribution posture.",
  },
  {
    id: "applications",
    label: "Applications",
    href: "/operations/business-intelligence/applications",
    description: "Application volume, flow, and queue intelligence.",
  },
  {
    id: "inventory",
    label: "Inventory",
    href: "/operations/business-intelligence/inventory",
    description: "Inventory growth, listing quality, and lifecycle intelligence.",
  },
  {
    id: "ai-intelligence",
    label: "AI Intelligence",
    href: "/operations/business-intelligence/ai-intelligence",
    description: "AI-derived operational signals reused from existing intelligence systems.",
  },
  {
    id: "forecasts",
    label: "Forecasts",
    href: "/operations/business-intelligence/forecasts",
    description: "Forecast framework extension points for future predictive models.",
  },
  {
    id: "executive-reports",
    label: "Executive Reports",
    href: "/operations/business-intelligence/executive-reports",
    description: "Export-ready executive reporting views and report packs.",
  },
  {
    id: "executive-timeline",
    label: "Executive Timeline",
    href: "/operations/business-intelligence/executive-timeline",
    description: "Cross-centre timeline for major operational and commercial events.",
  },
  {
    id: "audit",
    label: "Audit",
    href: "/operations/business-intelligence/audit",
    description: "Business Intelligence action traceability via operations audit pipeline.",
  },
] as const;

export function getBusinessIntelligenceSectionBySlug(slug: string): BusinessIntelligenceSection | null {
  return BUSINESS_INTELLIGENCE_SECTIONS.find((section) => section.id === slug) ?? null;
}