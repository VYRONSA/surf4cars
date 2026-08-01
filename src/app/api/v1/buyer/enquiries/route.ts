import { NextResponse } from "next/server";

import {
  authorizeBuyerApiRequest,
  buildBuyerAuthorizationErrorResponse,
} from "@/features/authentication/server/buyer-api-authorization";
import { parseBuyerIdFromUrl } from "@/features/enquiries/server/dealer-enquiry.request";
import { listBuyerEnquiries } from "@/features/enquiries/server/dealer-enquiry.service";

export async function GET(request: Request) {
  try {
    const buyerId = parseBuyerIdFromUrl(new URL(request.url));
    const access = await authorizeBuyerApiRequest(request, {
      buyerId,
      permissions: ["buyer:activity:view"],
    });

    const enquiries = await listBuyerEnquiries(access.buyerId);
    return NextResponse.json({ enquiries });
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to load buyer enquiries.");
  }
}
