import { hasAnyPermission, type Permission, type UserTypeId } from "@/config/architecture";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/config/env";
import {
  ACTIVE_BUYER_COOKIE,
  AUTH_USER_TYPE_COOKIE,
} from "@/features/authentication/constants";
import { parseAuthBearerToken } from "@/features/authentication";
import { resolveUserTypeFromSupabaseUser, resolveUserTypeFromUnknown } from "@/features/authentication/user-type";
import { createSupabaseServerClient } from "@/lib/supabase";

export class BuyerApiAuthorizationError extends Error {
  readonly status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "BuyerApiAuthorizationError";
    this.status = status;
  }
}

export interface BuyerApiAccessContext {
  readonly accessToken?: string;
  readonly buyerId: string;
  readonly userType: UserTypeId;
  readonly userId?: string;
}

interface BuyerApiAccessOptions {
  readonly buyerId?: string;
  readonly permissions?: readonly Permission[];
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

function resolveCookieBuyerId(cookieMap: Map<string, string>): string | null {
  const value = cookieMap.get(ACTIVE_BUYER_COOKIE)?.trim() ?? null;
  return value || null;
}

function assertBuyerPermission(userType: UserTypeId, permissions: readonly Permission[] | undefined): void {
  if (!permissions || permissions.length === 0) return;
  if (!hasAnyPermission(userType, permissions)) {
    throw new BuyerApiAuthorizationError("You do not have permission for this action.", 403);
  }
}

export async function authorizeBuyerApiRequest(
  request: Request,
  options: BuyerApiAccessOptions = {},
): Promise<BuyerApiAccessContext> {
  const accessToken = parseAuthBearerToken(request.headers.get("authorization"));
  const cookieMap = parseCookieHeader(request.headers.get("cookie"));
  const cookieUserType = resolveUserTypeFromUnknown(cookieMap.get(AUTH_USER_TYPE_COOKIE));
  const cookieBuyerId = resolveCookieBuyerId(cookieMap);
  const requestedBuyerId = options.buyerId?.trim() ?? null;

  if (isSupabaseConfigured()) {
    if (!accessToken) {
      throw new BuyerApiAuthorizationError("Authentication is required.", 401);
    }

    const supabase = createSupabaseServerClient(accessToken);
    if (!supabase) {
      throw new BuyerApiAuthorizationError("Authentication is required.", 401);
    }

    const auth = await supabase.auth.getUser();
    const user = auth.data.user;
    if (!user) {
      throw new BuyerApiAuthorizationError("Authentication is required.", 401);
    }

    const userType = resolveUserTypeFromSupabaseUser(user) ?? cookieUserType;
    if (userType !== "buyer") {
      throw new BuyerApiAuthorizationError("Buyer access is required.", 403);
    }

    assertBuyerPermission(userType, options.permissions);

    if (requestedBuyerId && requestedBuyerId !== user.id) {
      throw new BuyerApiAuthorizationError("You are not authorized for this buyer account.", 403);
    }

    return {
      accessToken,
      buyerId: user.id,
      userType,
      userId: user.id,
    };
  }

  if (cookieUserType !== "buyer") {
    throw new BuyerApiAuthorizationError("Buyer access is required.", 403);
  }

  if (!cookieBuyerId) {
    throw new BuyerApiAuthorizationError("Authentication is required.", 401);
  }

  if (requestedBuyerId && requestedBuyerId !== cookieBuyerId) {
    throw new BuyerApiAuthorizationError("You are not authorized for this buyer account.", 403);
  }

  assertBuyerPermission(cookieUserType, options.permissions);

  return {
    accessToken,
    buyerId: cookieBuyerId,
    userType: cookieUserType,
  };
}

export function buildBuyerAuthorizationErrorResponse(
  error: unknown,
  fallbackMessage: string,
): Response {
  if (error instanceof BuyerApiAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: 400 });
}
