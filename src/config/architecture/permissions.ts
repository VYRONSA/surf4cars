/**
 * SURF FOR CARS — Permission Architecture
 *
 * Capability-based permission model.
 * Roles inherit permissions from parent roles in the hierarchy.
 */

import {
  getRoleInheritanceChain,
  type UserTypeId,
} from "./user-types";

export const PERMISSIONS = {
  // Public
  "public:browse": "Browse marketplace and public content",
  "public:search": "Search vehicles and dealers",

  // Buyer
  "buyer:dashboard:view": "View buyer dashboard",
  "buyer:saved:manage": "Manage saved vehicles and collections",
  "buyer:searches:manage": "Manage saved searches and alerts",
  "buyer:messages:read": "Read dealer messages",
  "buyer:messages:write": "Send dealer messages",
  "buyer:profile:manage": "Manage buyer profile and settings",
  "buyer:activity:view": "View buyer activity history",

  // Dealer — base
  "dealer:dashboard:view": "View dealer executive dashboard",
  "dealer:inventory:read": "View inventory",
  "dealer:inventory:write": "Create and edit inventory",
  "dealer:inventory:publish": "Publish and unpublish listings",
  "dealer:vehicle:manage": "Full vehicle manager access",
  "dealer:media:manage": "Manage media library",
  "dealer:leads:read": "View leads",
  "dealer:leads:manage": "Manage leads and lead centre",
  "dealer:crm:read": "View CRM",
  "dealer:crm:write": "Edit CRM records",
  "dealer:profile:manage": "Manage dealer public profile",
  "dealer:settings:view": "View dealer settings",
  "dealer:notifications:manage": "Manage notifications",

  // Dealer — marketing & AI
  "dealer:marketing:read": "View marketing studio",
  "dealer:marketing:write": "Create and manage campaigns",
  "dealer:ai:read": "View AI studio",
  "dealer:ai:write": "Use AI generation tools",
  "dealer:seo:manage": "Manage SEO centre",
  "dealer:website:manage": "Manage dealer website",

  // Dealer — analytics & reports
  "dealer:analytics:view": "View analytics dashboards",
  "dealer:reports:view": "View reports",
  "dealer:reports:export": "Export reports",

  // Dealer — organisation
  "dealer:team:view": "View team members",
  "dealer:team:manage": "Manage team members and roles",
  "dealer:branches:view": "View branches",
  "dealer:branches:manage": "Manage branches",
  "dealer:brand:manage": "Manage brand assets",
  "dealer:documents:manage": "Manage documents",
  "dealer:billing:view": "View billing",
  "dealer:billing:manage": "Manage billing and subscriptions",
  "dealer:audit:view": "View dealer audit logs",

  // Admin
  "admin:dealers:manage": "Manage all dealerships",
  "admin:users:manage": "Manage all users",
  "admin:subscriptions:manage": "Manage subscriptions and packages",
  "admin:support:manage": "Manage support tickets",
  "admin:moderation:manage": "Content moderation",
  "admin:cms:manage": "Platform CMS",
  "admin:advertising:manage": "Advertising and featured listings",
  "admin:seo:manage": "Platform SEO",
  "admin:analytics:view": "Platform analytics",
  "admin:health:view": "Platform health monitoring",
  "admin:ai-usage:view": "AI usage monitoring",
  "admin:settings:manage": "System settings",
  "admin:audit:view": "Platform audit logs",
  "admin:developer:access": "Access developer tools from admin",

  // Developer
  "developer:api-keys:manage": "Manage API keys",
  "developer:webhooks:manage": "Manage webhooks",
  "developer:logs:view": "View API logs",
  "developer:flags:manage": "Manage feature flags",
  "developer:jobs:view": "View background jobs",
  "developer:queue:monitor": "Monitor job queues",
  "developer:docs:view": "View API documentation",
  "developer:env:view": "View environment configuration",
  "developer:monitoring:view": "View monitoring dashboards",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<UserTypeId, readonly Permission[]> = {
  "public-visitor": ["public:browse", "public:search"],
  buyer: [
    "public:browse",
    "public:search",
    "buyer:dashboard:view",
    "buyer:saved:manage",
    "buyer:searches:manage",
    "buyer:messages:read",
    "buyer:messages:write",
    "buyer:profile:manage",
    "buyer:activity:view",
  ],
  dealer: [
    "dealer:dashboard:view",
    "dealer:inventory:read",
    "dealer:leads:read",
    "dealer:crm:read",
    "dealer:profile:manage",
    "dealer:settings:view",
    "dealer:notifications:manage",
    "dealer:media:manage",
  ],
  salesperson: [
    "dealer:inventory:write",
    "dealer:leads:manage",
    "dealer:crm:write",
    "dealer:marketing:read",
    "dealer:analytics:view",
  ],
  "branch-manager": [
    "dealer:inventory:publish",
    "dealer:vehicle:manage",
    "dealer:marketing:write",
    "dealer:ai:read",
    "dealer:seo:manage",
    "dealer:reports:view",
    "dealer:team:view",
    "dealer:branches:view",
    "dealer:audit:view",
  ],
  "dealer-owner": [
    "dealer:ai:write",
    "dealer:website:manage",
    "dealer:reports:export",
    "dealer:team:manage",
    "dealer:branches:manage",
    "dealer:brand:manage",
    "dealer:documents:manage",
    "dealer:billing:view",
    "dealer:billing:manage",
  ],
  "platform-administrator": [
    "admin:dealers:manage",
    "admin:users:manage",
    "admin:subscriptions:manage",
    "admin:support:manage",
    "admin:moderation:manage",
    "admin:cms:manage",
    "admin:advertising:manage",
    "admin:seo:manage",
    "admin:analytics:view",
    "admin:health:view",
    "admin:ai-usage:view",
    "admin:settings:manage",
    "admin:audit:view",
    "admin:developer:access",
  ],
  developer: [
    "developer:api-keys:manage",
    "developer:webhooks:manage",
    "developer:logs:view",
    "developer:flags:manage",
    "developer:jobs:view",
    "developer:queue:monitor",
    "developer:docs:view",
    "developer:env:view",
    "developer:monitoring:view",
  ],
};

export function getEffectivePermissions(userType: UserTypeId): readonly Permission[] {
  const chain = getRoleInheritanceChain(userType);
  const permissions = new Set<Permission>();

  for (const role of chain) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      permissions.add(permission);
    }
  }

  return [...permissions];
}

export function hasPermission(
  userType: UserTypeId,
  permission: Permission,
): boolean {
  return getEffectivePermissions(userType).includes(permission);
}

export function hasAnyPermission(
  userType: UserTypeId,
  permissions: readonly Permission[],
): boolean {
  const effective = getEffectivePermissions(userType);
  return permissions.some((p) => effective.includes(p));
}

export function hasAllPermissions(
  userType: UserTypeId,
  permissions: readonly Permission[],
): boolean {
  const effective = getEffectivePermissions(userType);
  return permissions.every((p) => effective.includes(p));
}
