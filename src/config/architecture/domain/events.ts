/**
 * SURF FOR CARS — Event Architecture
 *
 * Domain events for async processing, analytics, and integrations.
 */

export type EventCategory =
  | "vehicle"
  | "inventory"
  | "dealer"
  | "buyer"
  | "marketing"
  | "ai"
  | "crm"
  | "billing"
  | "user"
  | "notification"
  | "content"
  | "review"
  | "system";

export interface DomainEventDefinition {
  readonly name: string;
  readonly category: EventCategory;
  readonly description: string;
  readonly payload: readonly string[];
  readonly consumers: readonly string[];
  readonly webhookExposed: boolean;
}

export const DOMAIN_EVENTS: Record<string, DomainEventDefinition> = {
  "vehicle.published": {
    name: "vehicle.published",
    category: "vehicle",
    description: "Vehicle listing published to marketplace",
    payload: ["vehicle_id", "dealership_id", "branch_id", "published_at"],
    consumers: ["search-index", "analytics", "notifications", "webhooks"],
    webhookExposed: true,
  },
  "vehicle.updated": {
    name: "vehicle.updated",
    category: "vehicle",
    description: "Vehicle listing data changed",
    payload: ["vehicle_id", "dealership_id", "changed_fields", "updated_at"],
    consumers: ["search-index", "analytics", "ai-quality-score"],
    webhookExposed: true,
  },
  "vehicle.sold": {
    name: "vehicle.sold",
    category: "vehicle",
    description: "Vehicle marked as sold",
    payload: ["vehicle_id", "dealership_id", "sold_at", "sold_price"],
    consumers: ["analytics", "crm", "notifications", "webhooks"],
    webhookExposed: true,
  },
  "vehicle.delisted": {
    name: "vehicle.delisted",
    category: "vehicle",
    description: "Vehicle removed from marketplace",
    payload: ["vehicle_id", "dealership_id", "reason", "delisted_at"],
    consumers: ["search-index", "analytics", "webhooks"],
    webhookExposed: true,
  },
  "vehicle.price-changed": {
    name: "vehicle.price-changed",
    category: "vehicle",
    description: "Vehicle price updated",
    payload: ["vehicle_id", "old_price", "new_price", "currency", "changed_at"],
    consumers: ["buyer-alerts", "analytics", "notifications"],
    webhookExposed: false,
  },
  "inventory.stock-received": {
    name: "inventory.stock-received",
    category: "inventory",
    description: "New vehicle added to dealer inventory",
    payload: ["inventory_item_id", "vehicle_id", "dealership_id", "branch_id"],
    consumers: ["analytics", "notifications"],
    webhookExposed: false,
  },
  "dealer.registered": {
    name: "dealer.registered",
    category: "dealer",
    description: "New dealership completed onboarding",
    payload: ["dealership_id", "plan_id", "registered_at"],
    consumers: ["admin-notifications", "analytics", "webhooks"],
    webhookExposed: true,
  },
  "dealer.verified": {
    name: "dealer.verified",
    category: "dealer",
    description: "Dealership passed verification",
    payload: ["dealership_id", "verified_at"],
    consumers: ["search-index", "notifications"],
    webhookExposed: false,
  },
  "branch.created": {
    name: "branch.created",
    category: "dealer",
    description: "New branch added to dealership",
    payload: ["branch_id", "dealership_id", "created_at"],
    consumers: ["analytics", "webhooks"],
    webhookExposed: true,
  },
  "user.invited": {
    name: "user.invited",
    category: "user",
    description: "Team member invited to dealership",
    payload: ["user_id", "dealership_id", "role", "invited_by", "invited_at"],
    consumers: ["notifications", "audit"],
    webhookExposed: false,
  },
  "user.joined": {
    name: "user.joined",
    category: "user",
    description: "Invited user accepted and joined",
    payload: ["user_id", "dealership_id", "joined_at"],
    consumers: ["notifications", "audit"],
    webhookExposed: false,
  },
  "buyer.registered": {
    name: "buyer.registered",
    category: "buyer",
    description: "New buyer account created",
    payload: ["buyer_profile_id", "registered_at"],
    consumers: ["analytics", "notifications"],
    webhookExposed: false,
  },
  "buyer.vehicle-saved": {
    name: "buyer.vehicle-saved",
    category: "buyer",
    description: "Buyer saved a vehicle",
    payload: ["buyer_profile_id", "vehicle_id", "saved_at"],
    consumers: ["analytics", "dealer-notifications"],
    webhookExposed: false,
  },
  "campaign.created": {
    name: "campaign.created",
    category: "marketing",
    description: "Marketing campaign created",
    payload: ["campaign_id", "dealership_id", "created_at"],
    consumers: ["analytics"],
    webhookExposed: false,
  },
  "campaign.generated": {
    name: "campaign.generated",
    category: "marketing",
    description: "AI or template generated campaign assets",
    payload: ["campaign_id", "dealership_id", "asset_ids", "generated_at"],
    consumers: ["notifications", "analytics"],
    webhookExposed: false,
  },
  "campaign.published": {
    name: "campaign.published",
    category: "marketing",
    description: "Campaign published to channels",
    payload: ["campaign_id", "channels", "published_at"],
    consumers: ["analytics", "webhooks"],
    webhookExposed: true,
  },
  "media.uploaded": {
    name: "media.uploaded",
    category: "vehicle",
    description: "Media asset uploaded and processed",
    payload: ["media_asset_id", "entity_type", "entity_id", "uploaded_at"],
    consumers: ["ai-image-analysis", "vehicle-quality-score"],
    webhookExposed: true,
  },
  "ai.requested": {
    name: "ai.requested",
    category: "ai",
    description: "AI job submitted to queue",
    payload: ["ai_job_id", "dealership_id", "job_type", "requested_at"],
    consumers: ["billing-usage", "analytics"],
    webhookExposed: false,
  },
  "ai.completed": {
    name: "ai.completed",
    category: "ai",
    description: "AI job completed successfully",
    payload: ["ai_job_id", "dealership_id", "job_type", "result_id", "completed_at"],
    consumers: ["notifications", "analytics", "webhooks", "billing-usage"],
    webhookExposed: true,
  },
  "ai.failed": {
    name: "ai.failed",
    category: "ai",
    description: "AI job failed",
    payload: ["ai_job_id", "dealership_id", "error", "failed_at"],
    consumers: ["notifications", "audit"],
    webhookExposed: false,
  },
  "lead.created": {
    name: "lead.created",
    category: "crm",
    description: "New sales lead captured",
    payload: ["lead_id", "dealership_id", "vehicle_id", "source", "created_at"],
    consumers: ["notifications", "analytics", "webhooks"],
    webhookExposed: true,
  },
  "lead.updated": {
    name: "lead.updated",
    category: "crm",
    description: "Lead status or data changed",
    payload: ["lead_id", "dealership_id", "status", "updated_at"],
    consumers: ["analytics", "webhooks"],
    webhookExposed: true,
  },
  "lead.won": {
    name: "lead.won",
    category: "crm",
    description: "Lead converted to sale",
    payload: ["lead_id", "dealership_id", "vehicle_id", "won_at"],
    consumers: ["analytics", "notifications"],
    webhookExposed: true,
  },
  "subscription.changed": {
    name: "subscription.changed",
    category: "billing",
    description: "Subscription plan or status changed",
    payload: ["subscription_id", "dealership_id", "plan_id", "status", "changed_at"],
    consumers: ["notifications", "entitlements", "webhooks"],
    webhookExposed: true,
  },
  "subscription.trial-ending": {
    name: "subscription.trial-ending",
    category: "billing",
    description: "Trial period ending soon",
    payload: ["subscription_id", "dealership_id", "ends_at"],
    consumers: ["notifications"],
    webhookExposed: false,
  },
  "notification.sent": {
    name: "notification.sent",
    category: "notification",
    description: "Notification delivered to user",
    payload: ["notification_id", "user_id", "channel", "sent_at"],
    consumers: ["analytics"],
    webhookExposed: false,
  },
  "review.submitted": {
    name: "review.submitted",
    category: "review",
    description: "Buyer submitted a review",
    payload: ["review_id", "entity_type", "entity_id", "rating", "submitted_at"],
    consumers: ["moderation", "analytics", "dealer-notifications"],
    webhookExposed: false,
  },
  "content.published": {
    name: "content.published",
    category: "content",
    description: "Editorial content published",
    payload: ["article_id", "published_at"],
    consumers: ["search-index", "seo"],
    webhookExposed: false,
  },
};

export const EVENT_INFRASTRUCTURE = {
  bus: "Internal event bus (Supabase Realtime + background job queue)",
  storage: "AnalyticsEvent entity for raw events; domain handlers for side effects",
  ordering: "Per-aggregate ordering guaranteed (vehicle_id, lead_id)",
  idempotency: "Event ID deduplication at consumer level",
  replay: "Audit log enables event replay for analytics backfill",
} as const;

export const WEBHOOK_EXPOSED_EVENTS = Object.values(DOMAIN_EVENTS)
  .filter((e) => e.webhookExposed)
  .map((e) => e.name);
