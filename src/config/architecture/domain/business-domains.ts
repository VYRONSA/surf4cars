/**
 * SURF FOR CARS — Business Domains
 *
 * Complete domain decomposition with responsibilities and boundaries.
 */

import type { DomainDefinition, DomainId } from "./types";

export const BUSINESS_DOMAINS: Record<DomainId, DomainDefinition> = {
  platform: {
    id: "platform",
    label: "Platform",
    description: "Core platform configuration, tenancy, and global policies",
    responsibilities: [
      "Multi-tenant platform boundaries",
      "Global configuration and feature availability",
      "Regional deployment policies",
      "Platform-wide defaults and limits",
    ],
    rootEntities: ["Platform", "PlatformRegion", "PlatformConfiguration"],
    dependsOn: [],
    consumedBy: ["organizations", "administration", "system"],
  },
  identity: {
    id: "identity",
    label: "Identity",
    description: "Authentication, sessions, and identity federation",
    responsibilities: [
      "User authentication and session management",
      "OAuth and SSO integration",
      "MFA and security policies",
      "Identity provider abstraction",
    ],
    rootEntities: ["Identity", "Session", "AuthProvider"],
    dependsOn: ["platform"],
    consumedBy: ["users", "developer", "buyer", "dealer"],
  },
  organizations: {
    id: "organizations",
    label: "Organizations",
    description: "Dealer group and dealership organisational hierarchy",
    responsibilities: [
      "Dealer group and dealership records",
      "Organisational hierarchy management",
      "Tenancy scoping for all dealer data",
      "Onboarding and verification workflows",
    ],
    rootEntities: ["DealerGroup", "Dealership"],
    dependsOn: ["platform", "identity"],
    consumedBy: ["branches", "billing", "dealer", "administration"],
  },
  branches: {
    id: "branches",
    label: "Branches",
    description: "Physical and logical branch locations within a dealership",
    responsibilities: [
      "Branch locations and operating hours",
      "Branch-scoped inventory and team assignment",
      "Single-branch and multi-branch dealer support",
      "Branch-level analytics aggregation",
    ],
    rootEntities: ["Branch", "Department"],
    dependsOn: ["organizations"],
    consumedBy: ["inventory", "users", "analytics", "crm"],
  },
  users: {
    id: "users",
    label: "Users",
    description: "All human users across buyer, dealer, and platform contexts",
    responsibilities: [
      "User profiles and preferences",
      "User-to-organisation membership",
      "Invitation and onboarding flows",
      "Cross-portal user identity linking",
    ],
    rootEntities: ["User", "UserProfile", "UserMembership"],
    dependsOn: ["identity", "organizations"],
    consumedBy: ["roles-permissions", "buyer", "dealer", "crm", "notifications"],
  },
  "roles-permissions": {
    id: "roles-permissions",
    label: "Roles & Permissions",
    description: "Role-based access control and permission inheritance",
    responsibilities: [
      "Role definitions and inheritance chains",
      "Permission assignment and enforcement",
      "Branch and department scoped roles",
      "Future role extensibility",
    ],
    rootEntities: ["Role", "Permission", "RoleAssignment"],
    dependsOn: ["users", "organizations", "branches"],
    consumedBy: ["administration", "dealer", "developer"],
  },
  inventory: {
    id: "inventory",
    label: "Inventory",
    description: "Dealer stock management and inventory operations",
    responsibilities: [
      "Stock intake and allocation",
      "Branch-level inventory assignment",
      "Stock ageing and turnover tracking",
      "Bulk import and syndication feeds",
    ],
    rootEntities: ["InventoryItem", "StockAllocation"],
    dependsOn: ["organizations", "branches", "vehicles"],
    consumedBy: ["search", "analytics", "marketing", "ai"],
  },
  vehicles: {
    id: "vehicles",
    label: "Vehicles",
    description: "Canonical vehicle record and lifecycle",
    responsibilities: [
      "Vehicle identity and VIN tracking",
      "Publishing and delisting workflows",
      "Pricing and status management",
      "Vehicle history and audit trail",
    ],
    rootEntities: ["Vehicle"],
    dependsOn: ["organizations", "branches"],
    consumedBy: [
      "vehicle-specifications",
      "media",
      "marketing",
      "search",
      "analytics",
      "reviews",
      "ai",
      "seo",
    ],
  },
  "vehicle-specifications": {
    id: "vehicle-specifications",
    label: "Vehicle Specifications",
    description: "Technical specifications, features, and options",
    responsibilities: [
      "Make, model, trim hierarchy",
      "Features, options, and equipment lists",
      "EV-specific attributes (battery, range, charging)",
      "Commercial and specialty vehicle attributes",
    ],
    rootEntities: ["VehicleSpecification", "VehicleFeature", "VehicleOption"],
    dependsOn: ["vehicles"],
    consumedBy: ["search", "ai", "analytics"],
  },
  media: {
    id: "media",
    label: "Media",
    description: "Asset storage, processing, and delivery",
    responsibilities: [
      "Image, video, and document assets",
      "Media processing pipelines",
      "CDN delivery and optimisation",
      "Brand asset libraries",
    ],
    rootEntities: ["MediaAsset", "MediaCollection"],
    dependsOn: ["platform"],
    consumedBy: ["vehicles", "marketing", "content", "dealer", "ai"],
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    description: "Campaign creation, scheduling, and publishing",
    responsibilities: [
      "Campaign and template management",
      "Social asset generation and publishing",
      "Content calendar and scheduling",
      "QR codes, posters, and video assets",
    ],
    rootEntities: ["Campaign", "MarketingTemplate", "BrandAsset"],
    dependsOn: ["vehicles", "media", "organizations"],
    consumedBy: ["analytics", "ai", "notifications"],
  },
  ai: {
    id: "ai",
    label: "AI",
    description: "AI job orchestration, results, and usage tracking",
    responsibilities: [
      "AI job queue and execution",
      "Model versioning and prompt management",
      "Result storage and confidence scoring",
      "Usage metering and cost tracking",
    ],
    rootEntities: ["AiJob", "AiRequest", "AiResult"],
    dependsOn: ["vehicles", "media", "marketing", "seo"],
    consumedBy: ["analytics", "billing", "administration"],
  },
  analytics: {
    id: "analytics",
    label: "Analytics",
    description: "Performance intelligence across all domains",
    responsibilities: [
      "Event aggregation and metrics",
      "Dealer, vehicle, and marketing performance",
      "Search and traffic analytics",
      "Historical trends and forecasting data",
    ],
    rootEntities: ["AnalyticsEvent", "MetricSnapshot", "ReportDefinition"],
    dependsOn: ["vehicles", "inventory", "marketing", "search", "crm"],
    consumedBy: ["administration", "dealer", "ai"],
  },
  crm: {
    id: "crm",
    label: "CRM",
    description: "Lead management, pipelines, and customer relationships",
    responsibilities: [
      "Lead capture and qualification",
      "Pipeline and task management",
      "Activity and communication history",
      "Appointment scheduling",
    ],
    rootEntities: ["Lead", "Pipeline", "CrmActivity"],
    dependsOn: ["users", "buyer", "vehicles", "organizations"],
    consumedBy: ["notifications", "analytics", "messaging"],
  },
  messaging: {
    id: "messaging",
    label: "Messaging",
    description: "Buyer-dealer and internal messaging",
    responsibilities: [
      "Conversation threads between buyers and dealers",
      "Message delivery and read receipts",
      "Internal team messaging (future)",
      "Message attachment handling",
    ],
    rootEntities: ["Conversation", "Message"],
    dependsOn: ["users", "buyer", "crm"],
    consumedBy: ["notifications"],
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    description: "Multi-channel notification delivery",
    responsibilities: [
      "Email, SMS, push, and in-app notifications",
      "Notification preferences and opt-outs",
      "Template management per channel",
      "Delivery tracking and retry logic",
    ],
    rootEntities: ["Notification", "NotificationPreference", "NotificationTemplate"],
    dependsOn: ["users", "identity"],
    consumedBy: ["marketing", "crm", "billing", "ai"],
  },
  subscriptions: {
    id: "subscriptions",
    label: "Subscriptions",
    description: "SaaS subscription plans and entitlements",
    responsibilities: [
      "Package and plan definitions",
      "Feature entitlements per plan",
      "Trial and upgrade workflows",
      "Subscription lifecycle management",
    ],
    rootEntities: ["SubscriptionPlan", "Subscription", "Entitlement"],
    dependsOn: ["organizations", "billing"],
    consumedBy: ["dealer", "administration", "ai"],
  },
  billing: {
    id: "billing",
    label: "Billing",
    description: "Invoicing, payments, and usage-based billing",
    responsibilities: [
      "Invoice generation and payment processing",
      "Usage metering for AI and API",
      "Coupons, add-ons, and renewals",
      "Multi-currency and tax handling",
    ],
    rootEntities: ["Invoice", "Payment", "UsageRecord"],
    dependsOn: ["organizations", "subscriptions"],
    consumedBy: ["administration", "ai"],
  },
  seo: {
    id: "seo",
    label: "SEO",
    description: "Search engine optimisation for vehicles, dealers, and content",
    responsibilities: [
      "Meta data and structured data",
      "Sitemap and canonical URL management",
      "SEO page generation",
      "AI-assisted SEO optimisation",
    ],
    rootEntities: ["SeoMetadata", "SeoPage", "StructuredData"],
    dependsOn: ["vehicles", "content", "organizations"],
    consumedBy: ["search", "ai", "marketing"],
  },
  search: {
    id: "search",
    label: "Search",
    description: "Vehicle, dealer, and content discovery",
    responsibilities: [
      "Search index management",
      "Filters, facets, and sorting",
      "Saved searches and collections",
      "Natural language and AI search (future)",
    ],
    rootEntities: ["SearchIndex", "SavedSearch", "Collection"],
    dependsOn: ["vehicles", "organizations", "content"],
    consumedBy: ["buyer", "analytics", "ai"],
  },
  buyer: {
    id: "buyer",
    label: "Buyer",
    description: "Buyer account, preferences, and activity",
    responsibilities: [
      "Buyer profiles and preferences",
      "Saved vehicles and collections",
      "Recently viewed and price alerts",
      "Buyer activity event stream",
    ],
    rootEntities: ["BuyerProfile", "SavedVehicle", "BuyerActivity"],
    dependsOn: ["users", "identity", "vehicles"],
    consumedBy: ["search", "messaging", "crm", "notifications"],
  },
  dealer: {
    id: "dealer",
    label: "Dealer",
    description: "Dealer public presence and operational profile",
    responsibilities: [
      "Public dealer profile and branding",
      "Dealer verification and trust signals",
      "Operating information and contact details",
      "Featured and promoted listings",
    ],
    rootEntities: ["DealerProfile", "DealerVerification"],
    dependsOn: ["organizations", "media"],
    consumedBy: ["search", "reviews", "marketing", "seo"],
  },
  reviews: {
    id: "reviews",
    label: "Reviews",
    description: "Dealer and vehicle reviews with moderation",
    responsibilities: [
      "Review submission and ratings",
      "Dealer responses and moderation",
      "Trust signals and verification",
      "Review aggregation and display",
    ],
    rootEntities: ["Review", "Rating", "ReviewResponse"],
    dependsOn: ["buyer", "dealer", "vehicles"],
    consumedBy: ["administration", "analytics", "search"],
  },
  content: {
    id: "content",
    label: "Content",
    description: "Editorial content — guides, articles, and news",
    responsibilities: [
      "Buying guides, articles, and news",
      "Categories, tags, and authors",
      "Publishing workflow and version history",
      "Content SEO and media embedding",
    ],
    rootEntities: ["ContentArticle", "ContentCategory", "Author"],
    dependsOn: ["media", "users"],
    consumedBy: ["seo", "search", "administration"],
  },
  administration: {
    id: "administration",
    label: "Administration",
    description: "Platform governance and operations",
    responsibilities: [
      "Dealer and user administration",
      "Moderation and CMS management",
      "Advertising and featured listings",
      "Platform health and monitoring",
    ],
    rootEntities: ["AdminAction", "ModerationCase", "FeaturedListing"],
    dependsOn: ["organizations", "users", "audit"],
    consumedBy: ["developer"],
  },
  developer: {
    id: "developer",
    label: "Developer",
    description: "API access, webhooks, and integration tooling",
    responsibilities: [
      "API key and OAuth client management",
      "Webhook subscriptions and delivery",
      "Rate limiting and usage quotas",
      "API versioning and documentation",
    ],
    rootEntities: ["ApiKey", "Webhook", "ApiUsageLog"],
    dependsOn: ["identity", "organizations"],
    consumedBy: ["billing", "audit"],
  },
  settings: {
    id: "settings",
    label: "Settings",
    description: "User and organisation preferences",
    responsibilities: [
      "Portal and notification preferences",
      "Locale, language, and currency settings",
      "Feature-specific configuration",
      "Organisation-level defaults",
    ],
    rootEntities: ["UserSettings", "OrganisationSettings"],
    dependsOn: ["users", "organizations"],
    consumedBy: ["notifications", "billing"],
  },
  audit: {
    id: "audit",
    label: "Audit",
    description: "Immutable audit trail for compliance",
    responsibilities: [
      "Action logging across all domains",
      "Dealer and platform audit logs",
      "Data change history",
      "Compliance and retention policies",
    ],
    rootEntities: ["AuditLog", "AuditEvent"],
    dependsOn: ["platform"],
    consumedBy: ["administration", "organizations"],
  },
  system: {
    id: "system",
    label: "System",
    description: "Background jobs, queues, and system health",
    responsibilities: [
      "Job queue and worker management",
      "Feature flags and system configuration",
      "Health checks and monitoring",
      "Maintenance mode and migrations tracking",
    ],
    rootEntities: ["BackgroundJob", "FeatureFlag", "SystemHealthCheck"],
    dependsOn: ["platform"],
    consumedBy: ["administration", "developer", "ai"],
  },
};

export const DOMAIN_IDS = Object.keys(BUSINESS_DOMAINS) as DomainId[];

export function getDomain(id: DomainId): DomainDefinition {
  return BUSINESS_DOMAINS[id];
}

export function getDomainDependencies(id: DomainId): readonly DomainId[] {
  const visited = new Set<DomainId>();
  const queue = [...BUSINESS_DOMAINS[id].dependsOn];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    queue.push(...BUSINESS_DOMAINS[current].dependsOn);
  }

  return [...visited];
}
