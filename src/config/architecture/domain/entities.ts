/**
 * SURF FOR CARS — Entity Catalog
 *
 * Complete entity definitions across all business domains.
 * Architecture only — NOT database schemas.
 */

import type { EntityDefinition } from "./types";

export const ENTITY_CATALOG: Record<string, EntityDefinition> = {
  // ── Platform & Identity ──
  Platform: {
    name: "Platform",
    domain: "platform",
    description: "Root platform tenant and global configuration",
    ownership: "system",
    rootEntity: true,
    lifecycle: ["active", "maintenance"],
    relationships: [],
    childEntities: ["PlatformRegion", "PlatformConfiguration", "FeatureFlag"],
  },
  Identity: {
    name: "Identity",
    domain: "identity",
    description: "Authentication identity linked to a user",
    ownership: "user",
    rootEntity: true,
    lifecycle: ["active", "locked", "deactivated"],
    relationships: [
      { type: "one-to-one", target: "User", description: "Linked platform user" },
      { type: "one-to-many", target: "Session", description: "Active sessions" },
    ],
    dependencies: ["platform"],
  },
  Session: {
    name: "Session",
    domain: "identity",
    description: "Authenticated session with device context",
    ownership: "user",
    lifecycle: ["active", "expired", "revoked"],
    relationships: [
      { type: "many-to-one", target: "Identity", description: "Parent identity" },
    ],
  },

  // ── Organization ──
  DealerGroup: {
    name: "DealerGroup",
    domain: "organizations",
    description: "Parent organisation owning multiple dealerships",
    ownership: "platform",
    rootEntity: true,
    lifecycle: ["pending", "active", "suspended", "archived"],
    relationships: [
      { type: "one-to-many", target: "Dealership", description: "Child dealerships" },
    ],
    childEntities: ["Dealership", "GroupBrandAsset"],
    scalabilityNotes: "Optional — single-dealer accounts skip this level",
  },
  Dealership: {
    name: "Dealership",
    domain: "organizations",
    description: "Primary dealer tenant — billing and data isolation boundary",
    ownership: "dealer-group",
    rootEntity: true,
    lifecycle: ["onboarding", "pending-verification", "active", "suspended", "churned", "archived"],
    relationships: [
      { type: "many-to-one", target: "DealerGroup", description: "Optional parent group", optional: true },
      { type: "one-to-many", target: "Branch", description: "Branch locations" },
      { type: "one-to-one", target: "DealerProfile", description: "Public profile" },
      { type: "one-to-one", target: "Subscription", description: "Active subscription" },
    ],
    childEntities: ["Branch", "DealerProfile", "Subscription", "OrganisationSettings"],
    scalabilityNotes: "Primary tenancy key — all dealer data scoped here",
  },
  Branch: {
    name: "Branch",
    domain: "branches",
    description: "Physical or logical dealer location",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["active", "inactive", "archived"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Parent dealership" },
      { type: "one-to-many", target: "Department", description: "Departments" },
      { type: "one-to-many", target: "Vehicle", description: "Branch inventory" },
    ],
    childEntities: ["Department", "Team"],
  },
  Department: {
    name: "Department",
    domain: "branches",
    description: "Sales, service, marketing, or inventory department",
    ownership: "branch",
    lifecycle: ["active", "archived"],
    relationships: [
      { type: "many-to-one", target: "Branch", description: "Parent branch" },
      { type: "one-to-many", target: "Team", description: "Teams within department" },
    ],
  },
  Team: {
    name: "Team",
    domain: "branches",
    description: "Named team within a department",
    ownership: "branch",
    lifecycle: ["active", "archived"],
    relationships: [
      { type: "many-to-one", target: "Department", description: "Parent department", optional: true },
      { type: "many-to-many", target: "User", description: "Team members" },
    ],
  },

  // ── Users & Roles ──
  User: {
    name: "User",
    domain: "users",
    description: "Platform user across all portals",
    ownership: "platform",
    rootEntity: true,
    lifecycle: ["invited", "pending-verification", "active", "suspended", "deactivated"],
    relationships: [
      { type: "one-to-one", target: "Identity", description: "Auth identity" },
      { type: "one-to-one", target: "UserProfile", description: "Profile data" },
      { type: "one-to-many", target: "UserMembership", description: "Org memberships" },
      { type: "one-to-one", target: "BuyerProfile", description: "Optional buyer profile", optional: true },
    ],
    childEntities: ["UserProfile", "UserMembership", "UserSettings", "RoleAssignment"],
  },
  UserMembership: {
    name: "UserMembership",
    domain: "users",
    description: "User membership in a dealership with optional branch scope",
    ownership: "dealership",
    lifecycle: ["pending", "active", "suspended", "removed"],
    relationships: [
      { type: "many-to-one", target: "User", description: "Member user" },
      { type: "many-to-one", target: "Dealership", description: "Organisation" },
      { type: "many-to-one", target: "Branch", description: "Optional branch scope", optional: true },
    ],
  },
  Role: {
    name: "Role",
    domain: "roles-permissions",
    description: "Named role with permission set",
    ownership: "platform",
    rootEntity: true,
    lifecycle: ["active", "deprecated"],
    relationships: [
      { type: "many-to-many", target: "Permission", description: "Granted permissions" },
    ],
    futureConsiderations: ["Custom roles per dealership (enterprise tier)"],
  },
  RoleAssignment: {
    name: "RoleAssignment",
    domain: "roles-permissions",
    description: "Role assigned to user within org scope",
    ownership: "dealership",
    lifecycle: ["active", "revoked"],
    relationships: [
      { type: "many-to-one", target: "User", description: "Assigned user" },
      { type: "many-to-one", target: "Role", description: "Assigned role" },
      { type: "many-to-one", target: "Dealership", description: "Scope" },
    ],
  },

  // ── Vehicle Domain ──
  Vehicle: {
    name: "Vehicle",
    domain: "vehicles",
    description: "Canonical vehicle listing — root of all vehicle data",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: [
      "draft",
      "pending-review",
      "published",
      "reserved",
      "sold",
      "delisted",
      "archived",
    ],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Owning dealership" },
      { type: "many-to-one", target: "Branch", description: "Assigned branch" },
      { type: "one-to-one", target: "VehicleSpecification", description: "Technical specs" },
      { type: "one-to-many", target: "MediaAsset", description: "Images and videos" },
      { type: "one-to-many", target: "VehiclePriceHistory", description: "Price changes" },
      { type: "one-to-one", target: "VehicleSeo", description: "SEO metadata" },
      { type: "one-to-one", target: "VehicleAiAnalysis", description: "AI analysis results", optional: true },
    ],
    childEntities: [
      "VehicleSpecification",
      "VehicleImage",
      "VehicleVideo",
      "VehicleDocument",
      "VehicleFeature",
      "VehicleOption",
      "VehiclePriceHistory",
      "VehicleViewStats",
      "VehicleMarketingAsset",
      "VehicleSeo",
      "VehicleAiAnalysis",
      "VehicleQualityScore",
      "VehiclePublishStatus",
      "VehicleHistory",
    ],
    scalabilityNotes: "Partition by dealership_id; search index denormalised separately",
    futureConsiderations: ["EV attributes", "motorcycle", "commercial", "agricultural", "fleet"],
  },
  VehicleSpecification: {
    name: "VehicleSpecification",
    domain: "vehicle-specifications",
    description: "Make, model, year, engine, transmission, and technical data",
    ownership: "dealership",
    lifecycle: ["draft", "verified", "published"],
    relationships: [
      { type: "one-to-one", target: "Vehicle", description: "Parent vehicle" },
      { type: "one-to-many", target: "VehicleFeature", description: "Standard features" },
      { type: "one-to-many", target: "VehicleOption", description: "Optional equipment" },
    ],
    futureConsiderations: [
      "Battery capacity and range (EV)",
      "Towing capacity (commercial)",
      "Engine displacement (motorcycle)",
    ],
  },
  VehicleImage: {
    name: "VehicleImage",
    domain: "media",
    description: "Vehicle photograph with ordering and primary flag",
    ownership: "dealership",
    lifecycle: ["uploading", "processing", "active", "archived"],
    relationships: [
      { type: "many-to-one", target: "Vehicle", description: "Parent vehicle" },
      { type: "many-to-one", target: "MediaAsset", description: "Underlying asset" },
    ],
  },
  VehicleVideo: {
    name: "VehicleVideo",
    domain: "media",
    description: "Vehicle video walkaround or promotional clip",
    ownership: "dealership",
    lifecycle: ["uploading", "processing", "active", "archived"],
    relationships: [
      { type: "many-to-one", target: "Vehicle", description: "Parent vehicle" },
      { type: "many-to-one", target: "MediaAsset", description: "Underlying asset" },
    ],
  },
  VehiclePriceHistory: {
    name: "VehiclePriceHistory",
    domain: "vehicles",
    description: "Immutable price change log",
    ownership: "dealership",
    lifecycle: ["recorded"],
    relationships: [
      { type: "many-to-one", target: "Vehicle", description: "Parent vehicle" },
    ],
    scalabilityNotes: "Append-only — never update, only insert",
  },
  VehicleViewStats: {
    name: "VehicleViewStats",
    domain: "analytics",
    description: "Aggregated view and engagement metrics per vehicle",
    ownership: "dealership",
    lifecycle: ["aggregating", "current"],
    relationships: [
      { type: "one-to-one", target: "Vehicle", description: "Parent vehicle" },
    ],
    scalabilityNotes: "Pre-aggregated counters; raw events in AnalyticsEvent",
  },
  VehicleQualityScore: {
    name: "VehicleQualityScore",
    domain: "vehicles",
    description: "Listing quality score based on completeness and media",
    ownership: "dealership",
    lifecycle: ["calculated", "stale"],
    relationships: [
      { type: "one-to-one", target: "Vehicle", description: "Parent vehicle" },
    ],
  },
  VehicleAiAnalysis: {
    name: "VehicleAiAnalysis",
    domain: "ai",
    description: "AI-generated analysis of vehicle listing quality and content",
    ownership: "dealership",
    lifecycle: ["pending", "processing", "completed", "failed"],
    relationships: [
      { type: "one-to-one", target: "Vehicle", description: "Analysed vehicle" },
      { type: "many-to-one", target: "AiJob", description: "Source AI job" },
    ],
  },
  InventoryItem: {
    name: "InventoryItem",
    domain: "inventory",
    description: "Stock record linking vehicle to branch allocation",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["incoming", "in-stock", "reserved", "sold", "transferred"],
    relationships: [
      { type: "one-to-one", target: "Vehicle", description: "Vehicle listing" },
      { type: "many-to-one", target: "Branch", description: "Stock location" },
    ],
  },

  // ── Marketing Domain ──
  Campaign: {
    name: "Campaign",
    domain: "marketing",
    description: "Marketing campaign with vehicles and channels",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["draft", "scheduled", "active", "paused", "completed", "archived"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Owner" },
      { type: "many-to-many", target: "Vehicle", description: "Featured vehicles" },
      { type: "one-to-many", target: "SocialPost", description: "Social posts" },
      { type: "many-to-one", target: "MarketingTemplate", description: "Base template", optional: true },
    ],
    childEntities: ["SocialPost", "VehicleCampaign", "CampaignSchedule"],
  },
  MarketingTemplate: {
    name: "MarketingTemplate",
    domain: "marketing",
    description: "Reusable campaign or post template",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["draft", "active", "archived"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Owner" },
    ],
    childEntities: ["BrandAsset"],
  },
  SocialPost: {
    name: "SocialPost",
    domain: "marketing",
    description: "Social media post with scheduling and history",
    ownership: "dealership",
    lifecycle: ["draft", "scheduled", "published", "failed", "archived"],
    relationships: [
      { type: "many-to-one", target: "Campaign", description: "Parent campaign", optional: true },
      { type: "one-to-many", target: "PostHistory", description: "Publish attempts" },
    ],
  },
  BrandAsset: {
    name: "BrandAsset",
    domain: "marketing",
    description: "Logo, colour palette, font, and brand guidelines",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["active", "archived"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Owner" },
      { type: "many-to-one", target: "MediaAsset", description: "Asset file" },
    ],
  },
  MediaAsset: {
    name: "MediaAsset",
    domain: "media",
    description: "Stored media file with processing metadata",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["uploading", "processing", "ready", "failed", "archived"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Owner" },
      { type: "polymorphic", target: "Vehicle|Campaign|ContentArticle", description: "Attached entity" },
    ],
    scalabilityNotes: "Object storage with CDN; metadata in database only",
  },
  QrCode: {
    name: "QrCode",
    domain: "marketing",
    description: "Generated QR code linking to vehicle or campaign",
    ownership: "dealership",
    lifecycle: ["generated", "active", "expired"],
    relationships: [
      { type: "polymorphic", target: "Vehicle|Campaign", description: "Linked entity" },
    ],
  },

  // ── AI Domain ──
  AiJob: {
    name: "AiJob",
    domain: "ai",
    description: "Async AI processing job",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["queued", "processing", "completed", "failed", "cancelled"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Requesting org" },
      { type: "one-to-many", target: "AiRequest", description: "Input requests" },
      { type: "one-to-many", target: "AiResult", description: "Output results" },
      { type: "many-to-one", target: "AiModel", description: "Model used" },
    ],
    childEntities: ["AiRequest", "AiResult", "AiUsageRecord"],
    scalabilityNotes: "Queue-based processing; results stored separately from jobs",
  },
  AiModel: {
    name: "AiModel",
    domain: "ai",
    description: "AI model definition with version and capabilities",
    ownership: "platform",
    rootEntity: true,
    lifecycle: ["active", "deprecated", "retired"],
    relationships: [],
    futureConsiderations: ["AI agents", "multi-model orchestration", "fine-tuned dealer models"],
  },
  AiRecommendation: {
    name: "AiRecommendation",
    domain: "ai",
    description: "AI-generated recommendation with confidence score",
    ownership: "dealership",
    lifecycle: ["generated", "accepted", "dismissed", "expired"],
    relationships: [
      { type: "many-to-one", target: "AiResult", description: "Source result" },
      { type: "polymorphic", target: "Vehicle|Campaign|Lead", description: "Target entity" },
    ],
  },
  AiUsageRecord: {
    name: "AiUsageRecord",
    domain: "ai",
    description: "Token and cost tracking per AI operation",
    ownership: "dealership",
    lifecycle: ["recorded"],
    relationships: [
      { type: "many-to-one", target: "AiJob", description: "Source job" },
      { type: "many-to-one", target: "Dealership", description: "Billing tenant" },
    ],
    scalabilityNotes: "Append-only; aggregated for billing monthly",
  },

  // ── Search Domain ──
  SearchIndex: {
    name: "SearchIndex",
    domain: "search",
    description: "Denormalised search document for vehicles, dealers, or content",
    ownership: "platform",
    rootEntity: true,
    lifecycle: ["indexing", "current", "stale", "removed"],
    relationships: [
      { type: "polymorphic", target: "Vehicle|Dealership|ContentArticle", description: "Source entity" },
    ],
    scalabilityNotes: "External search engine (Typesense/Elasticsearch); not in primary DB",
  },
  SavedSearch: {
    name: "SavedSearch",
    domain: "search",
    description: "Buyer saved search with alert configuration",
    ownership: "buyer",
    lifecycle: ["active", "paused", "expired"],
    relationships: [
      { type: "many-to-one", target: "BuyerProfile", description: "Owner" },
    ],
  },
  Collection: {
    name: "Collection",
    domain: "search",
    description: "Curated vehicle collection — lifestyle or editorial",
    ownership: "platform",
    lifecycle: ["draft", "published", "archived"],
    relationships: [
      { type: "many-to-many", target: "Vehicle", description: "Collection vehicles" },
    ],
  },

  // ── Analytics Domain ──
  AnalyticsEvent: {
    name: "AnalyticsEvent",
    domain: "analytics",
    description: "Raw business event for analytics pipeline",
    ownership: "platform",
    rootEntity: true,
    lifecycle: ["recorded", "processed", "archived"],
    relationships: [
      { type: "polymorphic", target: "Vehicle|Dealership|Campaign|User", description: "Subject entity" },
    ],
    scalabilityNotes: "Append-only event stream; TTL for raw events, permanent aggregates",
  },
  MetricSnapshot: {
    name: "MetricSnapshot",
    domain: "analytics",
    description: "Pre-computed metric at a point in time",
    ownership: "dealership",
    lifecycle: ["current", "superseded"],
    relationships: [
      { type: "polymorphic", target: "Vehicle|Dealership|Branch|Campaign", description: "Subject" },
    ],
    scalabilityNotes: "Time-series partitioned by period (daily/weekly/monthly)",
  },

  // ── Content Domain ──
  ContentArticle: {
    name: "ContentArticle",
    domain: "content",
    description: "Buying guide, article, or news post",
    ownership: "platform",
    rootEntity: true,
    lifecycle: ["draft", "review", "published", "archived"],
    relationships: [
      { type: "many-to-one", target: "Author", description: "Author" },
      { type: "many-to-many", target: "ContentCategory", description: "Categories" },
      { type: "one-to-one", target: "SeoMetadata", description: "SEO data" },
      { type: "one-to-many", target: "ContentVersion", description: "Version history" },
    ],
    childEntities: ["ContentVersion", "ContentTag"],
  },

  // ── Reviews Domain ──
  Review: {
    name: "Review",
    domain: "reviews",
    description: "Dealer or vehicle review with rating",
    ownership: "buyer",
    rootEntity: true,
    lifecycle: ["pending", "published", "flagged", "removed"],
    relationships: [
      { type: "many-to-one", target: "BuyerProfile", description: "Reviewer" },
      { type: "polymorphic", target: "Dealership|Vehicle", description: "Reviewed entity" },
      { type: "one-to-many", target: "ReviewResponse", description: "Dealer responses" },
    ],
    childEntities: ["Rating", "ReviewResponse", "ModerationCase"],
  },

  // ── CRM Domain ──
  Lead: {
    name: "Lead",
    domain: "crm",
    description: "Sales lead from enquiry, form, or import",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["new", "contacted", "qualified", "negotiating", "won", "lost", "archived"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Owner" },
      { type: "many-to-one", target: "Branch", description: "Assigned branch", optional: true },
      { type: "many-to-one", target: "Vehicle", description: "Vehicle of interest", optional: true },
      { type: "many-to-one", target: "BuyerProfile", description: "Linked buyer", optional: true },
      { type: "one-to-many", target: "CrmActivity", description: "Activities" },
      { type: "many-to-one", target: "Pipeline", description: "Pipeline stage" },
    ],
    childEntities: ["CrmTask", "CrmNote", "CrmAppointment", "CrmFollowUp"],
  },
  Pipeline: {
    name: "Pipeline",
    domain: "crm",
    description: "Sales pipeline with configurable stages",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["active", "archived"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Owner" },
      { type: "one-to-many", target: "Lead", description: "Active leads" },
    ],
  },

  // ── Messaging ──
  Conversation: {
    name: "Conversation",
    domain: "messaging",
    description: "Buyer-dealer message thread",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["active", "archived", "closed"],
    relationships: [
      { type: "many-to-one", target: "BuyerProfile", description: "Buyer participant" },
      { type: "many-to-one", target: "Dealership", description: "Dealer participant" },
      { type: "one-to-many", target: "Message", description: "Messages" },
      { type: "many-to-one", target: "Vehicle", description: "Context vehicle", optional: true },
    ],
  },

  // ── Notifications ──
  Notification: {
    name: "Notification",
    domain: "notifications",
    description: "Delivered notification across any channel",
    ownership: "user",
    rootEntity: true,
    lifecycle: ["pending", "sent", "delivered", "failed", "read"],
    relationships: [
      { type: "many-to-one", target: "User", description: "Recipient" },
      { type: "many-to-one", target: "NotificationTemplate", description: "Template used" },
    ],
    futureConsiderations: ["WhatsApp channel", "marketing vs transactional separation"],
  },

  // ── Billing ──
  Subscription: {
    name: "Subscription",
    domain: "subscriptions",
    description: "Active dealer subscription with plan entitlements",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["trialing", "active", "past-due", "cancelled", "expired"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Subscriber" },
      { type: "many-to-one", target: "SubscriptionPlan", description: "Plan" },
      { type: "one-to-many", target: "Invoice", description: "Invoices" },
    ],
    childEntities: ["Entitlement", "UsageRecord"],
  },
  Invoice: {
    name: "Invoice",
    domain: "billing",
    description: "Billing invoice with line items",
    ownership: "dealership",
    lifecycle: ["draft", "issued", "paid", "overdue", "void"],
    relationships: [
      { type: "many-to-one", target: "Subscription", description: "Subscription" },
      { type: "one-to-many", target: "Payment", description: "Payments" },
    ],
    futureConsiderations: ["Multi-currency", "Regional tax rules", "VAT/GST/Sales tax"],
  },

  // ── Administration ──
  ModerationCase: {
    name: "ModerationCase",
    domain: "administration",
    description: "Content or review flagged for moderation",
    ownership: "platform",
    rootEntity: true,
    lifecycle: ["open", "under-review", "resolved", "escalated", "closed"],
    relationships: [
      { type: "polymorphic", target: "Review|Vehicle|ContentArticle", description: "Flagged content" },
    ],
  },
  FeaturedListing: {
    name: "FeaturedListing",
    domain: "administration",
    description: "Platform-promoted vehicle or dealer listing",
    ownership: "platform",
    lifecycle: ["scheduled", "active", "expired"],
    relationships: [
      { type: "polymorphic", target: "Vehicle|Dealership", description: "Featured entity" },
    ],
  },

  // ── Developer ──
  ApiKey: {
    name: "ApiKey",
    domain: "developer",
    description: "API authentication key with scoped permissions",
    ownership: "dealership",
    rootEntity: true,
    lifecycle: ["active", "rotated", "revoked"],
    relationships: [
      { type: "many-to-one", target: "Dealership", description: "Owner" },
    ],
    childEntities: ["ApiUsageLog", "Webhook"],
  },
  Webhook: {
    name: "Webhook",
    domain: "developer",
    description: "Event subscription with delivery configuration",
    ownership: "dealership",
    lifecycle: ["active", "paused", "disabled"],
    relationships: [
      { type: "many-to-one", target: "ApiKey", description: "Associated key", optional: true },
      { type: "one-to-many", target: "WebhookDelivery", description: "Delivery log" },
    ],
  },

  // ── Audit & System ──
  AuditLog: {
    name: "AuditLog",
    domain: "audit",
    description: "Immutable record of a system action",
    ownership: "platform",
    rootEntity: true,
    lifecycle: ["recorded"],
    relationships: [
      { type: "many-to-one", target: "User", description: "Actor", optional: true },
      { type: "polymorphic", target: "*", description: "Affected entity" },
    ],
    scalabilityNotes: "Append-only; partitioned by month; long retention for compliance",
  },
  BackgroundJob: {
    name: "BackgroundJob",
    domain: "system",
    description: "Async background processing job",
    ownership: "system",
    rootEntity: true,
    lifecycle: ["queued", "running", "completed", "failed", "dead-letter"],
    relationships: [
      { type: "polymorphic", target: "AiJob|MediaAsset|Vehicle", description: "Job subject" },
    ],
  },
};

export const VEHICLE_ENTITY_TREE = {
  root: "Vehicle",
  children: {
    specifications: ["VehicleSpecification", "VehicleFeature", "VehicleOption"],
    media: ["VehicleImage", "VehicleVideo", "VehicleDocument"],
    pricing: ["VehiclePriceHistory"],
    analytics: ["VehicleViewStats"],
    marketing: ["VehicleMarketingAsset"],
    seo: ["VehicleSeo", "SeoMetadata"],
    ai: ["VehicleAiAnalysis", "VehicleQualityScore"],
    status: ["VehiclePublishStatus", "VehicleHistory"],
  },
} as const;

export function getEntitiesByDomain(domain: string): readonly EntityDefinition[] {
  return Object.values(ENTITY_CATALOG).filter((e) => e.domain === domain);
}

export function getEntity(name: string): EntityDefinition | undefined {
  return ENTITY_CATALOG[name];
}
