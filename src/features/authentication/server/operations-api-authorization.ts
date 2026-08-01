import { NextResponse } from "next/server";

import { hasAnyPermission, type Permission, type UserTypeId } from "@/config/architecture";
import { isSupabaseConfigured } from "@/config/env";
import { AUTH_USER_TYPE_COOKIE } from "@/features/authentication/constants";
import { parseAuthBearerToken } from "@/features/authentication";
import { resolveUserTypeFromSupabaseUser, resolveUserTypeFromUnknown } from "@/features/authentication/user-type";
import { createSupabaseServerClient } from "@/lib/supabase";

export class OperationsApiAuthorizationError extends Error {
  readonly status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "OperationsApiAuthorizationError";
    this.status = status;
  }
}

export interface OperationsApiAccessContext {
  readonly accessToken?: string;
  readonly userType: UserTypeId;
  readonly userId?: string;
}

interface OperationsApiAccessOptions {
  readonly permissions: readonly Permission[];
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

export async function authorizeOperationsApiRequest(
  request: Request,
  options: OperationsApiAccessOptions,
): Promise<OperationsApiAccessContext> {
  const accessToken = parseAuthBearerToken(request.headers.get("authorization"));
  const cookieMap = parseCookieHeader(request.headers.get("cookie"));
  const cookieUserType = resolveUserTypeFromUnknown(cookieMap.get(AUTH_USER_TYPE_COOKIE));

  if (!isSupabaseConfigured()) {
    if (!cookieUserType) {
      throw new OperationsApiAuthorizationError("Authentication is required.", 401);
    }

    if (!hasAnyPermission(cookieUserType, options.permissions)) {
      throw new OperationsApiAuthorizationError("You do not have permission for this action.", 403);
    }

    return {
      accessToken,
      userType: cookieUserType,
    };
  }

  if (!accessToken) {
    throw new OperationsApiAuthorizationError("Authentication is required.", 401);
  }

  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    throw new OperationsApiAuthorizationError("Authentication is required.", 401);
  }

  const auth = await supabase.auth.getUser();
  const user = auth.data.user;
  if (!user) {
    throw new OperationsApiAuthorizationError("Authentication is required.", 401);
  }

  const userType = resolveUserTypeFromSupabaseUser(user) ?? cookieUserType;
  if (!userType) {
    throw new OperationsApiAuthorizationError("Authenticated role could not be resolved.", 403);
  }

  if (!hasAnyPermission(userType, options.permissions)) {
    throw new OperationsApiAuthorizationError("You do not have permission for this action.", 403);
  }

  return {
    accessToken,
    userType,
    userId: user.id,
  };
}

export function buildOperationsAuthorizationErrorResponse(
  error: unknown,
  fallbackMessage: string,
): Response {
  if (error instanceof OperationsApiAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: 400 });
}
