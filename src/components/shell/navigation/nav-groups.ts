/**
 * SURF FOR CARS — Shell Navigation Groups
 * Structure only — no pages connected.
 */

import type { PortalId } from "@/config/architecture";

export interface ShellNavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon: string;
  readonly badge?: string;
}

export interface ShellNavGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly ShellNavItem[];
}

const marketplaceGroup: ShellNavGroup = {
  id: "marketplace",
  label: "Marketplace",
  items: [
    { id: "search", label: "Search", href: "/search", icon: "Search" },
    { id: "dealer-sign-up", label: "Dealer Sign Up", href: "/auth/sign-up/dealer", icon: "Store" },
  ],
};

const dealerCommandCentreGroup: ShellNavGroup = {
  id: "dealer-command-centre",
  label: "Dealer Command Centre",
  items: [
    { id: "dashboard", label: "Dashboard", href: "/dealer/dashboard", icon: "LayoutDashboard" },
    { id: "dealership-profile", label: "Dealership Profile", href: "/dealer/profile", icon: "Building2" },
    { id: "team-management", label: "Team Management", href: "/dealer/team", icon: "Users" },
    { id: "branches", label: "Branches", href: "/dealer/branches", icon: "MapPin" },
    { id: "settings", label: "Settings", href: "/dealer/settings", icon: "Settings" },
    { id: "inventory", label: "Inventory", href: "/dealer/inventory", icon: "Car" },
    { id: "create-vehicle", label: "Create Vehicle", href: "/dealer/inventory/new", icon: "Plus" },
  ],
};

const inventoryGroup: ShellNavGroup = {
  id: "inventory",
  label: "Inventory",
  items: [
    { id: "stock", label: "Stock", href: "/dealer/inventory", icon: "Car" },
    { id: "market-intelligence", label: "Market Intelligence", href: "/dealer/market", icon: "LineChart" },
    { id: "new-vehicle", label: "Create Vehicle", href: "/dealer/inventory/new", icon: "Upload" },
  ],
};

const buyerGroup: ShellNavGroup = {
  id: "buyer",
  label: "Buyer",
  items: [
    { id: "dashboard", label: "Dashboard", href: "/buyer", icon: "LayoutDashboard" },
    { id: "intelligence", label: "Buyer Intelligence", href: "/buyer/intelligence", icon: "Brain" },
    { id: "search", label: "Search", href: "/search", icon: "Search" },
  ],
};

const operationsGroup: ShellNavGroup = {
  id: "operations-centre",
  label: "Operations Centre",
  items: [
    { id: "operations-dashboard", label: "Dashboard", href: "/operations/dashboard", icon: "LayoutDashboard" },
    /* Second, deliberately. It is the surface the marketplace is changed from, and burying it under
       eleven analytics screens is how a curation tool goes unused. */
    { id: "editorial", label: "Editorial Console", href: "/operations/editorial", icon: "Sparkles" },
    { id: "onboarding-centre", label: "Onboarding Centre", href: "/operations/onboarding-centre", icon: "TrendingUp" },
    { id: "verification", label: "Verification", href: "/operations/verification", icon: "Shield" },
    { id: "quality-centre", label: "Quality Centre", href: "/operations/quality-centre", icon: "BadgeCheck" },
    { id: "dealer-management", label: "Dealer Management", href: "/operations/dealer-management", icon: "Building2" },
    { id: "dealer-intelligence", label: "Dealer Intelligence", href: "/operations/dealer-intelligence", icon: "Brain" },
    { id: "applications-centre", label: "Applications Centre", href: "/operations/applications-centre", icon: "FileText" },
    { id: "marketplace-control", label: "Marketplace Control", href: "/operations/marketplace-control", icon: "Store" },
    { id: "revenue-centre", label: "Revenue Centre", href: "/operations/revenue-centre", icon: "TrendingUp" },
    { id: "advertising-centre", label: "Advertising Centre", href: "/operations/advertising-centre", icon: "Megaphone" },
    { id: "partner-centre", label: "Partner Centre", href: "/operations/partner-centre", icon: "Users" },
    { id: "business-intelligence", label: "Business Intelligence", href: "/operations/business-intelligence", icon: "BarChart3" },
    { id: "settings", label: "Settings", href: "/operations/settings", icon: "Settings" },
    { id: "audit-logs", label: "Audit Logs", href: "/operations/audit-logs", icon: "Shield" },
    { id: "workers", label: "Workers", href: "/operations/workers", icon: "Activity" },
  ],
};

export const SHELL_NAV_BY_PORTAL: Record<PortalId | "public", readonly ShellNavGroup[]> = {
  public: [marketplaceGroup],
  buyer: [buyerGroup, marketplaceGroup],
  dealer: [dealerCommandCentreGroup, inventoryGroup],
  operations: [operationsGroup],
  admin: [],
  developer: [],
  auth: [],
};

export const COMMAND_PALETTE_ACTIONS = [
  { id: "search-vehicles", label: "Search vehicles", group: "Search", icon: "Car" },
  { id: "search-dealers", label: "Search dealers", group: "Search", icon: "Store" },
  { id: "open-inventory", label: "Open inventory", group: "Navigation", icon: "Car" },
  { id: "create-vehicle", label: "Create vehicle", group: "Actions", icon: "Plus" },
  { id: "generate-marketing", label: "Generate marketing", group: "Actions", icon: "Megaphone" },
  { id: "open-ai", label: "Open AI Studio", group: "Navigation", icon: "Bot" },
  { id: "settings", label: "Settings", group: "Navigation", icon: "Settings" },
] as const;

export const GLOBAL_SEARCH_SCOPES = [
  "vehicles",
  "dealers",
  "buyers",
  "pages",
  "commands",
  "ai",
] as const;
