/**
 * SURF FOR CARS — Navigation Architecture
 *
 * Primary, secondary, context, and mobile navigation per user type.
 */

import type { UserTypeId } from "./user-types";

export type NavigationLayer =
  | "primary"
  | "secondary"
  | "context"
  | "quick-actions"
  | "mobile"
  | "command-palette";

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly icon?: string;
  readonly badge?: string;
  readonly children?: readonly NavItem[];
}

export interface NavigationConfig {
  readonly userType: UserTypeId;
  readonly portal: string;
  readonly primary: readonly NavItem[];
  readonly secondary?: readonly NavItem[];
  readonly quickActions?: readonly NavItem[];
  readonly commandPaletteGroups?: readonly {
    readonly id: string;
    readonly label: string;
    readonly items: readonly NavItem[];
  }[];
  readonly mobile: readonly NavItem[];
}

const publicPrimaryNav: readonly NavItem[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "search", label: "Search", path: "/search" },
  { id: "dealer-sign-up", label: "Dealer Sign Up", path: "/auth/sign-up/dealer" },
];

const buyerPrimaryNav: readonly NavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/buyer", icon: "LayoutDashboard" },
  { id: "intelligence", label: "Buyer Intelligence", path: "/buyer/intelligence", icon: "Brain" },
  { id: "search", label: "Search", path: "/search", icon: "Search" },
];

const dealerPrimaryNav: readonly NavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/dealer", icon: "LayoutDashboard" },
  { id: "inventory", label: "Inventory", path: "/dealer/inventory", icon: "Car" },
  { id: "market", label: "Market Intelligence", path: "/dealer/market", icon: "LineChart" },
  { id: "create-vehicle", label: "Create Vehicle", path: "/dealer/inventory/new", icon: "Plus" },
];

const dealerSecondaryNav: readonly NavItem[] = [];

const adminPrimaryNav: readonly NavItem[] = [];

const developerPrimaryNav: readonly NavItem[] = [];

