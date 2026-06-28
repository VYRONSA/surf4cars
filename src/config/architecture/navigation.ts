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
  { id: "dealers", label: "Dealers", path: "/dealers/featured" },
  { id: "collections", label: "Collections", path: "/collections" },
  { id: "guides", label: "Guides", path: "/guides" },
  { id: "news", label: "News", path: "/news" },
];

const buyerPrimaryNav: readonly NavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/buyer", icon: "LayoutDashboard" },
  { id: "saved", label: "Saved Vehicles", path: "/buyer/saved", icon: "Car" },
  { id: "collections", label: "Collections", path: "/buyer/collections", icon: "Layers" },
  { id: "searches", label: "Saved Searches", path: "/buyer/searches", icon: "Search" },
  { id: "recent", label: "Recently Viewed", path: "/buyer/recent", icon: "Clock" },
  { id: "alerts", label: "Price Alerts", path: "/buyer/alerts", icon: "Bell" },
  { id: "messages", label: "Messages", path: "/buyer/messages", icon: "MessageSquare" },
];

const dealerPrimaryNav: readonly NavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/dealer", icon: "LayoutDashboard" },
  { id: "inventory", label: "Inventory", path: "/dealer/inventory", icon: "Car" },
  { id: "media", label: "Media", path: "/dealer/media", icon: "Image" },
  {
    id: "marketing",
    label: "Marketing Studio",
    path: "/dealer/marketing",
    icon: "Megaphone",
    children: [
      { id: "campaigns", label: "Campaigns", path: "/dealer/marketing/campaigns" },
      { id: "social", label: "Social Posts", path: "/dealer/marketing/social" },
      { id: "calendar", label: "Content Calendar", path: "/dealer/marketing/calendar" },
      { id: "library", label: "Marketing Library", path: "/dealer/marketing/library" },
    ],
  },
  {
    id: "ai",
    label: "AI Studio",
    path: "/dealer/ai",
    icon: "Bot",
    children: [
      { id: "ai-listings", label: "AI Listings", path: "/dealer/ai/listings" },
      { id: "ai-insights", label: "AI Insights", path: "/dealer/ai/insights" },
      { id: "ai-assistant", label: "AI Assistant", path: "/dealer/ai/assistant" },
    ],
  },
  { id: "leads", label: "Lead Centre", path: "/dealer/leads", icon: "Users" },
  { id: "crm", label: "CRM", path: "/dealer/crm", icon: "Building2" },
  {
    id: "analytics",
    label: "Analytics",
    path: "/dealer/analytics",
    icon: "BarChart3",
    children: [
      { id: "performance", label: "Performance", path: "/dealer/analytics/performance" },
      { id: "inventory-analytics", label: "Inventory", path: "/dealer/analytics/inventory" },
      { id: "marketing-analytics", label: "Marketing", path: "/dealer/analytics/marketing" },
      { id: "leads-analytics", label: "Leads", path: "/dealer/analytics/leads" },
    ],
  },
  { id: "reports", label: "Reports", path: "/dealer/reports", icon: "FileText" },
  { id: "seo", label: "SEO Centre", path: "/dealer/seo", icon: "Target" },
];

const dealerSecondaryNav: readonly NavItem[] = [
  { id: "team", label: "Team", path: "/dealer/team", icon: "Users" },
  { id: "branches", label: "Branches", path: "/dealer/branches", icon: "Store" },
  { id: "profile", label: "Dealer Profile", path: "/dealer/profile", icon: "BadgeCheck" },
  { id: "brand", label: "Brand Assets", path: "/dealer/brand", icon: "Palette" },
  { id: "documents", label: "Documents", path: "/dealer/documents", icon: "FileText" },
  { id: "billing", label: "Billing", path: "/dealer/billing", icon: "CreditCard" },
  { id: "website", label: "Website", path: "/dealer/website", icon: "Globe" },
  { id: "audit", label: "Audit Logs", path: "/dealer/audit", icon: "Shield" },
  { id: "settings", label: "Settings", path: "/dealer/settings", icon: "Settings" },
];

