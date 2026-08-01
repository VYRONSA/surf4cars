import { NextResponse } from "next/server";

import {
  authorizeBuyerApiRequest,
  buildBuyerAuthorizationErrorResponse,
} from "@/features/authentication/server/buyer-api-authorization";
import {
  parseBuyerIdFromUrl,
  parseSavedSearchCreateRequest,
  parseSavedSearchDeleteRequest,
} from "@/features/buyer-intelligence/server/buyer-intelligence.request";
import {
  createSavedSearch,
  deleteSavedSearch,
  listSavedSearches,
} from "@/features/buyer-intelligence/server/buyer-intelligence.service";

export async function GET(request: Request) {
  try {
    const buyerId = parseBuyerIdFromUrl(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId,
      permissions: ["buyer:searches:manage"],
    });
    const payload = await listSavedSearches(access.buyerId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to load saved searches.");
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseSavedSearchCreateRequest(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId: input.buyerId,
      permissions: ["buyer:searches:manage"],
    });
    const payload = await createSavedSearch(input, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to create saved search.");
  }
}

export async function DELETE(request: Request) {
  try {
    const input = await parseSavedSearchDeleteRequest(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId: input.buyerId,
      permissions: ["buyer:searches:manage"],
    });
    await deleteSavedSearch(input, access.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to delete saved search.");
  }
}
