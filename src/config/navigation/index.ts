/**
 * SURF FOR CARS — Navigation (legacy re-export)
 * @deprecated Import from @/config/architecture instead
 */
export {
  getRouteById as getLegacyRouteById,
  navigationRoutes,
  NAV_SECTIONS,
  getRoutesBySection,
} from "@/config/navigation/routes";

export type {
  NavAccessLevel,
  NavRoute,
  NavSection,
} from "@/config/navigation/routes";

// Canonical architecture exports
export {
  ALL_ROUTES,
  getRouteById,
  getRoutesByPortal,
  getNavigationForUserType,
  NAVIGATION_BY_USER_TYPE,
} from "@/config/architecture";
