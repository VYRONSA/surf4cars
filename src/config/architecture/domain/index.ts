/**
 * SURF FOR CARS — Domain Architecture
 *
 * Master export for enterprise data architecture.
 * Architecture only — NOT database schemas.
 */

export { API_AUTH_STRATEGY, API_SURFACES, WEBHOOK_SYSTEM } from "./api-strategy";
export { BUSINESS_DOMAINS, DOMAIN_IDS, getDomain, getDomainDependencies } from "./business-domains";
export {
  DOMAIN_EVENTS,
  EVENT_INFRASTRUCTURE,
  WEBHOOK_EXPOSED_EVENTS,
  type DomainEventDefinition,
  type EventCategory,
} from "./events";
export {
  ENTITY_CATALOG,
  VEHICLE_ENTITY_TREE,
  getEntitiesByDomain,
  getEntity,
} from "./entities";
export { ORGANIZATION_HIERARCHY, ORGANIZATION_SCENARIOS, TENANCY_RULES } from "./organization-model";
export {
  LIFECYCLE_POLICIES,
  OWNERSHIP_MODEL,
} from "./ownership-model";
export {
  DOMAIN_DEPENDENCY_GRAPH,
  DOMAIN_RELATIONSHIPS,
  ENTITY_OWNERSHIP_MAP,
} from "./relationships";
export { DATA_SCALABILITY_STRATEGY, FUTURE_PROOFING } from "./scalability";
export {
  BUYER_ENTITY_MODEL,
  ROLE_INHERITANCE_CHAIN,
  USER_ENTITY_MODEL,
  USER_ROLES,
  type UserRoleId,
} from "./user-model";
export type {
  DomainDefinition,
  DomainId,
  DomainRelationship,
  EntityDefinition,
  EntityLifecycleStage,
  EntityRelationship,
  OwnershipScope,
} from "./types";
