import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  parseListingBuilderPublishRequest,
} from "@/features/vehicle-upload/server/listing-builder.request";
import {
  publishListingBuilder,
} from "@/features/vehicle-upload/server/listing-builder.service";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const traceId = `pcp001e-publish-${Math.random().toString(36).slice(2, 10)}`;
  try {
    console.info("[pcp001e][publish-route] request.received", { traceId });
    const payload = await parseListingBuilderPublishRequest(request);
    console.info("[pcp001e][publish-route] request.parsed", {
      traceId,
      dealershipId: payload.dealershipId,
      draftId: payload.draftId,
      publishNow: payload.publishNow,
      hasVehicleId: Boolean(payload.vehicleId),
      elapsedMs: Date.now() - startedAt,
    });

    const access = await authorizeDealerApiRequest(request, {
      dealershipId: payload.dealershipId,
      permissions: ["dealer:inventory:publish"],
    });
    console.info("[pcp001e][publish-route] authorization.complete", {
      traceId,
      userType: access.userType,
      hasAccessToken: Boolean(access.accessToken),
      elapsedMs: Date.now() - startedAt,
    });

    const result = await publishListingBuilder(payload, access.accessToken, traceId);
    console.info("[pcp001e][publish-route] response.ready", {
      traceId,
      vehicleId: result.vehicleId,
      lifecycleStatus: result.lifecycleStatus,
      elapsedMs: Date.now() - startedAt,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[pcp001e][publish-route] error", {
      traceId,
      elapsedMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    });
    return buildDealerAuthorizationErrorResponse(error, "Failed to publish listing.");
  }
}
