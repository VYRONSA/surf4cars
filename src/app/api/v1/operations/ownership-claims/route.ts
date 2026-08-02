import { NextResponse } from "next/server";

import { hasAnyPermission } from "@/config/architecture";
import { AUTH_TOKEN_COOKIE, AUTH_USER_TYPE_COOKIE } from "@/features/authentication/constants";
import { parseAuthBearerToken } from "@/features/authentication";
import { resolveUserTypeFromSupabaseUser, resolveUserTypeFromUnknown } from "@/features/authentication/user-type";
import {
  listOwnershipClaims,
  OwnershipError,
  reviewOwnershipClaim,
} from "@/features/dealership/server/ownership.service";
import { createSupabaseServerClient } from "@/lib/supabase";

/**
 * The review queue.
 *
 * A claim that nobody can approve is the same dead end as no claim at all, so this is the other half
 * of the ownership path rather than an administrative extra. Reviewing requires `operations:approve`,
 * which is held by platform roles only — the whole point is that a dealership cannot approve itself.
 */

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

async function authorizeOperations(request: Request) {
  const accessToken =
    parseAuthBearerToken(request.headers.get("authorization")) ?? readCookie(request, AUTH_TOKEN_COOKIE);

  if (!accessToken) {
    throw new OwnershipError("Sign in to review claims.", 403);
  }

  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) throw new OwnershipError("Authentication is unavailable.", 403);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new OwnershipError("Sign in to review claims.", 403);

  const userType =
    resolveUserTypeFromSupabaseUser(data.user) ??
    resolveUserTypeFromUnknown(readCookie(request, AUTH_USER_TYPE_COOKIE));

  if (!userType || !hasAnyPermission(userType, ["operations:approve"])) {
    throw new OwnershipError("You do not have permission to review ownership claims.", 403);
  }

  return {
    accessToken,
    reviewer: { userId: data.user.id, email: data.user.email ?? null },
  };
}

export async function GET(request: Request) {
  try {
    const { accessToken } = await authorizeOperations(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim() as
      | "pending"
      | "approved"
      | "rejected"
      | "withdrawn"
      | undefined;

    const claims = await listOwnershipClaims({ status: status ?? "pending", accessToken });
    return NextResponse.json({ claims });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load claims." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const { accessToken, reviewer } = await authorizeOperations(request);
    const body = (await request.json()) as {
      claimId?: string;
      decision?: "approved" | "rejected";
      decisionNote?: string;
    };

    if (!body.claimId || (body.decision !== "approved" && body.decision !== "rejected")) {
      return NextResponse.json({ error: "A claim and a decision are required." }, { status: 400 });
    }

    const claim = await reviewOwnershipClaim({
      claimId: body.claimId,
      decision: body.decision,
      reviewer,
      decisionNote: body.decisionNote ?? null,
      accessToken,
    });

    return NextResponse.json({ claim });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "That decision could not be recorded." }, { status: 400 });
  }
}