const adminPrimaryNav: readonly NavItem[] = [
  { id: "dealers", label: "Dealers", path: "/admin/dealers", icon: "Store" },
  { id: "users", label: "Users", path: "/admin/users", icon: "Users" },
  { id: "subscriptions", label: "Subscriptions", path: "/admin/subscriptions", icon: "CreditCard" },
  { id: "packages", label: "Packages", path: "/admin/packages", icon: "Layers" },
  { id: "support", label: "Support", path: "/admin/support", icon: "MessageSquare" },
  { id: "moderation", label: "Moderation", path: "/admin/moderation", icon: "Shield" },
  { id: "cms", label: "CMS", path: "/admin/cms", icon: "FileText" },
  { id: "advertising", label: "Advertising", path: "/admin/advertising", icon: "Megaphone" },
  { id: "featured", label: "Featured Listings", path: "/admin/featured", icon: "Sparkles" },
  { id: "seo", label: "SEO", path: "/admin/seo", icon: "Target" },
  { id: "analytics", label: "Analytics", path: "/admin/analytics", icon: "BarChart3" },
  { id: "health", label: "Platform Health", path: "/admin/health", icon: "Activity" },
  { id: "ai-usage", label: "AI Usage", path: "/admin/ai-usage", icon: "Bot" },
  { id: "settings", label: "System Settings", path: "/admin/settings", icon: "Settings" },
  { id: "audit", label: "Audit Logs", path: "/admin/audit", icon: "Shield" },
  { id: "developer", label: "Developer Tools", path: "/admin/developer", icon: "Cpu" },
];

const developerPrimaryNav: readonly NavItem[] = [
  { id: "api-keys", label: "API Keys", path: "/developer/api-keys", icon: "Key" },
  { id: "webhooks", label: "Webhooks", path: "/developer/webhooks", icon: "Zap" },
  { id: "logs", label: "Logs", path: "/developer/logs", icon: "FileText" },
  { id: "flags", label: "Feature Flags", path: "/developer/flags", icon: "SlidersHorizontal" },
  { id: "jobs", label: "Background Jobs", path: "/developer/jobs", icon: "Cpu" },
  { id: "queue", label: "Queue Monitor", path: "/developer/queue", icon: "Activity" },
  { id: "docs", label: "Documentation", path: "/developer/docs", icon: "FileText" },
  { id: "environment", label: "Environment", path: "/developer/environment", icon: "Settings" },
  { id: "monitoring", label: "Monitoring", path: "/developer/monitoring", icon: "BarChart3" },
];

