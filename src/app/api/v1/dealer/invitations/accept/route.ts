import { NextResponse } from "next/server";

import { AUTH_TOKEN_COOKIE } from "@/features/authentication/constants";
import { parseAuthBearerToken } from "@/features/authentication";
import { acceptStaffInvitation, OwnershipError } from "@/features/dealership/server/ownership.service";
import { createSupabaseServerClient } from "@/lib/supabase";

/**
 * Accepting a staff invitation.
 *
 * Like claiming, this cannot require dealership access — the invitation is what grants it. What it
 * does require is a signed-in account whose email matches the address the invitation was sent to.
 * Without that check a forwarded email would be an access grant, and the person who forwarded it
 * would have handed over a dealership's leads and buyer contact details without meaning to.
 *
 * The token is matched by digest and cleared on success, so the link in the recipient's inbox stops
 * working the moment it is used.
 */
export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: "Sign in with the address this invitation was sent to, then open the link again." },
        { status: 401 },
      );
    }

    const supabase = createSupabaseServerClient(accessToken);
    if (!supabase) {
      return NextResponse.json({ error: "Authentication is unavailable." }, { status: 401 });
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json(
        { error: "Sign in with the address this invitation was sent to, then open the link again." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { token?: string };
    if (!body.token) {
      return NextResponse.json({ error: "This invitation link is incomplete." }, { status: 400 });
    }

    const result = await acceptStaffInvitation({
      token: body.token,
      user: { userId: data.user.id, email: data.user.email ?? null },
      accessToken,
    });

    return NextResponse.json(result);
  } catch (caught) {
    if (caught instanceof OwnershipError) {
      return NextResponse.json({ error: caught.message }, { status: caught.status });
    }
    return NextResponse.json({ error: "That invitation could not be accepted." }, { status: 400 });
  }
}
