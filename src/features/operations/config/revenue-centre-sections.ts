export type RevenueCentreSectionId =
  | "overview"
  | "subscriptions"
  | "revenue-streams"
  | "dealer-revenue"
  | "advertising-revenue"
  | "finance-revenue"
  | "insurance-revenue"
  | "warranty-revenue"
  | "partner-revenue"
  | "outstanding-revenue"
  | "forecasting"
  | "revenue-trends"
  | "reports"
  | "timeline"
  | "audit";

export interface RevenueCentreSection {
  readonly id: RevenueCentreSectionId;
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

export const REVENUE_CENTRE_SECTIONS: readonly RevenueCentreSection[] = [
  { id: "overview", label: "Overview", href: "/operations/revenue-centre", description: "Executive revenue intelligence summary." },
  { id: "subscriptions", label: "Subscriptions", href: "/operations/revenue-centre/subscriptions", description: "Subscription package and dealer distribution visibility." },
  { id: "revenue-streams", label: "Revenue Streams", href: "/operations/revenue-centre/revenue-streams", description: "Unified view across all platform revenue streams." },
  { id: "dealer-revenue", label: "Dealer Revenue", href: "/operations/revenue-centre/dealer-revenue", description: "Dealer-by-dealer commercial intelligence." },
  { id: "advertising-revenue", label: "Advertising Revenue", href: "/operations/revenue-centre/advertising-revenue", description: "Advertising and featured listing revenue framework." },
  { id: "finance-revenue", label: "Finance Revenue", href: "/operations/revenue-centre/finance-revenue", description: "Finance request and commission framework." },
  { id: "insurance-revenue", label: "Insurance Revenue", href: "/operations/revenue-centre/insurance-revenue", description: "Insurance commission framework." },
  { id: "warranty-revenue", label: "Warranty Revenue", href: "/operations/revenue-centre/warranty-revenue", description: "Warranty revenue framework." },
  { id: "partner-revenue", label: "Partner Revenue", href: "/operations/revenue-centre/partner-revenue", description: "Partner and affiliate revenue framework." },
  { id: "outstanding-revenue", label: "Outstanding Revenue", href: "/operations/revenue-centre/outstanding-revenue", description: "Outstanding invoices, overdue subscriptions, and collections framework." },
  { id: "forecasting", label: "Forecasting", href: "/operations/revenue-centre/forecasting", description: "Monthly, quarterly, annual forecasting framework." },
  { id: "revenue-trends", label: "Revenue Trends", href: "/operations/revenue-centre/revenue-trends", description: "Growth, churn, and expansion trends." },
  { id: "reports", label: "Reports", href: "/operations/revenue-centre/reports", description: "Export-ready executive revenue reporting." },
  { id: "timeline", label: "Timeline", href: "/operations/revenue-centre/timeline", description: "Revenue events timeline across streams and actions." },
  { id: "audit", label: "Audit", href: "/operations/revenue-centre/audit", description: "Revenue action audit traceability." },
] as const;

export function getRevenueCentreSectionBySlug(slug: string): RevenueCentreSection | null {
  return REVENUE_CENTRE_SECTIONS.find((section) => section.id === slug) ?? null;
}
