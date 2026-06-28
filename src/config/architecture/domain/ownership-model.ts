/**
 * SURF FOR CARS — Ownership Model
 *
 * Data tenancy and ownership rules for multi-tenant architecture.
 */

export const OWNERSHIP_MODEL = {
  principles: [
    "Every record has exactly one primary owner (tenant key)",
    "Dealer data is isolated by dealership_id at all layers",
    "Buyer data is platform-scoped, never dealer-scoped",
    "Platform data is global and read-only for dealers",
    "Audit logs are platform-owned but dealer-filterable",
  ],
  tenantKeys: {
    dealership: "dealership_id",
    branch: "branch_id",
    buyer: "buyer_profile_id",
    user: "user_id",
    platform: "platform_id",
  },
  rules: {
    vehicle: {
      owner: "dealership",
      scope: "branch",
      description: "Vehicle belongs to dealership, assigned to branch",
      cascadeOnArchive: "delist, preserve history and analytics",
    },
    lead: {
      owner: "dealership",
      scope: "branch",
      description: "Lead belongs to dealership, optionally assigned to branch and salesperson",
      cascadeOnArchive: "archive, preserve CRM history",
    },
    buyerProfile: {
      owner: "buyer",
      scope: "platform",
      description: "Buyer data never owned by dealer — only referenced",
      cascadeOnArchive: "anonymise PII, preserve aggregated analytics",
    },
    mediaAsset: {
      owner: "dealership",
      scope: "dealership",
      description: "Media owned by dealership, linked to vehicles or campaigns",
      cascadeOnArchive: "soft delete, CDN purge after retention period",
    },
    aiJob: {
      owner: "dealership",
      scope: "dealership",
      description: "AI jobs billed to dealership",
      cascadeOnArchive: "retain results, purge prompts after 90 days",
    },
    contentArticle: {
      owner: "platform",
      scope: "platform",
      description: "Editorial content is platform-owned",
      cascadeOnArchive: "unpublish, preserve version history",
    },
    apiKey: {
      owner: "dealership",
      scope: "dealership",
      description: "API keys scoped to dealership with permission set",
      cascadeOnArchive: "revoke immediately on dealership suspension",
    },
  },
  crossTenantAccess: {
    allowed: [
      "Buyer views public vehicle listings (read-only)",
      "Buyer submits lead to dealership (creates dealer-scoped lead)",
      "Platform admin reads all tenant data",
      "Search index reads public vehicle and dealer data",
    ],
    prohibited: [
      "Dealer A reads Dealer B inventory",
      "Dealer reads buyer PII beyond their own leads",
      "Buyer data shared between dealers without consent",
    ],
  },
  dataResidency: {
    strategy: [
      "Regional data residency via PlatformRegion entity",
      "EU dealer data stored in EU region (GDPR)",
      "Media assets stored in region-matched object storage",
      "Search indexes replicated per region",
    ],
  },
} as const;

export const LIFECYCLE_POLICIES = {
  softDelete: {
    entities: ["Vehicle", "Campaign", "Lead", "User", "Dealership"],
    behaviour: "Set deleted_at, hide from UI, preserve for audit and analytics",
  },
  hardDelete: {
    entities: ["Session", "Notification (after TTL)", "AnalyticsEvent (raw, after 90 days)"],
    behaviour: "Permanently removed after retention period",
  },
  archive: {
    entities: ["Dealership", "Branch", "Campaign", "ContentArticle"],
    behaviour: "Move to archived state, stop active processing, retain indefinitely",
  },
  immutable: {
    entities: ["AuditLog", "VehiclePriceHistory", "AiUsageRecord", "Invoice"],
    behaviour: "Insert-only, never update or delete",
  },
} as const;
