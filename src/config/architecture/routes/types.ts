/**
 * SURF FOR CARS — Route Definition Types
 */

import type { Permission } from "../permissions";
import type { PortalId, UserTypeId } from "../user-types";

export type RouteGroup =
  | "(public)"
  | "(marketplace)"
  | "(buyer)"
  | "(dealer)"
  | "(admin)"
  | "(developer)"
  | "(auth)"
  | "(api)";

export type RouteModule =
  | "public"
  | "marketplace"
  | "buyer-portal"
  | "dealer-command-centre"
  | "marketing-studio"
  | "ai-studio"
  | "analytics"
  | "administration"
  | "developer"
  | "authentication"
  | "settings"
  | "system";

export interface RouteDefinition {
  readonly id: string;
  readonly path: string;
  readonly label: string;
  readonly module: RouteModule;
  readonly portal: PortalId;
  readonly routeGroup: RouteGroup;
  readonly feature?: string;
  readonly description?: string;
  readonly permissions?: readonly Permission[];
  readonly allowedRoles?: readonly UserTypeId[];
  readonly seoIndexable?: boolean;
  readonly apiExposed?: boolean;
  readonly mobileSupported?: boolean;
  readonly children?: readonly RouteDefinition[];
}

export interface RouteManifest {
  readonly id: string;
  readonly label: string;
  readonly routes: readonly RouteDefinition[];
}
