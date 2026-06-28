/**
 * SURF FOR CARS — Navigation Architecture
 *
 * Defines the complete route hierarchy for the platform.
 * This is the single source of truth for navigation planning.
 * No pages are built here — only architectural definitions.
 */

export type NavSection =
  | "public"
  | "marketplace"
  | "vehicle"
  | "dealer"
  | "buyer"
  | "dealer-command-centre"
  | "administration"
  | "developer"
  | "authentication";

export type NavAccessLevel =
  | "public"
  | "authenticated"
  | "dealer"
  | "buyer"
  | "admin"
  | "developer";

export interface NavRoute {
  readonly id: string;
  readonly path: string;
  readonly label: string;
  readonly section: NavSection;
  readonly access: NavAccessLevel;
  readonly feature?: string;
  readonly description?: string;
  readonly children?: readonly NavRoute[];
  readonly seoIndexable?: boolean;
}

export const NAV_SECTIONS = {
  public: {
    id: "public",
    label: "Public",
    description: "Marketing and unauthenticated surfaces",
    routeGroup: "(public)",
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    description: "Vehicle discovery and browsing",
    routeGroup: "(marketplace)",
  },
  vehicle: {
    id: "vehicle",
    label: "Vehicle",
    description: "Individual vehicle detail surfaces",
    routeGroup: "(marketplace)/vehicles",
  },
  dealer: {
    id: "dealer",
    label: "Dealer",
    description: "Public dealer profile surfaces",
    routeGroup: "(marketplace)/dealers",
  },
  buyer: {
    id: "buyer",
    label: "Buyer Portal",
    description: "Buyer account and saved vehicles",
    routeGroup: "(buyer)",
  },
  dealerCommandCentre: {
    id: "dealer-command-centre",
    label: "Dealer Command Centre",
    description: "Dealer operations hub",
    routeGroup: "(dealer)",
  },
  administration: {
    id: "administration",
    label: "Administration",
    description: "Platform administration",
    routeGroup: "(admin)",
  },
  developer: {
    id: "developer",
    label: "Developer",
    description: "API keys, webhooks, and integrations",
    routeGroup: "(developer)",
  },
  authentication: {
    id: "authentication",
    label: "Authentication",
    description: "Sign in, sign up, and account recovery",
    routeGroup: "(auth)",
  },
} as const;

