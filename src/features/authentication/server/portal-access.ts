import { cookies } from "next/headers";

import {
  hasAnyPermission,
  type Permission,
  type UserTypeId,
} from "@/config/architecture";
import { AUTH_TOKEN_COOKIE, AUTH_USER_TYPE_COOKIE } from "@/features/authentication/constants";
import { resolveUserTypeFromSupabaseUser, resolveUserTypeFromUnknown } from "@/features/authentication/user-type";
import { isSupabaseConfigured } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/supabase";

type Portal = "buyer" | "dealer" | "operations";

type AccessFailureReason = "unauthenticated" | "forbidden";

interface AccessAllowed {
  readonly allowed: true;
  readonly userType: UserTypeId;
}

interface AccessDenied {
  readonly allowed: false;
  readonly reason: AccessFailureReason;
}

export type PortalAccessResult = AccessAllowed | AccessDenied;

/**
 * The signed-in Supabase user id, or null.
 *
 * Split out from `resolvePortalAccess` because the dealer layout needs the *identity* to resolve which
 * dealership the person works for — a question nothing in the platform asked until PCP-035.
 */
export async function resolveAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token || !isSupabaseConfigured()) return null;

  const supabase = createSupabaseServerClient(token);
  if (!supabase) return null;

  const auth = await supabase.auth.getUser();
  return auth.data.user?.id ?? null;
}

function getPortalRequiredPermissions(portal: Portal): readonly string[] {
  if (portal === "dealer") return ["dealer:dashboard:view"];
  if (portal === "buyer") return ["buyer:dashboard:view"];
  return ["operations:view"];
}

function getPortalLoginPath(portal: Portal): string {
  if (portal === "dealer") return "/auth/sign-in?portal=dealer";
  if (portal === "buyer") return "/auth/sign-in?portal=buyer";
  return "/unauthorized";
}

function resolveAuthRedirect(portal: Portal, pathname: string): string {
  const loginPath = getPortalLoginPath(portal);
  const redirectParam = encodeURIComponent(pathname);
  return `${loginPath}${loginPath.includes("?") ? "&" : "?"}redirect=${redirectParam}`;
}

async function resolveAuthenticatedUserType(): Promise<UserTypeId | null> {
  const cookieStore = await cookies();
  const cookieUserType = resolveUserTypeFromUnknown(cookieStore.get(AUTH_USER_TYPE_COOKIE)?.value);
  const isProduction = process.env.NODE_ENV === "production";

  if (!isSupabaseConfigured()) {
    return cookieUserType;
  }

  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    if (!isProduction && cookieUserType) {
      return cookieUserType;
    }
    return null;
  }

  const supabase = createSupabaseServerClient(token);
  if (!supabase) {
    return null;
  }

  const auth = await supabase.auth.getUser();
  const supabaseUser = auth.data.user;
  if (!supabaseUser) {
    if (!isProduction && cookieUserType) {
      return cookieUserType;
    }
    return null;
  }

  return resolveUserTypeFromSupabaseUser(supabaseUser) ?? cookieUserType;
}

export async function resolvePortalAccess(
  portal: Portal,
): Promise<PortalAccessResult> {
  const userType = await resolveAuthenticatedUserType();

  if (!userType) {
    return { allowed: false, reason: "unauthenticated" };
  }

  const requiredPermissions = getPortalRequiredPermissions(portal) as readonly Permission[];
  if (!hasAnyPermission(userType, requiredPermissions)) {
    return { allowed: false, reason: "forbidden" };
  }

  return { allowed: true, userType };
}

export function resolvePortalRedirect(
  portal: Portal,
  reason: AccessFailureReason,
  pathname: string,
): string {
  if (portal === "operations") {
    return "/unauthorized";
  }

  if (reason === "unauthenticated") {
    return resolveAuthRedirect(portal, pathname);
  }

  return "/unauthorized";
}
