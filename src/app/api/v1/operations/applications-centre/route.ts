import { NextResponse } from "next/server";

import {
  authorizeOperationsApiRequest,
  buildOperationsAuthorizationErrorResponse,
} from "@/features/authentication/server/operations-api-authorization";
import { parseOperationsApplicationActionRequest } from "@/features/operations/server/applications-centre.request";
import {
  applyOperationsApplicationAction,
  getApplicationsCentreWorkspaceData,
} from "@/features/operations/server/applications-centre.service";

function permissionByAction(action: string): "operations:view" | "operations:edit" | "operations:approve" | "operations:reject" | "operations:delete" | "operations:export" {
  if (action === "assign" || action === "reassign" || action === "request-information" || action === "mark-complete" || action === "cancel" || action === "set-priority" || action === "add-note" || action === "add-attachment-metadata") {
    return "operations:edit";
  }

  if (action === "approve") return "operations:approve";
  if (action === "reject") return "operations:reject";
  if (action === "archive") return "operations:delete";
  if (action === "export") return "operations:export";

  return "operations:view";
}

export async function GET(request: Request) {
  try {
    await authorizeOperationsApiRequest(request, {
      permissions: ["operations:view"],
    });

    const payload = await getApplicationsCentreWorkspaceData();
    return NextResponse.json(payload);
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to load applications centre.");
  }
}

export async function PATCH(request: Request) {
  try {
    const input = await parseOperationsApplicationActionRequest(request);

    await authorizeOperationsApiRequest(request, {
      permissions: [permissionByAction(input.action)],
    });

    await applyOperationsApplicationAction(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to run application action.");
  }
}
