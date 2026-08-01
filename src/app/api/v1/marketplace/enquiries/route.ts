import { NextResponse } from "next/server";

import {
  ACTIVE_BUYER_COOKIE,
  AUTH_USER_TYPE_COOKIE,
} from "@/features/authentication/constants";
import { parseCreateDealerEnquiryRequest } from "@/features/enquiries/server/dealer-enquiry.request";
import { assertEnquiryTargetIsContactable } from "@/features/enquiries/server/dealer-enquiry.service";
import {
  EnquiryPersistenceError,
  persistEnquiry,
} from "@/features/enquiries/server/enquiry-persistence";
import { buildEnquiryFingerprint } from "@/features/enquiries/server/enquiry-fingerprint";
import { notifyDealershipOfEnquiry } from "@/features/notifications";

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

    /* The vehicle must still be for sale, and must belong to the dealership named. Checked before
       anything is written so a stale listing produces a clear message rather than an orphan lead. */
    await assertEnquiryTargetIsContactable(parsed);

    const enquiry = await persistEnquiry({
      ...parsed,
      buyerId: userType === "buyer" ? buyerId : null,
      fingerprint: buildEnquiryFingerprint(parsed),
      sourcePage: request.headers.get("referer"),
    });

    /*
      Notification comes after persistence, and cannot undo it.
      ========================================================
      The lead is committed by this line. `notifyDealershipOfEnquiry` returns an outcome for every
      path and throws on none, so a provider outage cannot turn a recorded enquiry into a 503 — the
      buyer would retype everything and produce a duplicate of a lead that was already safe.

      It is awaited rather than left running. On a serverless host the function is frozen when the
      response is returned, so a floating promise is a send that sometimes happens; and awaiting is
      what lets the confirmation below describe what actually occurred instead of guessing.
    */
    const notification = await notifyDealershipOfEnquiry({
      leadId: enquiry.id,
      dealershipId: parsed.dealershipId,
    });

    return NextResponse.json({
      ok: true,
      duplicate: enquiry.duplicate,
      reference: enquiry.reference,
      /* The single fact the buyer's confirmation turns on. True only when a provider accepted the
         message — never inferred from the enquiry having been saved. */
      dealerNotified: notification.dealerNotified,
      notificationStatus: notification.disposition,
    });
  } catch (error) {
    /*
      Two different failures, two different status codes.
      =================================================
      A persistence failure is ours: 503, because the request was valid and retrying may well work.
      Anything else is a problem with the submission itself: 400, because retrying unchanged will
      not. Collapsing both into 400 told a buyer their details were wrong when our database was down.
    */
    if (error instanceof EnquiryPersistenceError) {
      return NextResponse.json({ error: error.message, retryable: true }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Failed to submit enquiry.";
    return NextResponse.json({ error: message, retryable: false }, { status: 400 });
  }
}
