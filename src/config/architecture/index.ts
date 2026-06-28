/**
 * SURF FOR CARS — Architecture Blueprint
 *
 * Master export for all information architecture definitions.
 * This is the single source of truth for application structure.
 */

export { APPLICATION_MAP, type ApplicationSectionId } from "./application-map";
export {
  LAYOUT_REGISTRY,
  PORTAL_LAYOUT_MAP,
  REUSABLE_LAYOUT_COMPONENTS,
  REUSABLE_PROVIDERS,
  REUSABLE_SERVICES,
  type LayoutDefinition,
  type LayoutId,
} from "./layouts";
export {
  MODULE_HIERARCHY,
  MODULE_REGISTRY,
  getModuleDependencies,
  getModulesByTier,
  type ModuleDefinition,
  type ModuleTier,
} from "./modules";
export {
  BREADCRUMB_STRATEGY,
  GLOBAL_SEARCH,
  NAVIGATION_BY_USER_TYPE,
  getNavigationForUserType,
  type NavItem,
  type NavigationConfig,
  type NavigationLayer,
} from "./navigation";
export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getEffectivePermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type Permission,
} from "./permissions";
export {
  ALL_ROUTES,
  APPLICATION_ROUTES,
  ROUTE_MANIFESTS,
  adminRoutes,
  apiRoutes,
  authRoutes,
  buyerRoutes,
  dealerRoutes,
  developerRoutes,
  getApiRoutes,
  getMobileRoutes,
  getRouteById,
  getRoutesByFeature,
  getRoutesByModule,
  getRoutesByPortal,
  getSeoRoutes,
  publicRoutes,
  systemRoutes,
  type RouteDefinition,
  type RouteGroup,
  type RouteManifest,
  type RouteModule,
} from "./routes";
export { FUTURE_EXPANSION, SCALABILITY_ARCHITECTURE } from "./scalability";
export {
  USER_TYPES,
  USER_TYPE_IDS,
  getRoleInheritanceChain,
  getUserTypeById,
  type PortalId,
  type UserTypeDefinition,
  type UserTypeId,
} from "./user-types";

// Domain & data architecture
export * from "./domain";
