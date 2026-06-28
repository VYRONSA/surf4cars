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
    { id: "vehicles", label: "Vehicles", href: "/vehicles", icon: "Car" },
    { id: "dealers", label: "Dealers", href: "/dealers", icon: "Store" },
    { id: "collections", label: "Collections", href: "/collections", icon: "Layers" },
  ],
};

const dealerCommandCentreGroup: ShellNavGroup = {
  id: "dealer-command-centre",
  label: "Dealer Command Centre",
  items: [
    { id: "dashboard", label: "Dashboard", href: "/dealer/dashboard", icon: "LayoutDashboard" },
    { id: "leads", label: "Lead Centre", href: "/dealer/leads", icon: "Users" },
    { id: "reports", label: "Reports", href: "/dealer/reports", icon: "FileText" },
  ],
};

const inventoryGroup: ShellNavGroup = {
  id: "inventory",
  label: "Inventory",
  items: [
    { id: "stock", label: "Stock", href: "/dealer/inventory", icon: "Car" },
    { id: "media", label: "Media Library", href: "/dealer/media", icon: "Image" },
  ],
};

const marketingStudioGroup: ShellNavGroup = {
  id: "marketing-studio",
  label: "Marketing Studio",
  items: [
    { id: "campaigns", label: "Campaigns", href: "/dealer/marketing/campaigns", icon: "Megaphone" },
    { id: "social", label: "Social Posts", href: "/dealer/marketing/social", icon: "Share2" },
    { id: "calendar", label: "Content Calendar", href: "/dealer/marketing/calendar", icon: "Calendar" },
    { id: "library", label: "Marketing Library", href: "/dealer/marketing/library", icon: "Layers" },
  ],
};

const aiStudioGroup: ShellNavGroup = {
  id: "ai-studio",
  label: "AI Studio",
  items: [
    { id: "ai-listings", label: "AI Listings", href: "/dealer/ai/listings", icon: "Sparkles" },
    { id: "ai-insights", label: "AI Insights", href: "/dealer/ai/insights", icon: "Brain" },
    { id: "ai-assistant", label: "AI Assistant", href: "/dealer/ai/assistant", icon: "Bot" },
  ],
};

const analyticsGroup: ShellNavGroup = {
  id: "analytics",
  label: "Analytics",
  items: [
    { id: "performance", label: "Performance", href: "/dealer/analytics/performance", icon: "BarChart3" },
    { id: "inventory-analytics", label: "Inventory", href: "/dealer/analytics/inventory", icon: "LineChart" },
    { id: "marketing-analytics", label: "Marketing", href: "/dealer/analytics/marketing", icon: "TrendingUp" },
    { id: "traffic", label: "Traffic", href: "/dealer/analytics/traffic", icon: "Activity" },
  ],
};

const crmGroup: ShellNavGroup = {
  id: "crm",
  label: "CRM",
  items: [
    { id: "crm", label: "CRM", href: "/dealer/crm", icon: "Building2" },
    { id: "pipeline", label: "Pipeline", href: "/dealer/crm", icon: "Target" },
  ],
};

const buyerGroup: ShellNavGroup = {
  id: "buyer",
  label: "Buyer",
  items: [
    { id: "dashboard", label: "Dashboard", href: "/buyer", icon: "LayoutDashboard" },
    { id: "saved", label: "Saved Vehicles", href: "/buyer/saved", icon: "Car" },
    { id: "messages", label: "Messages", href: "/buyer/messages", icon: "MessageSquare" },
    { id: "alerts", label: "Price Alerts", href: "/buyer/alerts", icon: "Bell" },
  ],
};

const administrationGroup: ShellNavGroup = {
  id: "administration",
  label: "Administration",
  items: [
    { id: "dealers", label: "Dealers", href: "/admin/dealers", icon: "Store" },
    { id: "users", label: "Users", href: "/admin/users", icon: "Users" },
    { id: "moderation", label: "Moderation", href: "/admin/moderation", icon: "Shield" },
    { id: "cms", label: "CMS", href: "/admin/cms", icon: "FileText" },
    { id: "health", label: "Platform Health", href: "/admin/health", icon: "Activity" },
  ],
};

const developerGroup: ShellNavGroup = {
  id: "developer",
  label: "Developer",
  items: [
    { id: "api-keys", label: "API Keys", href: "/developer/api-keys", icon: "Key" },
    { id: "webhooks", label: "Webhooks", href: "/developer/webhooks", icon: "Zap" },
    { id: "docs", label: "Documentation", href: "/developer/docs", icon: "FileText" },
    { id: "monitoring", label: "Monitoring", href: "/developer/monitoring", icon: "BarChart3" },
  ],
};

const settingsGroup: ShellNavGroup = {
  id: "settings",
  label: "Settings",
  items: [
    { id: "profile", label: "Profile", href: "/settings/profile", icon: "User" },
    { id: "notifications-settings", label: "Notifications", href: "/settings/notifications", icon: "Bell" },
    { id: "security", label: "Security", href: "/settings/security", icon: "Lock" },
  ],
};

const supportGroup: ShellNavGroup = {
  id: "support",
  label: "Support",
  items: [
    { id: "help", label: "Help Centre", href: "/support", icon: "MessageSquare" },
    { id: "faq", label: "FAQ", href: "/faq", icon: "FileText" },
    { id: "contact", label: "Contact", href: "/contact", icon: "Mail" },
  ],
};

export const SHELL_NAV_BY_PORTAL: Record<PortalId | "public", readonly ShellNavGroup[]> = {
  public: [marketplaceGroup, supportGroup],
  buyer: [buyerGroup, marketplaceGroup, settingsGroup, supportGroup],
  dealer: [
    dealerCommandCentreGroup,
    inventoryGroup,
    marketingStudioGroup,
    aiStudioGroup,
    analyticsGroup,
    crmGroup,
    settingsGroup,
    supportGroup,
  ],
  admin: [administrationGroup, marketplaceGroup, developerGroup, settingsGroup, supportGroup],
  developer: [developerGroup, settingsGroup, supportGroup],
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
