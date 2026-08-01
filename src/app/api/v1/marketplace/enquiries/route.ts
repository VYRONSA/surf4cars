import { NextResponse } from "next/server";

import {
  ACTIVE_BUYER_COOKIE,
  AUTH_USER_TYPE_COOKIE,
} from "@/features/authentication/constants";
import { parseCreateDealerEnquiryRequest } from "@/features/enquiries/server/dealer-enquiry.request";
import { createDealerEnquiry } from "@/features/enquiries/server/dealer-enquiry.service";

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    cookies.set(trimmed.slice(0, separator), decodeURIComponent(trimmed.slice(separator + 1)));
  }

  return cookies;
}

export async function POST(request: Request) {
  try {
    const parsed = await parseCreateDealerEnquiryRequest(request);
    const cookies = parseCookieHeader(request.headers.get("cookie"));
    const buyerId = cookies.get(ACTIVE_BUYER_COOKIE)?.trim() || null;
    const userType = cookies.get(AUTH_USER_TYPE_COOKIE)?.trim() || null;

    const result = await createDealerEnquiry({
      ...parsed,
      buyerId: userType === "buyer" ? buyerId : null,
    });

    return NextResponse.json({ ok: true, duplicate: result.duplicate, enquiry: result.enquiry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit enquiry.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
