import {
  hasAnyPermission,
  type Permission,
  type UserTypeId,
} from "@/config/architecture";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/config/env";
import {
  ACTIVE_DEALERSHIP_COOKIE,
  AUTH_TOKEN_COOKIE,
  AUTH_USER_TYPE_COOKIE,
} from "@/features/authentication/constants";
import { parseAuthBearerToken } from "@/features/authentication";
import { resolveUserTypeFromSupabaseUser, resolveUserTypeFromUnknown } from "@/features/authentication/user-type";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";
import { createSupabaseServerClient } from "@/lib/supabase";
import { createDomainServerClient } from "@/lib/supabase/service-client";

export class DealerApiAuthorizationError extends Error {
  readonly status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "DealerApiAuthorizationError";
    this.status = status;
  }
}

export interface DealerApiAccessContext {
  readonly accessToken?: string;
  readonly userType: UserTypeId;
  readonly userId?: string;
}

interface DealerApiAccessOptions {
  readonly dealershipId?: string;
  readonly permissions: readonly Permission[];
}

function isTransientSupabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("timeout")
    || message.includes("timed out")
    || message.includes("failed to fetch")
    || message.includes("network")
    || message.includes("socket")
    || message.includes("econnrefused")
    || message.includes("econnreset")
    || message.includes("etimedout")
  );
}

async function withSupabaseTimeout<T>(operation: PromiseLike<T>, label: string, timeoutMs = 7000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Supabase ${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;

  for (const pair of cookieHeader.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex);
    const rawValue = trimmed.slice(separatorIndex + 1);
    map.set(key, decodeURIComponent(rawValue));
  }

  return map;
}

async function verifyDealershipOwnershipWithSupabase(
  dealershipId: string,
  userId: string,
  accessToken: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) return false;

  const { data: ownerRecord, error: ownerError } = await withSupabaseTimeout(
    supabase
      .from("dealerships")
      .select("id")
      .eq("id", dealershipId)
      .eq("owner_user_id", userId)
      .maybeSingle(),
    "dealership ownership lookup",
  );

  if (!ownerError && ownerRecord?.id) {
    return true;
  }

  const { data: membershipRecord, error: membershipError } = await withSupabaseTimeout(
    supabase
      .from("dealership_staff_memberships")
      .select("id")
      .eq("dealership_id", dealershipId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    "dealership membership lookup",
  );

  if (membershipError) {
    return false;
  }

  return Boolean(membershipRecord?.id);
}

async function verifyDealershipOwnershipWithLocalStore(
  dealershipId: string,
  cookieMap: Map<string, string>,
): Promise<boolean> {
  // The active-dealership cookie is the only thing that scopes a session to one dealership on this
  // path. Treating its absence as "unscoped" granted any dealer-role caller access to every
  // dealership in the store — including other dealers' leads and buyer contact details — so a
  // session that makes no scope claim is refused rather than trusted.
  const activeDealershipCookie = cookieMap.get(ACTIVE_DEALERSHIP_COOKIE)?.trim();
  if (!activeDealershipCookie || activeDealershipCookie !== dealershipId) {
    return false;
  }

  // Dealerships live in Supabase. Checking the local store here would refuse every dealership
  // created since the vehicle domain migrated, so existence is confirmed against the authoritative
  // source. The cookie-scope guard above still binds the session to a single dealership.
  const supabase = createDomainServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("dealerships")
      .select("id")
      .eq("id", dealershipId)
      .maybeSingle();

    if (!error) return Boolean(data?.id);
  }

  const store = await readPlatformStore();
  return store.dealerships.some((dealership) => dealership.id === dealershipId);
}

export async function authorizeDealerApiRequest(
  request: Request,
  options: DealerApiAccessOptions,
): Promise<DealerApiAccessContext> {
  const cookieMap = parseCookieHeader(request.headers.get("cookie"));
  const accessToken = parseAuthBearerToken(request.headers.get("authorization"))
    ?? cookieMap.get(AUTH_TOKEN_COOKIE)
    ?? undefined;
  const cookieUserType = resolveUserTypeFromUnknown(cookieMap.get(AUTH_USER_TYPE_COOKIE));
  const isProduction = process.env.NODE_ENV === "production";

  if (!isSupabaseConfigured()) {
    if (!cookieUserType) {
      throw new DealerApiAuthorizationError("Authentication is required.", 401);
    }

    if (!hasAnyPermission(cookieUserType, options.permissions)) {
      throw new DealerApiAuthorizationError("You do not have permission for this action.", 403);
    }

    if (options.dealershipId) {
      const hasAccess = await verifyDealershipOwnershipWithLocalStore(options.dealershipId, cookieMap);
      if (!hasAccess) {
        throw new DealerApiAuthorizationError("You are not authorized for this dealership.", 403);
      }
    }

    return {
      accessToken,
      userType: cookieUserType,
    };
  }

  if (!accessToken) {
    if (!isProduction && cookieUserType) {
      if (!hasAnyPermission(cookieUserType, options.permissions)) {
        throw new DealerApiAuthorizationError("You do not have permission for this action.", 403);
      }

      if (options.dealershipId) {
        const hasAccess = await verifyDealershipOwnershipWithLocalStore(options.dealershipId, cookieMap);
        if (!hasAccess) {
          throw new DealerApiAuthorizationError("You are not authorized for this dealership.", 403);
        }
      }

      return {
        userType: cookieUserType,
      };
    }

    throw new DealerApiAuthorizationError("Authentication is required.", 401);
  }

  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    throw new DealerApiAuthorizationError("Authentication is required.", 401);
  }

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;
  try {
    const auth = await withSupabaseTimeout(supabase.auth.getUser(), "auth user lookup");
    user = auth.data.user;
  } catch (error) {
    if (!(isTransientSupabaseError(error) && !isProduction && cookieUserType)) {
      throw error;
    }
  }

  if (!user) {
    if (!isProduction && cookieUserType && hasAnyPermission(cookieUserType, options.permissions)) {
      if (options.dealershipId) {
        const hasAccess = await verifyDealershipOwnershipWithLocalStore(options.dealershipId, cookieMap);
        if (!hasAccess) {
          throw new DealerApiAuthorizationError("You are not authorized for this dealership.", 403);
        }
      }

      return {
        accessToken,
        userType: cookieUserType,
      };
    }

    throw new DealerApiAuthorizationError("Authentication is required.", 401);
  }

  const userType = resolveUserTypeFromSupabaseUser(user) ?? cookieUserType;
  if (!userType) {
    throw new DealerApiAuthorizationError("Authenticated role could not be resolved.", 403);
  }

  if (!hasAnyPermission(userType, options.permissions)) {
    throw new DealerApiAuthorizationError("You do not have permission for this action.", 403);
  }

  if (options.dealershipId) {
    let hasAccess = false;
    try {
      hasAccess = await verifyDealershipOwnershipWithSupabase(options.dealershipId, user.id, accessToken);
    } catch (error) {
      if (!(isTransientSupabaseError(error) && !isProduction)) {
        throw error;
      }
      hasAccess = await verifyDealershipOwnershipWithLocalStore(options.dealershipId, cookieMap);
    }
    if (!hasAccess) {
      throw new DealerApiAuthorizationError("You are not authorized for this dealership.", 403);
    }
  }

  return {
    accessToken,
    userType,
    userId: user.id,
  };
}

export function buildDealerAuthorizationErrorResponse(
  error: unknown,
  fallbackMessage: string,
): Response {
  if (error instanceof DealerApiAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: 400 });
}
