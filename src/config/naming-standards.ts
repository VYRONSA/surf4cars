/**
 * SURF FOR CARS — Naming Standards
 *
 * Consistent naming conventions enforced across the codebase.
 */

export const namingStandards = {
  folders: {
    convention: "kebab-case",
    examples: ["dealer-command-centre", "marketing-studio", "buyer-portal"],
    rules: [
      "Use kebab-case for all folder names",
      "Feature modules live in src/features/{feature-name}",
      "Co-locate feature assets within the feature folder",
      "Shared code lives outside features in top-level directories",
    ],
  },
  components: {
    convention: "PascalCase",
    filePattern: "{ComponentName}.tsx",
    examples: ["VehicleCard.tsx", "DealerSidebar.tsx", "SearchFilters.tsx"],
    rules: [
      "One component per file",
      "File name matches the exported component name",
      "UI primitives in src/components/ui",
      "Layout shells in src/components/layout",
      "Feature-specific components in src/features/{feature}/components",
    ],
  },
  hooks: {
    convention: "camelCase with use prefix",
    filePattern: "use{HookName}.ts",
    examples: ["useVehicleSearch.ts", "useDealerAuth.ts", "useMediaUpload.ts"],
    rules: [
      "Shared hooks in src/hooks",
      "Feature hooks in src/features/{feature}/hooks",
      "Always prefix with use",
    ],
  },
  utilities: {
    convention: "camelCase",
    filePattern: "{utilityName}.ts",
    examples: ["formatCurrency.ts", "parseVehicleSlug.ts", "cn.ts"],
    rules: [
      "Pure functions only — no side effects",
      "Shared utilities in src/utils",
      "One primary export per utility file",
    ],
  },
  types: {
    convention: "PascalCase",
    filePattern: "{domain}.types.ts or {domain}.ts",
    examples: ["vehicle.types.ts", "dealer.types.ts", "api.types.ts"],
    rules: [
      "Shared types in src/types",
      "Feature types in src/features/{feature}/types",
      "Use .types.ts suffix for type-only files",
    ],
  },
  constants: {
    convention: "SCREAMING_SNAKE_CASE for values, camelCase for files",
    filePattern: "{domain}.constants.ts",
    examples: ["APP_NAME", "MAX_UPLOAD_SIZE", "DEFAULT_PAGE_SIZE"],
    rules: [
      "Shared constants in src/constants",
      "Group by domain (routes, api, app)",
      "Export as const for type inference",
    ],
  },
  interfaces: {
    convention: "PascalCase with descriptive suffix",
    examples: ["VehicleDTO", "DealerProfile", "NavRoute", "ApiResponse"],
    rules: [
      "No I-prefix (use Vehicle, not IVehicle)",
      "DTO suffix for data transfer objects",
      "Props suffix for React component props",
      "Config suffix for configuration objects",
    ],
  },
  stores: {
    convention: "camelCase with Store suffix",
    filePattern: "use{Domain}Store.ts",
    examples: ["useAuthStore.ts", "useDealerStore.ts", "useUiStore.ts"],
    rules: [
      "All stores in src/store",
      "One store per domain",
      "Use Zustand or equivalent when implemented",
    ],
  },
  routes: {
    convention: "kebab-case URL segments",
    examples: ["/dealer/inventory", "/auth/sign-in", "/vehicle/[slug]"],
    rules: [
      "Route definitions in src/config/navigation",
      "Dynamic segments use [param] syntax",
      "Route groups use (group) syntax in app directory",
      "Never use camelCase in URL paths",
    ],
  },
} as const;

export type NamingStandards = typeof namingStandards;
