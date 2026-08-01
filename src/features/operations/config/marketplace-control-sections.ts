export type MarketplaceControlSectionId =
  | "overview"
  | "vehicle-approvals"
  | "marketplace-health"
  | "listing-quality"
  | "duplicate-listings"
  | "fraud-review"
  | "ai-moderation"
  | "image-review"
  | "dealer-quality"
  | "marketplace-alerts"
  | "timeline"
  | "audit";

export interface MarketplaceControlSection {
  readonly id: MarketplaceControlSectionId;
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

export const MARKETPLACE_CONTROL_SECTIONS: readonly MarketplaceControlSection[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/operations/marketplace-control",
    description: "Executive marketplace quality and trust summary.",
  },
  {
    id: "vehicle-approvals",
    label: "Vehicle Approvals",
    href: "/operations/marketplace-control/vehicle-approvals",
    description: "Unified approval queue for listing lifecycle decisions.",
  },
  {
    id: "marketplace-health",
    label: "Marketplace Health",
    href: "/operations/marketplace-control/marketplace-health",
    description: "Published, draft, sold, quality, and alert posture.",
  },
  {
    id: "listing-quality",
    label: "Listing Quality",
    href: "/operations/marketplace-control/listing-quality",
    description: "Listing quality scoring and recommendations from existing intelligence rules.",
  },
  {
    id: "duplicate-listings",
    label: "Duplicate Listings",
    href: "/operations/marketplace-control/duplicate-listings",
    description: "Duplicate signals from known listing identifiers.",
  },
  {
    id: "fraud-review",
    label: "Fraud Review",
    href: "/operations/marketplace-control/fraud-review",
    description: "Fraud framework and workflow extension points.",
  },
  {
    id: "ai-moderation",
    label: "AI Moderation",
    href: "/operations/marketplace-control/ai-moderation",
    description: "Content, pricing, and listing moderation status from existing intelligence services.",
  },
  {
    id: "image-review",
    label: "Image Review",
    href: "/operations/marketplace-control/image-review",
    description: "Photo readiness, primary image coverage, and quality indicators.",
  },
  {
    id: "dealer-quality",
    label: "Dealer Quality",
    href: "/operations/marketplace-control/dealer-quality",
    description: "Dealer-level quality and compliance indicators.",
  },
  {
    id: "marketplace-alerts",
    label: "Marketplace Alerts",
    href: "/operations/marketplace-control/marketplace-alerts",
    description: "Actionable quality, duplicate, and moderation alerts.",
  },
  {
    id: "timeline",
    label: "Timeline",
    href: "/operations/marketplace-control/timeline",
    description: "Marketplace moderation timeline across approvals and interventions.",
  },
  {
    id: "audit",
    label: "Audit",
    href: "/operations/marketplace-control/audit",
    description: "Audit stream using the existing operations audit pipeline.",
  },
] as const;

export function getMarketplaceControlSectionBySlug(slug: string): MarketplaceControlSection | null {
  return MARKETPLACE_CONTROL_SECTIONS.find((section) => section.id === slug) ?? null;
}