const operationsPrimaryNav: readonly NavItem[] = [
  { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard", icon: "LayoutDashboard" },
  { id: "dealer-management", label: "Dealer Management", path: "/operations/dealer-management", icon: "Building2" },
  { id: "dealer-intelligence", label: "Dealer Intelligence", path: "/operations/dealer-intelligence", icon: "Brain" },
  { id: "applications-centre", label: "Applications Centre", path: "/operations/applications-centre", icon: "FileText" },
  { id: "marketplace-control", label: "Marketplace Control", path: "/operations/marketplace-control", icon: "Store" },
  { id: "revenue-centre", label: "Revenue Centre", path: "/operations/revenue-centre", icon: "TrendingUp" },
  { id: "advertising-centre", label: "Advertising Centre", path: "/operations/advertising-centre", icon: "Megaphone" },
  { id: "partner-centre", label: "Partner Centre", path: "/operations/partner-centre", icon: "Users" },
  { id: "business-intelligence", label: "Business Intelligence", path: "/operations/business-intelligence", icon: "BarChart3" },
  { id: "settings", label: "Settings", path: "/operations/settings", icon: "Settings" },
  { id: "audit-logs", label: "Audit Logs", path: "/operations/audit-logs", icon: "Shield" },
  { id: "workers", label: "Workers", path: "/operations/workers", icon: "Activity" },
];

export const NAVIGATION_BY_USER_TYPE: Record<UserTypeId, NavigationConfig> = {
  "public-visitor": {
    userType: "public-visitor",
    portal: "public",
    primary: publicPrimaryNav,
    quickActions: [
      { id: "search", label: "Search Vehicles", path: "/search" },
      { id: "dealer-sign-up", label: "Dealer Sign Up", path: "/auth/sign-up/dealer" },
    ],
    mobile: [
      { id: "home", label: "Home", path: "/" },
      { id: "search", label: "Search", path: "/search" },
      { id: "dealer-sign-up", label: "Dealer Sign Up", path: "/auth/sign-up/dealer" },
    ],
  },
  buyer: {
    userType: "buyer",
    portal: "buyer",
    primary: buyerPrimaryNav,
    secondary: [],
    quickActions: [
      { id: "search", label: "Search Vehicles", path: "/search" },
    ],
    commandPaletteGroups: [
      { id: "navigation", label: "Navigation", items: [...buyerPrimaryNav] },
      { id: "actions", label: "Quick Actions", items: [
        { id: "search", label: "Search Vehicles", path: "/search" },
      ]},
    ],
    mobile: [
      { id: "dashboard", label: "Home", path: "/buyer" },
      { id: "intelligence", label: "Intelligence", path: "/buyer/intelligence" },
      { id: "search", label: "Search", path: "/search" },
      { id: "dealer-sign-up", label: "Dealer Sign Up", path: "/auth/sign-up/dealer" },
    ],
  },
  dealer: {
    userType: "dealer",
    portal: "dealer",
    primary: dealerPrimaryNav,
    secondary: [],
    mobile: [
      { id: "dashboard", label: "Home", path: "/dealer" },
      { id: "inventory", label: "Stock", path: "/dealer/inventory" },
      { id: "market", label: "Market", path: "/dealer/market" },
      { id: "create-vehicle", label: "Add", path: "/dealer/inventory/new" },
    ],
  },
  salesperson: {
    userType: "salesperson",
    portal: "dealer",
    primary: dealerPrimaryNav,
    secondary: dealerSecondaryNav,
    quickActions: [
      { id: "add-vehicle", label: "Add Vehicle", path: "/dealer/inventory/new" },
    ],
    mobile: [
      { id: "dashboard", label: "Home", path: "/dealer" },
      { id: "inventory", label: "Stock", path: "/dealer/inventory" },
      { id: "market", label: "Market", path: "/dealer/market" },
      { id: "create-vehicle", label: "Add", path: "/dealer/inventory/new" },
    ],
  },
  "branch-manager": {
    userType: "branch-manager",
    portal: "dealer",
    primary: dealerPrimaryNav,
    secondary: dealerSecondaryNav,
    quickActions: [
      { id: "publish-vehicle", label: "Publish Vehicle", path: "/dealer/inventory/new" },
      { id: "view-market", label: "View Market", path: "/dealer/market" },
    ],
    mobile: [
      { id: "dashboard", label: "Home", path: "/dealer" },
      { id: "inventory", label: "Stock", path: "/dealer/inventory" },
      { id: "market", label: "Market", path: "/dealer/market" },
      { id: "create-vehicle", label: "Add", path: "/dealer/inventory/new" },
    ],
  },
  "dealer-owner": {
    userType: "dealer-owner",
    portal: "dealer",
    primary: dealerPrimaryNav,
    secondary: dealerSecondaryNav,
    quickActions: [
      { id: "publish-vehicle", label: "Publish Vehicle", path: "/dealer/inventory/new" },
      { id: "view-market", label: "View Market", path: "/dealer/market" },
    ],
    commandPaletteGroups: [
      { id: "navigation", label: "Navigation", items: [...dealerPrimaryNav, ...dealerSecondaryNav] },
      { id: "actions", label: "Quick Actions", items: [
        { id: "add-vehicle", label: "Add Vehicle", path: "/dealer/inventory/new" },
        { id: "view-market", label: "View Market", path: "/dealer/market" },
      ]},
    ],
    mobile: [
      { id: "dashboard", label: "Home", path: "/dealer" },
      { id: "inventory", label: "Stock", path: "/dealer/inventory" },
      { id: "market", label: "Market", path: "/dealer/market" },
      { id: "create-vehicle", label: "Add", path: "/dealer/inventory/new" },
    ],
  },
  "platform-administrator": {
    userType: "platform-administrator",
    portal: "admin",
    primary: adminPrimaryNav,
    quickActions: [],
    mobile: [],
  },
  developer: {
    userType: "developer",
    portal: "developer",
    primary: developerPrimaryNav,
    quickActions: [],
    mobile: [],
  },
  "platform-owner": {
    userType: "platform-owner",
    portal: "operations",
    primary: operationsPrimaryNav,
    mobile: [
      { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard" },
      { id: "dealer-management", label: "Dealers", path: "/operations/dealer-management" },
      { id: "revenue-centre", label: "Revenue", path: "/operations/revenue-centre" },
      { id: "audit-logs", label: "Audit", path: "/operations/audit-logs" },
    ],
  },
  "operations-director": {
    userType: "operations-director",
    portal: "operations",
    primary: operationsPrimaryNav,
    mobile: [
      { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard" },
      { id: "dealer-management", label: "Dealers", path: "/operations/dealer-management" },
      { id: "revenue-centre", label: "Revenue", path: "/operations/revenue-centre" },
      { id: "audit-logs", label: "Audit", path: "/operations/audit-logs" },
    ],
  },
  "dealer-success": {
    userType: "dealer-success",
    portal: "operations",
    primary: operationsPrimaryNav,
    mobile: [
      { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard" },
      { id: "dealer-management", label: "Dealers", path: "/operations/dealer-management" },
      { id: "applications-centre", label: "Applications", path: "/operations/applications-centre" },
    ],
  },
  marketplace: {
    userType: "marketplace",
    portal: "operations",
    primary: operationsPrimaryNav,
    mobile: [
      { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard" },
      { id: "marketplace-control", label: "Marketplace", path: "/operations/marketplace-control" },
      { id: "dealer-intelligence", label: "Intelligence", path: "/operations/dealer-intelligence" },
    ],
  },
  revenue: {
    userType: "revenue",
    portal: "operations",
    primary: operationsPrimaryNav,
    mobile: [
      { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard" },
      { id: "revenue-centre", label: "Revenue", path: "/operations/revenue-centre" },
      { id: "business-intelligence", label: "BI", path: "/operations/business-intelligence" },
    ],
  },
  finance: {
    userType: "finance",
    portal: "operations",
    primary: operationsPrimaryNav,
    mobile: [
      { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard" },
      { id: "revenue-centre", label: "Revenue", path: "/operations/revenue-centre" },
      { id: "applications-centre", label: "Applications", path: "/operations/applications-centre" },
    ],
  },
  support: {
    userType: "support",
    portal: "operations",
    primary: operationsPrimaryNav,
    mobile: [
      { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard" },
      { id: "applications-centre", label: "Applications", path: "/operations/applications-centre" },
      { id: "audit-logs", label: "Audit", path: "/operations/audit-logs" },
    ],
  },
  marketing: {
    userType: "marketing",
    portal: "operations",
    primary: operationsPrimaryNav,
    mobile: [
      { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard" },
      { id: "advertising-centre", label: "Advertising", path: "/operations/advertising-centre" },
      { id: "partner-centre", label: "Partners", path: "/operations/partner-centre" },
    ],
  },
  moderation: {
    userType: "moderation",
    portal: "operations",
    primary: operationsPrimaryNav,
    mobile: [
      { id: "operations-dashboard", label: "Dashboard", path: "/operations/dashboard" },
      { id: "marketplace-control", label: "Marketplace", path: "/operations/marketplace-control" },
      { id: "audit-logs", label: "Audit", path: "/operations/audit-logs" },
    ],
  },
};

export const GLOBAL_SEARCH = {
  id: "global-search",
  label: "Global Search",
  shortcut: "⌘K",
  scopes: {
    public: ["vehicles", "dealers", "guides", "news"],
    buyer: ["vehicles", "saved", "messages", "collections"],
    dealer: ["inventory", "leads", "crm", "campaigns", "analytics"],
    admin: ["dealers", "users", "support", "moderation"],
    developer: ["endpoints", "webhooks", "logs", "docs"],
    operations: ["dealers", "applications", "revenue", "alerts", "audit"],
  },
} as const;

export const BREADCRUMB_STRATEGY = {
  autoGenerate: true,
  maxDepth: 4,
  showHome: true,
  portalRoots: {
    public: "/",
    buyer: "/buyer",
    dealer: "/dealer",
    operations: "/operations",
    admin: "/admin",
    developer: "/developer",
  },
} as const;

export function getNavigationForUserType(userType: UserTypeId): NavigationConfig {
  return NAVIGATION_BY_USER_TYPE[userType];
}