export const navigationRoutes: readonly NavRoute[] = [
  {
    id: "home",
    path: "/",
    label: "Home",
    section: "public",
    access: "public",
    seoIndexable: true,
  },
  {
    id: "marketplace",
    path: "/marketplace",
    label: "Marketplace",
    section: "marketplace",
    access: "public",
    feature: "marketplace",
    seoIndexable: true,
    children: [
      {
        id: "marketplace-search",
        path: "/marketplace/search",
        label: "Search",
        section: "marketplace",
        access: "public",
        feature: "search",
      },
    ],
  },
  {
    id: "vehicle-detail",
    path: "/vehicles/[slug]",
    label: "Vehicle Detail",
    section: "vehicle",
    access: "public",
    feature: "vehicle",
    seoIndexable: true,
  },
  {
    id: "dealer-profile",
    path: "/dealers/[slug]",
    label: "Dealer Profile",
    section: "dealer",
    access: "public",
    feature: "dealership",
    seoIndexable: true,
  },
  {
    id: "buyer-portal",
    path: "/buyer",
    label: "Buyer Portal",
    section: "buyer",
    access: "buyer",
    feature: "buyer-portal",
    children: [
      {
        id: "buyer-saved",
        path: "/buyer/saved",
        label: "Saved Vehicles",
        section: "buyer",
        access: "buyer",
        feature: "buyer-portal",
      },
      {
        id: "buyer-enquiries",
        path: "/buyer/enquiries",
        label: "Enquiries",
        section: "buyer",
        access: "buyer",
        feature: "buyer-portal",
      },
    ],
  },
  {
    id: "dealer-command-centre",
    path: "/dealer",
    label: "Command Centre",
    section: "dealer-command-centre",
    access: "dealer",
    feature: "dealer-command-centre",
    children: [
      {
        id: "dealer-inventory",
        path: "/dealer/inventory",
        label: "Inventory",
        section: "dealer-command-centre",
        access: "dealer",
        feature: "inventory",
      },
      {
        id: "dealer-marketing",
        path: "/dealer/marketing",
        label: "Marketing Studio",
        section: "dealer-command-centre",
        access: "dealer",
        feature: "marketing-studio",
      },
      {
        id: "dealer-ai",
        path: "/dealer/ai",
        label: "AI Studio",
        section: "dealer-command-centre",
        access: "dealer",
        feature: "ai-studio",
      },
      {
        id: "dealer-analytics",
        path: "/dealer/analytics",
        label: "Analytics",
        section: "dealer-command-centre",
        access: "dealer",
        feature: "analytics",
      },
      {
        id: "dealer-crm",
        path: "/dealer/crm",
        label: "CRM",
        section: "dealer-command-centre",
        access: "dealer",
        feature: "crm",
      },
      {
        id: "dealer-media",
        path: "/dealer/media",
        label: "Media",
        section: "dealer-command-centre",
        access: "dealer",
        feature: "media",
      },
      {
        id: "dealer-seo",
        path: "/dealer/seo",
        label: "SEO",
        section: "dealer-command-centre",
        access: "dealer",
        feature: "seo",
      },
      {
        id: "dealer-settings",
        path: "/dealer/settings",
        label: "Settings",
        section: "dealer-command-centre",
        access: "dealer",
        feature: "settings",
      },
      {
        id: "dealer-notifications",
        path: "/dealer/notifications",
        label: "Notifications",
        section: "dealer-command-centre",
        access: "dealer",
        feature: "notifications",
      },
    ],
  },
  {
    id: "administration",
    path: "/admin",
    label: "Administration",
    section: "administration",
    access: "admin",
    feature: "administration",
    children: [
      {
        id: "admin-dealers",
        path: "/admin/dealers",
        label: "Dealers",
        section: "administration",
        access: "admin",
        feature: "administration",
      },
      {
        id: "admin-users",
        path: "/admin/users",
        label: "Users",
        section: "administration",
        access: "admin",
        feature: "administration",
      },
    ],
  },
  {
    id: "developer",
    path: "/developer",
    label: "Developer",
    section: "developer",
    access: "developer",
    feature: "developer",
    children: [
      {
        id: "developer-api-keys",
        path: "/developer/api-keys",
        label: "API Keys",
        section: "developer",
        access: "developer",
        feature: "developer",
      },
      {
        id: "developer-webhooks",
        path: "/developer/webhooks",
        label: "Webhooks",
        section: "developer",
        access: "developer",
        feature: "developer",
      },
    ],
  },
  {
    id: "authentication",
    path: "/auth",
    label: "Authentication",
    section: "authentication",
    access: "public",
    feature: "authentication",
    children: [
      {
        id: "auth-sign-in",
        path: "/auth/sign-in",
        label: "Sign In",
        section: "authentication",
        access: "public",
        feature: "authentication",
      },
      {
        id: "auth-sign-up",
        path: "/auth/sign-up",
        label: "Sign Up",
        section: "authentication",
        access: "public",
        feature: "authentication",
      },
      {
        id: "auth-forgot-password",
        path: "/auth/forgot-password",
        label: "Forgot Password",
        section: "authentication",
        access: "public",
        feature: "authentication",
      },
    ],
  },
] as const;

export function getRoutesBySection(
  section: NavSection,
): readonly NavRoute[] {
  return navigationRoutes.filter((route) => route.section === section);
}

export function getRouteById(id: string): NavRoute | undefined {
  const findRoute = (routes: readonly NavRoute[]): NavRoute | undefined => {
    for (const route of routes) {
      if (route.id === id) return route;
      if (route.children) {
        const found = findRoute(route.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return findRoute(navigationRoutes);
}
