import { adminRoutes } from "./admin.routes";
import { authRoutes, systemRoutes } from "./auth.routes";
import { buyerRoutes } from "./buyer.routes";
import { apiRoutes, developerRoutes } from "./developer.routes";
import { dealerRoutes } from "./dealer.routes";
import { publicRoutes } from "./public.routes";
import type { RouteDefinition, RouteManifest } from "./types";

export const ROUTE_MANIFESTS: readonly RouteManifest[] = [
  publicRoutes,
  buyerRoutes,
  dealerRoutes,
  adminRoutes,
  developerRoutes,
  apiRoutes,
  authRoutes,
  systemRoutes,
] as const;

export const APPLICATION_ROUTES: readonly RouteDefinition[] = ROUTE_MANIFESTS.flatMap(
  (manifest) => manifest.routes,
);

function flattenRoutes(
  routes: readonly RouteDefinition[],
  accumulator: RouteDefinition[] = [],
): RouteDefinition[] {
  for (const route of routes) {
    accumulator.push(route);
    if (route.children) {
      flattenRoutes(route.children, accumulator);
    }
  }
  return accumulator;
}

export const ALL_ROUTES: readonly RouteDefinition[] = flattenRoutes(APPLICATION_ROUTES);

export function getRouteById(id: string): RouteDefinition | undefined {
  return ALL_ROUTES.find((route) => route.id === id);
}

export function getRoutesByPortal(portal: RouteDefinition["portal"]): readonly RouteDefinition[] {
  return ALL_ROUTES.filter((route) => route.portal === portal);
}

export function getRoutesByModule(module: RouteDefinition["module"]): readonly RouteDefinition[] {
  return ALL_ROUTES.filter((route) => route.module === module);
}

export function getRoutesByFeature(feature: string): readonly RouteDefinition[] {
  return ALL_ROUTES.filter((route) => route.feature === feature);
}

export function getApiRoutes(): readonly RouteDefinition[] {
  return ALL_ROUTES.filter((route) => route.apiExposed);
}

export function getMobileRoutes(): readonly RouteDefinition[] {
  return ALL_ROUTES.filter((route) => route.mobileSupported);
}

export function getSeoRoutes(): readonly RouteDefinition[] {
  return ALL_ROUTES.filter((route) => route.seoIndexable);
}

export * from "./types";
export {
  adminRoutes,
  apiRoutes,
  authRoutes,
  buyerRoutes,
  dealerRoutes,
  developerRoutes,
  publicRoutes,
  systemRoutes,
};
