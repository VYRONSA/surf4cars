import { NextResponse } from "next/server";

import { env } from "@/config/env";
import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  issueStaffInvitation,
  listOwnershipEvents,
  OwnershipError,
  removeStaffMember,
  revokeStaffInvitation,
  transferOwnership,
} from "@/features/dealership/server/ownership.service";

/** The audit history: who has controlled this dealership, and who could act for it. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = url.searchParams.get("dealershipId")?.trim();
    if (!dealershipId) {
      return NextResponse.json({ error: "A dealership is required." }, { status: 400 });
    }

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:audit:view", "dealer:team:manage"],
    });

    const events = await listOwnershipEvents(dealershipId, access.accessToken);
    return NextResponse.json({ events });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load ownership history.");
  }
}

/**
 * Transfer, invite, revoke, remove.
 *
 * All four require `dealer:team:manage`, which only a dealer-owner holds. Transferring in particular
 * is checked again inside the service against `owner_user_id` — the permission says "you may manage
 * this team", and only the actual owner may give the dealership away.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = url.searchParams.get("dealershipId")?.trim();
    if (!dealershipId) {
      return NextResponse.json({ error: "A dealership is required." }, { status: 400 });
    }

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:team:manage"],
    });

    if (!access.userId) {
      return NextResponse.json(
        { error: "This action needs a signed-in account we can attribute it to." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      action?: "transfer" | "invite" | "revoke" | "remove";
      toUserId?: string;
      membershipId?: string;
    };

    const actor = { userId: access.userId, email: null as string | null };

    switch (body.action) {
      case "transfer": {
        if (!body.toUserId) {
          return NextResponse.json({ error: "Choose who should own this dealership." }, { status: 400 });
        }
        await transferOwnership({
          dealershipId,
          toUserId: body.toUserId,
          actor,
          accessToken: access.accessToken,
        });
        return NextResponse.json({ ok: true });
      }

      case "invite": {
        if (!body.membershipId) {
          return NextResponse.json({ error: "Choose a team member to invite." }, { status: 400 });
        }
        const invitation = await issueStaffInvitation({
          dealershipId,
          membershipId: body.membershipId,
          actor,
          appUrl: env.appUrl,
          accessToken: access.accessToken,
        });
        /* The raw token is returned exactly once, here, so it can be put in a link. It is not stored
           and cannot be read back — a second request issues a new one and invalidates this. */
        return NextResponse.json(invitation);
      }

      case "revoke": {
        if (!body.membershipId) {
          return NextResponse.json({ error: "Choose an invitation to cancel." }, { status: 400 });
        }
        await revokeStaffInvitation({
          dealershipId,
          membershipId: body.membershipId,
          actor,
          accessToken: access.accessToken,
        });
        return NextResponse.json({ ok: true });
      }

      case "remove": {
        if (!body.membershipId) {
          return NextResponse.json({ error: "Choose a team member to remove." }, { status: 400 });
        }
        await removeStaffMember({
          dealershipId,
          membershipId: body.membershipId,
          actor,
          accessToken: access.accessToken,
        });
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return buildDealerAuthorizationErrorResponse(error, "That action could not be completed.");
  }
}
