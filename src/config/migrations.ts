/**
 * Ordered manifest of database migrations shipped with this build.
 *
 * Held as a constant rather than read from disk so migration version reporting works in serverless
 * deployments, where supabase/migrations is not part of the function bundle.
 *
 * When a migration file is added to supabase/migrations, add its id here in the same order.
 */

export interface MigrationDescriptor {
  readonly id: string;
  readonly description: string;
}

export const MIGRATION_MANIFEST: readonly MigrationDescriptor[] = [
  { id: "20260629090000_sfc102_dealer_onboarding", description: "Dealerships, branches, staff memberships, onboarding drafts" },
  { id: "20260629091000_sfc103_inventory_intelligence", description: "Inventory vehicles, media, documents, price history, history, audit" },
  { id: "20260629092000_sfc106_market_intelligence_engine", description: "Market analytics events" },
  { id: "20260629093000_sfc107_buyer_intelligence_platform", description: "Buyer profiles, saved searches, saved vehicles, alerts" },
  { id: "20260630090000_sfc108_onboarding_completion_atomic", description: "Atomic onboarding completion function" },
  { id: "20260704090000_soc003_dealer_intelligence_engine", description: "Dealer intelligence reviews and activity" },
  { id: "20260729090000_pcp001j1_lead_ecosystem", description: "Leads and lead timeline" },
  { id: "20260729091000_pcp001j1_operations_applications", description: "Operations application reviews, events, notes, attachments" },
  { id: "20260729092000_pcp001j1_public_marketplace_rls", description: "Public read policies for published marketplace stock" },
  { id: "20260729093000_pcp001j1_storage_buckets", description: "Storage buckets and access policies" },
  { id: "20260729094000_pcp001j2_rls_recursion_and_staff_access", description: "RLS recursion fix and dealer staff access" },
  { id: "20260802090000_pcp017_editorial_console", description: "Editorial slots and placements for the Founder Editorial Console" },
  { id: "20260803090000_pcp029_enquiry_persistence", description: "Enquiry reference and source page on leads" },
  { id: "20260803100000_pcp029_leads_id_default", description: "Database-generated ids for leads and lead timeline" },
  { id: "20260804090000_pcp030_enquiry_notifications", description: "Dealer enquiry notification delivery attempts and retry state" },
  { id: "20260804100000_pcp030_recoverable_unconfigured", description: "Unconfigured notifications become due once a provider is set" },
  { id: "20260805090000_prp006_rate_limit_windows", description: "Durable rate limit windows for unauthenticated endpoints" },
  { id: "20260806090000_pcp032_dealer_verification", description: "Real dealership verification state, replacing a hardcoded verified flag" },
  { id: "20260807090000_pcp036_dealer_migration", description: "Dealer import batches and rows — reversible migration with retained source" },
  { id: "20260808090000_pcp037_dealership_ownership", description: "Ownership claims, staff invitation tokens and the append-only ownership audit" },
  { id: "20260808091000_pcp037_vehicle_identifiers_nullable", description: "VIN, registration and stock number may be NULL — not supplied is not an empty string" },
] as const;

/** The migration this build expects to be the most recent one applied. */
export const EXPECTED_MIGRATION_VERSION = MIGRATION_MANIFEST[MIGRATION_MANIFEST.length - 1]!.id;

export const MIGRATION_COUNT = MIGRATION_MANIFEST.length;

/**
 * Tables the application queries at runtime. Used by the health check to detect a database that is
 * reachable but not migrated, which otherwise surfaces as scattered request-time failures.
 */
export const REQUIRED_TABLES: readonly string[] = [
  "dealerships",
  "dealership_branches",
  "dealership_staff_memberships",
  "dealer_onboarding_drafts",
  "inventory_vehicles",
  "inventory_vehicle_media",
  "inventory_vehicle_documents",
  "inventory_vehicle_price_history",
  "inventory_vehicle_history",
  "inventory_vehicle_audit",
  "market_analytics_events",
  "buyer_profiles",
  "buyer_saved_searches",
  "buyer_saved_vehicles",
  "buyer_alert_subscriptions",
  "leads",
  "lead_timeline",
  "editorial_slots",
  "editorial_placements",
  "enquiry_notifications",
  "rate_limit_windows",
  "vehicle_import_batches",
  "vehicle_import_rows",
  "dealership_ownership_claims",
  "dealership_ownership_events",
] as const;

/** Storage buckets the media pipeline expects to exist. */
export const REQUIRED_STORAGE_BUCKETS: readonly string[] = [
  "vehicle-media",
  "dealer-branding",
  "licence-discs",
  "vehicle-documents",
] as const;
