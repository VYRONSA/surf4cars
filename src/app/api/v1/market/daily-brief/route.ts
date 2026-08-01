import { NextResponse } from "next/server";

import { parseBearerToken } from "@/features/inventory/server/inventory-request";
import { parseDealershipIdFromUrl } from "@/features/market-intelligence/server/market-intelligence.request";
import { getDailyIntelligenceBrief } from "@/features/market-intelligence/server/market-intelligence.service";

export async function GET(request: Request) {
  try {
    const dealershipId = parseDealershipIdFromUrl(request);
    const token = parseBearerToken(request.headers.get("authorization"));
    const payload = await getDailyIntelligenceBrief(dealershipId, token);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load daily brief.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
