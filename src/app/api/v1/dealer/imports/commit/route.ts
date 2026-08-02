import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import type { ImportPlan, RowDecision } from "@/features/dealer-migration/domain/import.types";
import { executeImportPlan, ImportExecutionError } from "@/features/dealer-migration/server/import-executor";

/**
 * Commit an approved plan.
 *
 * The plan is re-sent by the client rather than held in a server session, and the decisions arrive
 * alongside it. That keeps the wizard stateless between steps — a dealer can spend twenty minutes on
 * the review screen without a session expiring underneath them — and it means the thing being
 * committed is demonstrably the thing that was shown.
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
      plan?: ImportPlan;
      decisions?: Record<string, RowDecision>;
      defaultBranchId?: string;
    };

    if (!body.plan || !Array.isArray(body.plan.rows)) {
      return NextResponse.json({ error: "There is nothing to import." }, { status: 400 });
    }
    if (body.plan.dealershipId !== dealershipId) {
      return NextResponse.json({ error: "That import belongs to a different dealership." }, { status: 403 });
    }
    if (!body.defaultBranchId) {
      return NextResponse.json({ error: "Choose a branch for these vehicles." }, { status: 400 });
    }

    const decisions: Record<number, RowDecision> = {};
    for (const [key, value] of Object.entries(body.decisions ?? {})) {
      const rowNumber = Number(key);
      if (Number.isFinite(rowNumber)) decisions[rowNumber] = value;
    }

    const result = await executeImportPlan({
      plan: body.plan,
      decisions,
      defaultBranchId: body.defaultBranchId,
      createdBy: access.userId ?? "dealer",
      accessToken: access.accessToken,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ImportExecutionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return buildDealerAuthorizationErrorResponse(error, "The import could not be completed.");
  }
}
