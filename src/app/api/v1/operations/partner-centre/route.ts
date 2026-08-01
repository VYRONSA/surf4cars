import { NextResponse } from "next/server";

import {
  authorizeOperationsApiRequest,
  buildOperationsAuthorizationErrorResponse,
} from "@/features/authentication/server/operations-api-authorization";
import {
  getPartnerCentreSectionBySlug,
  type PartnerCentreSectionId,
} from "@/features/operations/config/partner-centre-sections";
import { parsePartnerCentreActionRequest } from "@/features/operations/server/partner-centre.request";
import {
  applyPartnerCentreAction,
  getPartnerCentreWorkspaceData,
} from "@/features/operations/server/partner-centre.service";

function permissionByAction(action: string): "operations:view" | "operations:create" | "operations:edit" | "operations:approve" | "operations:suspend" | "operations:restore" | "operations:export" | "operations:manage" {
  if (action === "create") return "operations:create";
  if (action === "edit" || action === "add-note" || action === "change-status") return "operations:edit";
  if (action === "approve") return "operations:approve";
  if (action === "suspend") return "operations:suspend";
  if (action === "restore") return "operations:restore";
  if (action === "export") return "operations:export";
  if (action === "manage") return "operations:manage";
  return "operations:view";
}

export async function GET(request: Request) {
  try {
    await authorizeOperationsApiRequest(request, {
      permissions: ["operations:view"],
    });

    const url = new URL(request.url);
    const section = url.searchParams.get("section");
    const sectionMatch = section ? getPartnerCentreSectionBySlug(section) : null;
    const sectionId: PartnerCentreSectionId = sectionMatch?.id ?? "overview";

    const payload = await getPartnerCentreWorkspaceData(sectionId);
    return NextResponse.json(payload);
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to load partner centre workspace.");
  }
}

export async function PATCH(request: Request) {
  try {
    const input = await parsePartnerCentreActionRequest(request);

    await authorizeOperationsApiRequest(request, {
      permissions: [permissionByAction(input.action)],
    });

    await applyPartnerCentreAction(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to run partner centre action.");
  }
}
