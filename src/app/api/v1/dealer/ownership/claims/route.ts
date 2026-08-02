import { NextResponse } from "next/server";

import { AUTH_TOKEN_COOKIE } from "@/features/authentication/constants";
import { parseAuthBearerToken } from "@/features/authentication";
import {
  listOwnershipClaims,
  OwnershipError,
  submitOwnershipClaim,
  withdrawOwnershipClaim,
} from "@/features/dealership/server/ownership.service";
import { createSupabaseServerClient } from "@/lib/supabase";

/**
 * Claiming a dealership.
 *
 * NOT AUTHORISED AS A DEALER, DELIBERATELY
 * ========================================
 * Every other route in this folder asks `authorizeDealerApiRequest` whether the caller already has
 * access to the dealership. This one cannot: the whole point is that the claimant does *not* have
 * access yet. That is exactly the chicken-and-egg that left 128 dealerships unreachable — the only
 * way in was through a permission you could only get by already being in.
 *
 * So the requirement here is weaker and different: the caller must be a signed-in user, and that is
 * all. A claim grants nothing. It creates a request that a human at SURF4CARS reviews against
 * evidence, and only their approval moves ownership.
 */

async function requireSignedInUser(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_TOKEN_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  const accessToken =
    parseAuthBearerToken(request.headers.get("authorization")) ??
    (cookieToken ? decodeURIComponent(cookieToken) : undefined);

  if (!accessToken) {
    throw new OwnershipError("Sign in to claim a dealership.", 403);
  }

  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    throw new OwnershipError("Authentication is unavailable.", 403);
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new OwnershipError("Sign in to claim a dealership.", 403);
  }

  return {
    accessToken,
    actor: { userId: data.user.id, email: data.user.email ?? null },
  };
}

export async function POST(request: Request) {
  try {
    const { accessToken, actor } = await requireSignedInUser(request);
    const body = (await request.json()) as {
      dealershipId?: string;
      claimantName?: string;
      claimantRole?: string;
      evidenceNote?: string;
    };

    if (!body.dealershipId) {
      return NextResponse.json({ error: "Choose the dealership you are claiming." }, { status: 400 });
    }

    const claim = await submitOwnershipClaim({
      dealershipId: body.dealershipId,
      claimant: actor,
      claimantName: body.claimantName ?? "",
      claimantRole: body.claimantRole ?? null,
      evidenceNote: body.evidenceNote ?? null,
      accessToken,
    });

    return NextResponse.json({ claim });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "That claim could not be submitted." }, { status: 400 });
  }
}

/** A claimant's own claims. Never anybody else's — a claim names a person and their evidence. */
export async function GET(request: Request) {
  try {
    const { accessToken, actor } = await requireSignedInUser(request);
    const url = new URL(request.url);
    const dealershipId = url.searchParams.get("dealershipId")?.trim() || undefined;

    const claims = await listOwnershipClaims({ dealershipId, accessToken });
    return NextResponse.json({
      claims: claims.filter((claim) => claim.claimantUserId === actor.userId),
    });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load claims." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { accessToken, actor } = await requireSignedInUser(request);
    const url = new URL(request.url);
    const claimId = url.searchParams.get("claimId")?.trim();
    if (!claimId) {
      return NextResponse.json({ error: "Which claim?" }, { status: 400 });
    }

    await withdrawOwnershipClaim({ claimId, claimant: actor, accessToken });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "That claim could not be withdrawn." }, { status: 400 });
  }
}
