import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  ImportExecutionError,
  publishImportBatch,
  revertImportBatch,
} from "@/features/dealer-migration/server/import-executor";
import { getImportBatch } from "@/features/dealer-migration/server/import-history";

/** One import run: what it did, row by row, with the dealer's original cells beside each. */
export async function GET(request: Request, context: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await context.params;
    const url = new URL(request.url);
    const dealershipId = url.searchParams.get("dealershipId")?.trim();
    if (!dealershipId) {
      return NextResponse.json({ error: "A dealership is required." }, { status: 400 });
    }

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:inventory:read"],
    });

    const batch = await getImportBatch(batchId, dealershipId, access.accessToken);
    if (!batch) {
      return NextResponse.json({ error: "That import does not exist." }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load that import.");
  }
}

/**
 * Undo, or publish.
 *
 * Both live here because both act on the batch as a whole and both are gated on the same
 * authorisation. Publishing needs a stronger permission than importing does: creating drafts is
 * inventory work, putting listings in front of buyers is a publishing decision.
 */
export async function POST(request: Request, context: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await context.params;
    const url = new URL(request.url);
    const dealershipId = url.searchParams.get("dealershipId")?.trim();
    if (!dealershipId) {
      return NextResponse.json({ error: "A dealership is required." }, { status: 400 });
    }

    const body = (await request.json()) as {
      action?: "revert" | "publish";
      vehicleIds?: string[];
    };

    if (body.action === "revert") {
      const access = await authorizeDealerApiRequest(request, {
        dealershipId,
        permissions: ["dealer:inventory:write"],
      });
      const result = await revertImportBatch({ batchId, dealershipId, accessToken: access.accessToken });
      return NextResponse.json(result);
    }

    if (body.action === "publish") {
      const access = await authorizeDealerApiRequest(request, {
        dealershipId,
        permissions: ["dealer:inventory:publish"],
      });
      const result = await publishImportBatch({
        batchId,
        dealershipId,
        vehicleIds: body.vehicleIds,
        accessToken: access.accessToken,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    if (error instanceof ImportExecutionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return buildDealerAuthorizationErrorResponse(error, "That action could not be completed.");
  }
}
