import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import { buildImportPlan } from "@/features/dealer-migration/server/import-planner";
import { loadPlanContext } from "@/features/dealer-migration/server/import-context";

/**
 * Read a file, propose a mapping, and say exactly what would happen. Writes nothing.
 *
 * The whole review-before-write posture depends on this being free of consequence: a dealer can
 * upload, look at the outcome, change the mapping and look again, as many times as they like,
 * without anything existing. Nothing here touches inventory.
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
      permissions: ["dealer:inventory:write"],
    });

    const body = (await request.json()) as {
      fileName?: string;
      content?: string;
      adapterId?: string;
    };

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json({ error: "Upload a file to continue." }, { status: 400 });
    }

    const context = await loadPlanContext(dealershipId, access.accessToken);

    const plan = buildImportPlan({
      dealershipId,
      fileName: body.fileName?.trim() || "upload.csv",
      content: body.content,
      adapterId: body.adapterId,
      existing: context.existing,
      corpus: context.corpus,
      branchNames: context.branchNames,
    });

    return NextResponse.json({ plan, branches: context.branches });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to read that file.");
  }
}
