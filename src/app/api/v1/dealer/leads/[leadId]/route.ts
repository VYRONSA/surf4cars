import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  parseDealershipIdFromUrl,
  parseDealerEnquiryActionRequest,
} from "@/features/enquiries/server/dealer-enquiry.request";
import {
  applyDealerEnquiryAction,
  getDealerEnquiry,
} from "@/features/enquiries/server/dealer-enquiry.service";

export async function GET(
  request: Request,
  { params }: { readonly params: Promise<{ readonly leadId: string }> },
) {
  try {
    const { leadId } = await params;
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);

    await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:leads:read"],
    });

    const enquiry = await getDealerEnquiry(dealershipId, leadId);
    return NextResponse.json(enquiry);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load enquiry.");
  }
}

export async function PATCH(
  request: Request,
  { params }: { readonly params: Promise<{ readonly leadId: string }> },
) {
  try {
    const { leadId } = await params;
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:leads:manage"],
    });

    const action = await parseDealerEnquiryActionRequest(request);
    const actorName = "actorName" in action && action.actorName ? action.actorName : undefined;
    const actorId = access.userId ?? ("actorId" in action ? action.actorId : undefined);

    const patchedAction = {
      ...action,
      actorId,
      actorName,
    };

    const enquiry = await applyDealerEnquiryAction(dealershipId, leadId, patchedAction);
    return NextResponse.json(enquiry);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to update enquiry.");
  }
}
