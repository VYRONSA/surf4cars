import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  parseDealershipIdFromUrl,
  parseEnquiryStatusFromUrl,
} from "@/features/enquiries/server/dealer-enquiry.request";
import { listDealerEnquiries } from "@/features/enquiries/server/dealer-enquiry.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);
    const status = parseEnquiryStatusFromUrl(url);

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:leads:read"],
    });

    const enquiries = await listDealerEnquiries({ dealershipId, status });
    return NextResponse.json({ enquiries, actorId: access.userId ?? null });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load enquiries.");
  }
}
