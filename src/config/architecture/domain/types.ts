/**
 * SURF FOR CARS — Domain Architecture Types
 *
 * Shared types for enterprise data architecture documentation.
 * These are architectural definitions — NOT database schemas.
 */

export type DomainId =
  | "platform"
  | "identity"
  | "organizations"
  | "branches"
  | "users"
  | "roles-permissions"
  | "inventory"
  | "vehicles"
  | "vehicle-specifications"
  | "media"
  | "marketing"
  | "ai"
  | "analytics"
  | "crm"
  | "messaging"
  | "notifications"
  | "subscriptions"
  | "billing"
  | "seo"
  | "search"
  | "buyer"
  | "dealer"
  | "reviews"
  | "content"
  | "administration"
  | "developer"
  | "settings"
  | "audit"
  | "system";

export type OwnershipScope =
  | "platform"
  | "dealer-group"
  | "dealership"
  | "branch"
  | "department"
  | "user"
  | "buyer"
  | "system";

export type EntityLifecycleStage =
  | "draft"
  | "pending"
  | "active"
  | "paused"
  | "archived"
  | "deleted"
  | "expired";

export interface EntityRelationship {
  readonly type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many" | "polymorphic";
  readonly target: string;
  readonly description: string;
  readonly optional?: boolean;
}

export interface EntityDefinition {
  readonly name: string;
  readonly domain: DomainId;
  readonly description: string;
  readonly ownership: OwnershipScope;
  readonly rootEntity?: boolean;
  readonly lifecycle: readonly string[];
  readonly relationships: readonly EntityRelationship[];
  readonly childEntities?: readonly string[];
  readonly dependencies?: readonly DomainId[];
  readonly scalabilityNotes?: string;
  readonly futureConsiderations?: readonly string[];
}

export interface DomainDefinition {
  readonly id: DomainId;
  readonly label: string;
  readonly description: string;
  readonly responsibilities: readonly string[];
  readonly rootEntities: readonly string[];
  readonly dependsOn: readonly DomainId[];
  readonly consumedBy: readonly DomainId[];
}

export interface DomainRelationship {
  readonly from: DomainId;
  readonly to: DomainId;
  readonly type: "owns" | "references" | "emits-events-to" | "reads-from" | "extends";
  readonly description: string;
}
