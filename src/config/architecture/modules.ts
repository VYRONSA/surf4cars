/**
 * SURF FOR CARS — Module Registry & Hierarchy
 */

export type ModuleTier = "core" | "shared" | "optional" | "platform";

export interface ModuleDefinition {
  readonly id: string;
  readonly label: string;
  readonly tier: ModuleTier;
  readonly featurePath: string;
  readonly description: string;
  readonly dependsOn: readonly string[];
}

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  authentication: {
    id: "authentication",
    label: "Authentication",
    tier: "core",
    featurePath: "src/features/authentication",
    description: "Identity, sessions, and access control",
    dependsOn: [],
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    tier: "core",
    featurePath: "src/features/marketplace",
    description: "Public vehicle discovery and browsing",
    dependsOn: ["search", "vehicle", "dealership"],
  },
  search: {
    id: "search",
    label: "Search",
    tier: "core",
    featurePath: "src/features/search",
    description: "Vehicle and dealer search infrastructure",
    dependsOn: ["vehicle"],
  },
  vehicle: {
    id: "vehicle",
    label: "Vehicle",
    tier: "core",
    featurePath: "src/features/vehicle",
    description: "Vehicle data model and detail surfaces",
    dependsOn: [],
  },
  dealership: {
    id: "dealership",
    label: "Dealership",
    tier: "core",
    featurePath: "src/features/dealership",
    description: "Dealer profiles and public presence",
    dependsOn: [],
  },
  inventory: {
    id: "inventory",
    label: "Inventory",
    tier: "core",
    featurePath: "src/features/inventory",
    description: "Dealer stock management",
    dependsOn: ["vehicle", "media"],
  },
  media: {
    id: "media",
    label: "Media",
    tier: "shared",
    featurePath: "src/features/media",
    description: "Asset storage, processing, and delivery",
    dependsOn: [],
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    tier: "shared",
    featurePath: "src/features/notifications",
    description: "In-app, email, and push notifications",
    dependsOn: ["authentication"],
  },
  settings: {
    id: "settings",
    label: "Settings",
    tier: "shared",
    featurePath: "src/features/settings",
    description: "User and organisation preferences",
    dependsOn: ["authentication"],
  },
  seo: {
    id: "seo",
    label: "SEO",
    tier: "shared",
    featurePath: "src/features/seo",
    description: "Search engine optimisation tooling",
    dependsOn: ["vehicle", "dealership"],
  },
  crm: {
    id: "crm",
    label: "CRM",
    tier: "shared",
    featurePath: "src/features/crm",
    description: "Lead and customer relationship management",
    dependsOn: ["authentication", "notifications"],
  },
  "buyer-portal": {
    id: "buyer-portal",
    label: "Buyer Portal",
    tier: "core",
    featurePath: "src/features/buyer-portal",
    description: "Buyer account and saved activity",
    dependsOn: ["authentication", "vehicle", "notifications"],
  },
  "dealer-command-centre": {
    id: "dealer-command-centre",
    label: "Dealer Command Centre",
    tier: "core",
    featurePath: "src/features/dealer-command-centre",
    description: "Dealer operations hub",
    dependsOn: ["inventory", "crm", "analytics", "media", "notifications", "settings"],
  },
  "marketing-studio": {
    id: "marketing-studio",
    label: "Marketing Studio",
    tier: "optional",
    featurePath: "src/features/marketing-studio",
    description: "Campaign and content creation",
    dependsOn: ["media", "inventory", "dealership"],
  },
  "ai-studio": {
    id: "ai-studio",
    label: "AI Studio",
    tier: "optional",
    featurePath: "src/features/ai-studio",
    description: "AI-powered growth tools",
    dependsOn: ["inventory", "media", "seo", "analytics"],
  },
  analytics: {
    id: "analytics",
    label: "Analytics",
    tier: "shared",
    featurePath: "src/features/analytics",
    description: "Performance intelligence",
    dependsOn: ["vehicle", "inventory", "crm"],
  },
  administration: {
    id: "administration",
    label: "Administration",
    tier: "platform",
    featurePath: "src/features/administration",
    description: "Platform governance",
    dependsOn: ["authentication", "dealership", "analytics"],
  },
  operations: {
    id: "operations",
    label: "Operations Centre",
    tier: "platform",
    featurePath: "src/features/operations",
    description: "Internal operating system for SURF staff",
    dependsOn: ["authentication", "dealership", "inventory", "analytics"],
  },
  developer: {
    id: "developer",
    label: "Developer",
    tier: "platform",
    featurePath: "src/features/developer",
    description: "API and integration tooling",
    dependsOn: ["authentication"],
  },
};

export const MODULE_HIERARCHY = {
  platform: {
    label: "Platform Layer",
    modules: ["administration", "operations", "developer", "authentication"],
  },
  core: {
    label: "Core Business Layer",
    modules: [
      "marketplace",
      "vehicle",
      "dealership",
      "inventory",
      "search",
      "buyer-portal",
      "dealer-command-centre",
    ],
  },
  growth: {
    label: "Growth Layer",
    modules: ["marketing-studio", "ai-studio", "seo", "analytics"],
  },
  shared: {
    label: "Shared Services Layer",
    modules: ["media", "crm", "notifications", "settings"],
  },
} as const;

export function getModulesByTier(tier: ModuleTier): readonly ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY).filter((m) => m.tier === tier);
}

export function getModuleDependencies(moduleId: string): readonly string[] {
  const visited = new Set<string>();
  const queue = [...(MODULE_REGISTRY[moduleId]?.dependsOn ?? [])];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const deps = MODULE_REGISTRY[current]?.dependsOn ?? [];
    queue.push(...deps);
  }

  return [...visited];
}
