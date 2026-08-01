import type { UserTypeId } from "@/config/architecture";

const USER_TYPES = new Set<UserTypeId>([
  "public-visitor",
  "buyer",
  "dealer",
  "salesperson",
  "branch-manager",
  "dealer-owner",
  "platform-administrator",
  "developer",
  "platform-owner",
  "operations-director",
  "dealer-success",
  "marketplace",
  "revenue",
  "finance",
  "support",
  "marketing",
  "moderation",
]);

export function isKnownUserType(value: string | null | undefined): value is UserTypeId {
  return Boolean(value && USER_TYPES.has(value as UserTypeId));
}

export function resolveUserTypeFromUnknown(input: unknown): UserTypeId | null {
  if (typeof input !== "string") return null;
  return isKnownUserType(input) ? input : null;
}

export function resolveUserTypeFromSupabaseUser(input: {
  readonly user_metadata?: Record<string, unknown> | null;
  readonly app_metadata?: Record<string, unknown> | null;
} | null | undefined): UserTypeId | null {
  if (!input) return null;

  const userTypeCandidates = [
    input.user_metadata?.user_type,
    input.app_metadata?.user_type,
    input.user_metadata?.role,
    input.app_metadata?.role,
  ];

  for (const candidate of userTypeCandidates) {
    const resolved = resolveUserTypeFromUnknown(candidate);
    if (resolved) return resolved;
  }

  return null;
}
