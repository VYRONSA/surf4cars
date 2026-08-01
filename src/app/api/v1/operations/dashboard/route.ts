import { NextResponse } from "next/server";

import {
  authorizeOperationsApiRequest,
  buildOperationsAuthorizationErrorResponse,
} from "@/features/authentication/server/operations-api-authorization";
import { getOperationsDashboardData } from "@/features/operations/server/operations-dashboard.service";

export async function GET(request: Request) {
  try {
    const access = await authorizeOperationsApiRequest(request, {
      permissions: ["operations:view"],
    });

    const payload = await getOperationsDashboardData(access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to load operations dashboard.");
  }
}