export const NAVIGATION_BY_USER_TYPE: Record<UserTypeId, NavigationConfig> = {
  "public-visitor": {
    userType: "public-visitor",
    portal: "public",
    primary: publicPrimaryNav,
    quickActions: [
      { id: "search", label: "Search Vehicles", path: "/search" },
      { id: "sign-in", label: "Sign In", path: "/auth/sign-in" },
      { id: "dealer-sign-up", label: "Dealer Sign Up", path: "/auth/sign-up/dealer" },
    ],
    mobile: [
      { id: "home", label: "Home", path: "/" },
      { id: "search", label: "Search", path: "/search" },
      { id: "dealers", label: "Dealers", path: "/dealers/featured" },
      { id: "account", label: "Account", path: "/auth/sign-in" },
    ],
  },
  buyer: {
    userType: "buyer",
    portal: "buyer",
    primary: buyerPrimaryNav,
    secondary: [
      { id: "profile", label: "Profile", path: "/buyer/profile", icon: "User" },
      { id: "settings", label: "Settings", path: "/buyer/settings", icon: "Settings" },
      { id: "notifications", label: "Notifications", path: "/buyer/notifications", icon: "Bell" },
      { id: "activity", label: "Activity", path: "/buyer/activity", icon: "Activity" },
    ],
    quickActions: [
      { id: "search", label: "Search Vehicles", path: "/search" },
      { id: "save-search", label: "Save Search", path: "/buyer/searches" },
    ],
    commandPaletteGroups: [
      { id: "navigation", label: "Navigation", items: [...buyerPrimaryNav] },
      { id: "actions", label: "Quick Actions", items: [
        { id: "new-collection", label: "New Collection", path: "/buyer/collections" },
        { id: "messages", label: "View Messages", path: "/buyer/messages" },
      ]},
    ],
    mobile: [
      { id: "dashboard", label: "Home", path: "/buyer" },
      { id: "saved", label: "Saved", path: "/buyer/saved" },
      { id: "search", label: "Search", path: "/search" },
      { id: "messages", label: "Messages", path: "/buyer/messages" },
      { id: "profile", label: "Profile", path: "/buyer/profile" },
    ],
  },
  dealer: {
    userType: "dealer",
    portal: "dealer",
    primary: dealerPrimaryNav.filter((item) =>
      ["dashboard", "inventory", "leads", "crm", "media"].includes(item.id),
    ),
    secondary: [
      { id: "settings", label: "Settings", path: "/dealer/settings", icon: "Settings" },
      { id: "notifications", label: "Notifications", path: "/dealer/notifications", icon: "Bell" },
    ],
    mobile: [
      { id: "dashboard", label: "Home", path: "/dealer" },
      { id: "inventory", label: "Stock", path: "/dealer/inventory" },
      { id: "leads", label: "Leads", path: "/dealer/leads" },
      { id: "crm", label: "CRM", path: "/dealer/crm" },
      { id: "more", label: "More", path: "/dealer/settings" },
    ],
  },
  salesperson: {
    userType: "salesperson",
    portal: "dealer",
    primary: dealerPrimaryNav.filter((item) =>
      ["dashboard", "inventory", "marketing", "leads", "crm", "analytics"].includes(item.id),
    ),
    secondary: dealerSecondaryNav.filter((item) =>
      ["profile", "settings", "notifications"].includes(item.id),
    ),
    quickActions: [
      { id: "add-vehicle", label: "Add Vehicle", path: "/dealer/inventory" },
      { id: "new-lead", label: "New Lead", path: "/dealer/leads" },
    ],
    mobile: [
      { id: "dashboard", label: "Home", path: "/dealer" },
      { id: "inventory", label: "Stock", path: "/dealer/inventory" },
      { id: "leads", label: "Leads", path: "/dealer/leads" },
      { id: "crm", label: "CRM", path: "/dealer/crm" },
      { id: "more", label: "More", path: "/dealer/settings" },
    ],
  },
  "branch-manager": {
    userType: "branch-manager",
    portal: "dealer",
    primary: dealerPrimaryNav,
    secondary: dealerSecondaryNav.filter((item) =>
      !["billing", "website"].includes(item.id),
    ),
    quickActions: [
      { id: "publish-vehicle", label: "Publish Vehicle", path: "/dealer/inventory" },
      { id: "view-reports", label: "View Reports", path: "/dealer/reports" },
      { id: "ai-insights", label: "AI Insights", path: "/dealer/ai/insights" },
    ],
    mobile: [
      { id: "dashboard", label: "Home", path: "/dealer" },
      { id: "inventory", label: "Stock", path: "/dealer/inventory" },
      { id: "analytics", label: "Analytics", path: "/dealer/analytics" },
      { id: "marketing", label: "Marketing", path: "/dealer/marketing" },
      { id: "more", label: "More", path: "/dealer/settings" },
    ],
  },
  "dealer-owner": {
    userType: "dealer-owner",
    portal: "dealer",
    primary: dealerPrimaryNav,
    secondary: dealerSecondaryNav,
    quickActions: [
      { id: "team", label: "Manage Team", path: "/dealer/team" },
      { id: "billing", label: "Billing", path: "/dealer/billing" },
      { id: "ai-assistant", label: "AI Assistant", path: "/dealer/ai/assistant" },
    ],
    commandPaletteGroups: [
      { id: "navigation", label: "Navigation", items: [...dealerPrimaryNav, ...dealerSecondaryNav] },
      { id: "actions", label: "Quick Actions", items: [
        { id: "add-vehicle", label: "Add Vehicle", path: "/dealer/inventory" },
        { id: "new-campaign", label: "New Campaign", path: "/dealer/marketing/campaigns" },
      ]},
    ],
    mobile: [
      { id: "dashboard", label: "Home", path: "/dealer" },
      { id: "inventory", label: "Stock", path: "/dealer/inventory" },
      { id: "analytics", label: "Analytics", path: "/dealer/analytics" },
      { id: "marketing", label: "Marketing", path: "/dealer/marketing" },
      { id: "more", label: "More", path: "/dealer/settings" },
    ],
  },
  "platform-administrator": {
    userType: "platform-administrator",
    portal: "admin",
    primary: adminPrimaryNav,
    quickActions: [
      { id: "dealers", label: "Manage Dealers", path: "/admin/dealers" },
      { id: "health", label: "Platform Health", path: "/admin/health" },
    ],
    mobile: [
      { id: "dealers", label: "Dealers", path: "/admin/dealers" },
      { id: "users", label: "Users", path: "/admin/users" },
      { id: "support", label: "Support", path: "/admin/support" },
      { id: "health", label: "Health", path: "/admin/health" },
      { id: "more", label: "More", path: "/admin/settings" },
    ],
  },
  developer: {
    userType: "developer",
    portal: "developer",
    primary: developerPrimaryNav,
    quickActions: [
      { id: "docs", label: "API Docs", path: "/developer/docs" },
      { id: "api-keys", label: "Create API Key", path: "/developer/api-keys" },
    ],
    mobile: developerPrimaryNav.slice(0, 5),
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
    admin: "/admin",
    developer: "/developer",
  },
} as const;

export function getNavigationForUserType(userType: UserTypeId): NavigationConfig {
  return NAVIGATION_BY_USER_TYPE[userType];
}
