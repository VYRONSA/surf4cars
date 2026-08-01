import { NextResponse } from "next/server";

import {
  authorizeOperationsApiRequest,
  buildOperationsAuthorizationErrorResponse,
} from "@/features/authentication/server/operations-api-authorization";
import { parseRevenueCentreActionRequest } from "@/features/operations/server/revenue-centre.request";
import { applyRevenueCentreAction, getRevenueCentreWorkspaceData } from "@/features/operations/server/revenue-centre.service";
import { getRevenueCentreSectionBySlug, type RevenueCentreSectionId } from "@/features/operations/config/revenue-centre-sections";

function permissionByAction(action: string): "operations:view" | "operations:edit" | "operations:approve" | "operations:reject" | "operations:delete" | "operations:export" {
  if (action === "approve") return "operations:approve";
  if (action === "refund") return "operations:reject";
  if (action === "adjust") return "operations:edit";
  if (action === "export") return "operations:export";
  return "operations:view";
}

export async function GET(request: Request) {
  try {
    await authorizeOperationsApiRequest(request, {
      permissions: ["operations:view"],
    });

    const url = new URL(request.url);
    const section = url.searchParams.get("section");
    const sectionMatch = section ? getRevenueCentreSectionBySlug(section) : null;
    const sectionId: RevenueCentreSectionId = sectionMatch?.id ?? "overview";
    const payload = await getRevenueCentreWorkspaceData(sectionId);
    return NextResponse.json(payload);
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to load revenue centre workspace.");
  }
}

export async function PATCH(request: Request) {
  try {
    const input = await parseRevenueCentreActionRequest(request);

    await authorizeOperationsApiRequest(request, {
      permissions: [permissionByAction(input.action)],
    });

    await applyRevenueCentreAction(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to run revenue centre action.");
  }
}
