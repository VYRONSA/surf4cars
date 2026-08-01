import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  parseListingBuilderDraftQuery,
  parseListingBuilderDraftRequest,
} from "@/features/vehicle-upload/server/listing-builder.request";
import {
  getListingBuilderDraft,
  saveListingBuilderDraft,
} from "@/features/vehicle-upload/server/listing-builder.service";

export async function GET(request: Request) {
  try {
    const query = parseListingBuilderDraftQuery(new URL(request.url));
    const access = await authorizeDealerApiRequest(request, {
      dealershipId: query.dealershipId,
      permissions: ["dealer:inventory:write"],
    });

    const draft = await getListingBuilderDraft(query, access.accessToken);
    return NextResponse.json({ draft });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load listing draft.");
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseListingBuilderDraftRequest(request);
    const access = await authorizeDealerApiRequest(request, {
      dealershipId: payload.dealershipId,
      permissions: ["dealer:inventory:write"],
    });

    await saveListingBuilderDraft(payload, access.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to save listing draft.");
  }
}
