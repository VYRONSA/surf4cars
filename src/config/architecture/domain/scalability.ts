/**
 * SURF FOR CARS — Domain Data Scalability Strategy
 */

export const DATA_SCALABILITY_STRATEGY = {
  partitioning: {
    dealership: "All dealer tables partitioned/filtered by dealership_id",
    timeSeries: "AnalyticsEvent and AuditLog partitioned by month",
    search: "Search index sharded by region",
    media: "Object storage buckets per region",
  },
  indexing: {
    vehicles: [
      "dealership_id + status (inventory queries)",
      "branch_id + status (branch inventory)",
      "published_at DESC (marketplace feed)",
      "make + model + year (specification lookup)",
    ],
    leads: [
      "dealership_id + status + created_at",
      "assigned_user_id + status",
    ],
    analytics: [
      "entity_type + entity_id + period",
      "dealership_id + metric_type + date",
    ],
  },
  denormalisation: {
    searchIndex: "Vehicle, dealer, and content data denormalised for search",
    metricSnapshots: "Pre-aggregated counters updated by event consumers",
    vehicleViewStats: "View counts aggregated from raw AnalyticsEvents",
    dealerProfile: "Public profile data denormalised from organisation entities",
  },
  caching: {
    publicVehicles: "CDN + Redis — 5 minute TTL for listing pages",
    dealerProfiles: "CDN — 15 minute TTL",
    searchResults: "Redis — 1 minute TTL per query hash",
    buyerSaved: "Redis — session-scoped cache",
  },
  readReplicas: {
    analytics: "Dedicated read replica for reporting queries",
    search: "Separate search engine cluster",
    publicApi: "Read replica for high-traffic public endpoints",
  },
  archival: {
    soldVehicles: "Move to cold storage after 2 years",
    rawAnalyticsEvents: "Archive after 90 days, keep aggregates permanently",
    auditLogs: "Retain 7 years for compliance",
    aiPrompts: "Purge after 90 days, retain results",
  },
} as const;

export const FUTURE_PROOFING = {
  vehicleTypes: {
    current: ["car", "suv", "van", "pickup"],
    planned: [
      { type: "electric", attributes: ["battery_capacity", "range_km", "charging_time", "connector_type"] },
      { type: "motorcycle", attributes: ["engine_cc", "bike_type"] },
      { type: "commercial", attributes: ["gvw", "payload", "axle_config", "body_type"] },
      { type: "agricultural", attributes: ["pto", "hydraulics", "implement_type"] },
      { type: "luxury", attributes: ["bespoke_options", "concierge_service"] },
      { type: "fleet", attributes: ["fleet_size", "lease_terms", "maintenance_package"] },
    ],
    strategy: "VehicleType enum + extensible VehicleSpecification attributes JSON",
  },
  internationalisation: {
    countries: "Country entity with regulations, tax rules, and unit preferences",
    currencies: "Base price in dealership currency; display conversion at query time",
    languages: "Translatable fields pattern: { field, locale, value }",
    taxSystems: "TaxRule entity per country/region — VAT, GST, sales tax",
    units: "Metric/imperial per region — distance, fuel economy, power",
  },
  futureProducts: {
    strategy: [
      "VehicleType polymorphism in specification domain",
      "Feature flags per vehicle type availability",
      "Search facets generated from vehicle type schema",
      "Separate marketplace collections per vehicle category",
    ],
  },
  aiAgents: {
    strategy: [
      "AiAgent entity extending AiModel with autonomous capabilities",
      "Agent conversation history separate from buyer messaging",
      "Agent permissions scoped to dealership role",
      "Human-in-the-loop approval for agent actions",
    ],
  },
  mobileApps: {
    strategy: [
      "Shared domain types package (@sfc/types)",
      "Mobile-optimised API surface (/api/v1/mobile)",
      "Push notification via device registration entity",
      "Offline sync queue for buyer saved data",
    ],
  },
  marketplaceApi: {
    strategy: [
      "Public read API versioned independently",
      "Partner write API with OAuth and scoped permissions",
      "Webhook system for real-time partner notifications",
      "API marketplace for third-party app directory (future)",
    ],
  },
} as const;
