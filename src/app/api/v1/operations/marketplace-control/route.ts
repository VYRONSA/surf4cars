import { NextResponse } from "next/server";

import {
  authorizeOperationsApiRequest,
  buildOperationsAuthorizationErrorResponse,
} from "@/features/authentication/server/operations-api-authorization";
import { parseMarketplaceControlActionRequest } from "@/features/operations/server/marketplace-control.request";
import {
  applyMarketplaceControlAction,
  getMarketplaceControlWorkspaceData,
} from "@/features/operations/server/marketplace-control.service";

function permissionByAction(action: string): "operations:view" | "operations:edit" | "operations:approve" | "operations:reject" | "operations:delete" | "operations:export" {
  if (action === "approve") return "operations:approve";
  if (action === "reject") return "operations:reject";
  if (action === "archive") return "operations:delete";
  if (action === "export") return "operations:export";
  return "operations:edit";
}

export async function GET(request: Request) {
  try {
    await authorizeOperationsApiRequest(request, {
      permissions: ["operations:view"],
    });

    const url = new URL(request.url);
    const section = url.searchParams.get("section") ?? "overview";
    const payload = await getMarketplaceControlWorkspaceData(section as never);
    return NextResponse.json(payload);
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to load marketplace control workspace.");
  }
}

export async function PATCH(request: Request) {
  try {
    const input = await parseMarketplaceControlActionRequest(request);

    await authorizeOperationsApiRequest(request, {
      permissions: [permissionByAction(input.action)],
    });

    await applyMarketplaceControlAction(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to run marketplace control action.");
  }
}
