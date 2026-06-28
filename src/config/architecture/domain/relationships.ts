/**
 * SURF FOR CARS — Domain Relationships
 *
 * Cross-domain relationship map for the enterprise data model.
 */

import type { DomainId, DomainRelationship } from "./types";

export const DOMAIN_RELATIONSHIPS: readonly DomainRelationship[] = [
  { from: "platform", to: "organizations", type: "owns", description: "Platform hosts all dealer organisations" },
  { from: "organizations", to: "branches", type: "owns", description: "Dealerships contain branches" },
  { from: "organizations", to: "billing", type: "owns", description: "Dealership is billing tenant" },
  { from: "users", to: "organizations", type: "references", description: "Users belong to dealerships via membership" },
  { from: "roles-permissions", to: "users", type: "extends", description: "Roles assigned to users within org scope" },
  { from: "vehicles", to: "organizations", type: "owns", description: "Vehicles owned by dealership, scoped to branch" },
  { from: "vehicles", to: "vehicle-specifications", type: "owns", description: "Vehicle has specification data" },
  { from: "vehicles", to: "media", type: "references", description: "Vehicle links to media assets" },
  { from: "inventory", to: "vehicles", type: "references", description: "Inventory item wraps vehicle listing" },
  { from: "marketing", to: "vehicles", type: "references", description: "Campaigns feature vehicles" },
  { from: "marketing", to: "media", type: "references", description: "Marketing uses media assets" },
  { from: "ai", to: "vehicles", type: "reads-from", description: "AI analyses vehicle listings" },
  { from: "ai", to: "marketing", type: "emits-events-to", description: "AI generates marketing content" },
  { from: "search", to: "vehicles", type: "reads-from", description: "Search indexes vehicle data" },
  { from: "search", to: "organizations", type: "reads-from", description: "Search indexes dealer profiles" },
  { from: "analytics", to: "vehicles", type: "reads-from", description: "Analytics aggregates vehicle metrics" },
  { from: "analytics", to: "marketing", type: "reads-from", description: "Analytics tracks campaign performance" },
  { from: "crm", to: "buyer", type: "references", description: "Leads link to buyer profiles" },
  { from: "crm", to: "vehicles", type: "references", description: "Leads reference vehicles of interest" },
  { from: "messaging", to: "crm", type: "emits-events-to", description: "Messages create CRM activities" },
  { from: "notifications", to: "users", type: "references", description: "Notifications delivered to users" },
  { from: "billing", to: "subscriptions", type: "owns", description: "Billing manages subscriptions" },
  { from: "billing", to: "ai", type: "reads-from", description: "Billing meters AI usage" },
  { from: "reviews", to: "buyer", type: "references", description: "Reviews authored by buyers" },
  { from: "reviews", to: "dealer", type: "references", description: "Reviews target dealers or vehicles" },
  { from: "content", to: "seo", type: "emits-events-to", description: "Content generates SEO pages" },
  { from: "administration", to: "organizations", type: "owns", description: "Admin manages all dealers" },
  { from: "developer", to: "organizations", type: "references", description: "API keys scoped to dealership" },
  { from: "audit", to: "platform", type: "references", description: "Audit logs all platform actions" },
];

export const ENTITY_OWNERSHIP_MAP = {
  platformScoped: [
    "Platform", "PlatformConfiguration", "FeatureFlag",
    "ContentArticle", "Collection", "SearchIndex",
    "ModerationCase", "FeaturedListing", "AuditLog",
  ],
  dealershipScoped: [
    "Dealership", "Branch", "Department", "Team",
    "Vehicle", "InventoryItem", "Campaign", "Lead",
    "Pipeline", "Subscription", "ApiKey", "BrandAsset",
    "AiJob", "MetricSnapshot",
  ],
  branchScoped: [
    "InventoryItem (allocation)", "Lead (assignment)",
    "MetricSnapshot (branch)", "UserMembership (optional)",
  ],
  buyerScoped: [
    "BuyerProfile", "SavedVehicle", "SavedSearch",
    "PriceAlert", "RecentlyViewed", "Review", "Conversation (participant)",
  ],
  userScoped: [
    "User", "UserProfile", "UserSettings", "Identity",
    "Session", "Notification", "NotificationPreference",
  ],
} as const;

export const DOMAIN_DEPENDENCY_GRAPH = {
  layers: [
    {
      layer: 0,
      label: "Foundation",
      domains: ["platform", "identity", "audit", "system"] as DomainId[],
    },
    {
      layer: 1,
      label: "Organisation & Users",
      domains: ["organizations", "branches", "users", "roles-permissions", "settings"] as DomainId[],
    },
    {
      layer: 2,
      label: "Core Commerce",
      domains: ["vehicles", "vehicle-specifications", "inventory", "media", "buyer", "dealer"] as DomainId[],
    },
    {
      layer: 3,
      label: "Growth & Discovery",
      domains: ["search", "seo", "marketing", "content", "reviews"] as DomainId[],
    },
    {
      layer: 4,
      label: "Intelligence & Operations",
      domains: ["crm", "messaging", "analytics", "ai", "notifications"] as DomainId[],
    },
    {
      layer: 5,
      label: "Commercial & Platform",
      domains: ["subscriptions", "billing", "administration", "developer"] as DomainId[],
    },
  ],
} as const;
