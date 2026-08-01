import { NextResponse } from "next/server";

import {
  authorizeOperationsApiRequest,
  buildOperationsAuthorizationErrorResponse,
} from "@/features/authentication/server/operations-api-authorization";
import {
  getBusinessIntelligenceSectionBySlug,
  type BusinessIntelligenceSectionId,
} from "@/features/operations/config/business-intelligence-sections";
import { parseBusinessIntelligenceActionRequest } from "@/features/operations/server/business-intelligence.request";
import {
  applyBusinessIntelligenceAction,
  getBusinessIntelligenceWorkspaceData,
} from "@/features/operations/server/business-intelligence.service";

function permissionByAction(action: string): "operations:view" | "operations:export" | "operations:manage" {
  if (action === "export-report") return "operations:export";
  if (action === "refresh-snapshot" || action === "acknowledge-risk") return "operations:manage";
  return "operations:view";
}

export async function GET(request: Request) {
  try {
    await authorizeOperationsApiRequest(request, {
      permissions: ["operations:view"],
    });

    const url = new URL(request.url);
    const section = url.searchParams.get("section");
    const sectionMatch = section ? getBusinessIntelligenceSectionBySlug(section) : null;
    const sectionId: BusinessIntelligenceSectionId = sectionMatch?.id ?? "overview";

    const payload = await getBusinessIntelligenceWorkspaceData(sectionId);
    return NextResponse.json(payload);
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to load business intelligence workspace.");
  }
}

export async function PATCH(request: Request) {
  try {
    const input = await parseBusinessIntelligenceActionRequest(request);

    await authorizeOperationsApiRequest(request, {
      permissions: [permissionByAction(input.action)],
    });

    await applyBusinessIntelligenceAction(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to run business intelligence action.");
  }
}