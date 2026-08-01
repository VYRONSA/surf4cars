/**
 * SURF FOR CARS — Layout Architecture
 *
 * Defines layout shells for each portal and system state.
 * Layout components will be implemented in src/components/layout/.
 */

export type LayoutId =
  | "root"
  | "public-website"
  | "marketplace"
  | "buyer-portal"
  | "dealer-portal"
  | "operations-portal"
  | "admin-portal"
  | "developer-portal"
  | "authentication"
  | "settings"
  | "empty-state"
  | "error"
  | "loading";

export interface LayoutDefinition {
  readonly id: LayoutId;
  readonly label: string;
  readonly description: string;
  readonly routeGroup: string;
  readonly appPath: string;
  readonly includes: readonly ("header" | "sidebar" | "footer" | "command-palette" | "breadcrumbs")[];
  readonly navigationType: "primary" | "sidebar" | "minimal" | "none";
}

export const LAYOUT_REGISTRY: Record<LayoutId, LayoutDefinition> = {
  root: {
    id: "root",
    label: "Root Layout",
    description: "Global HTML shell, fonts, providers, metadata",
    routeGroup: "",
    appPath: "src/app/layout.tsx",
    includes: [],
    navigationType: "none",
  },
  "public-website": {
    id: "public-website",
    label: "Public Website",
    description: "Marketing pages, content, and legal surfaces",
    routeGroup: "(public)",
    appPath: "src/app/(public)/layout.tsx",
    includes: ["header", "footer", "command-palette"],
    navigationType: "primary",
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    description: "Vehicle search, listings, and dealer discovery",
    routeGroup: "(marketplace)",
    appPath: "src/app/(marketplace)/layout.tsx",
    includes: ["header", "footer", "command-palette", "breadcrumbs"],
    navigationType: "primary",
  },
  "buyer-portal": {
    id: "buyer-portal",
    label: "Buyer Portal",
    description: "Authenticated buyer account surfaces",
    routeGroup: "(buyer)",
    appPath: "src/app/(buyer)/layout.tsx",
    includes: ["header", "sidebar", "command-palette", "breadcrumbs"],
    navigationType: "sidebar",
  },
  "dealer-portal": {
    id: "dealer-portal",
    label: "Dealer Portal",
    description: "Dealer Command Centre with full operations navigation",
    routeGroup: "(dealer)",
    appPath: "src/app/(dealer)/layout.tsx",
    includes: ["header", "sidebar", "command-palette", "breadcrumbs"],
    navigationType: "sidebar",
  },
  "operations-portal": {
    id: "operations-portal",
    label: "Operations Centre",
    description: "SURF FOR CARS internal operations workspace",
    routeGroup: "(operations)",
    appPath: "src/app/(operations)/layout.tsx",
    includes: ["header", "sidebar", "command-palette", "breadcrumbs"],
    navigationType: "sidebar",
  },
  "admin-portal": {
    id: "admin-portal",
    label: "Administration",
    description: "Platform administration and governance",
    routeGroup: "(admin)",
    appPath: "src/app/(admin)/layout.tsx",
    includes: ["header", "sidebar", "command-palette", "breadcrumbs"],
    navigationType: "sidebar",
  },
  "developer-portal": {
    id: "developer-portal",
    label: "Developer Portal",
    description: "API keys, webhooks, and integration tooling",
    routeGroup: "(developer)",
    appPath: "src/app/(developer)/layout.tsx",
    includes: ["header", "sidebar", "command-palette"],
    navigationType: "sidebar",
  },
  authentication: {
    id: "authentication",
    label: "Authentication",
    description: "Sign in, sign up, and account recovery flows",
    routeGroup: "(auth)",
    appPath: "src/app/(auth)/layout.tsx",
    includes: [],
    navigationType: "minimal",
  },
  settings: {
    id: "settings",
    label: "Settings",
    description: "Nested settings layout within each portal",
    routeGroup: "*/settings",
    appPath: "src/app/*/settings/layout.tsx",
    includes: ["breadcrumbs"],
    navigationType: "sidebar",
  },
  "empty-state": {
    id: "empty-state",
    label: "Empty State",
    description: "Reusable empty state wrapper — no navigation chrome",
    routeGroup: "n/a",
    appPath: "src/components/layout/empty-state-layout.tsx",
    includes: [],
    navigationType: "none",
  },
  error: {
    id: "error",
    label: "Error Pages",
    description: "404, 403, 500, and maintenance surfaces",
    routeGroup: "n/a",
    appPath: "src/app/error.tsx, src/app/not-found.tsx",
    includes: ["header"],
    navigationType: "minimal",
  },
  loading: {
    id: "loading",
    label: "Loading States",
    description: "Route-level and component-level loading shells",
    routeGroup: "n/a",
    appPath: "src/app/loading.tsx",
    includes: [],
    navigationType: "none",
  },
};

export const PORTAL_LAYOUT_MAP = {
  public: "public-website",
  buyer: "buyer-portal",
  dealer: "dealer-portal",
  operations: "operations-portal",
  admin: "admin-portal",
  developer: "developer-portal",
  auth: "authentication",
} as const;

export const REUSABLE_LAYOUT_COMPONENTS = [
  "AppShell",
  "PublicHeader",
  "PublicFooter",
  "PortalSidebar",
  "PortalHeader",
  "SettingsLayout",
  "AuthLayout",
  "EmptyStateLayout",
  "ErrorLayout",
  "LoadingLayout",
  "MobileNavDrawer",
  "CommandPaletteProvider",
] as const;

export const REUSABLE_PROVIDERS = [
  "AppProviders",
  "AuthProvider",
  "ThemeProvider",
  "LocaleProvider",
  "CurrencyProvider",
  "CommandPaletteProvider",
  "NotificationProvider",
  "AnalyticsProvider",
  "FeatureFlagProvider",
] as const;

export const REUSABLE_SERVICES = [
  "AuthService",
  "VehicleService",
  "InventoryService",
  "SearchService",
  "DealerService",
  "BuyerService",
  "CrmService",
  "MediaService",
  "NotificationService",
  "AnalyticsService",
  "AiService",
  "SeoService",
  "BillingService",
  "AuditService",
  "ApiClient",
] as const;
