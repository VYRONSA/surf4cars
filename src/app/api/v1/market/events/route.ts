import { NextResponse } from "next/server";

import { parseBearerToken } from "@/features/inventory/server/inventory-request";
import { ingestAnalyticsEvent } from "@/features/market-intelligence/server/market-intelligence.service";
import { parseAnalyticsEventInput } from "@/features/market-intelligence/server/market-intelligence.request";

export async function POST(request: Request) {
  try {
    const token = parseBearerToken(request.headers.get("authorization"));
    const input = await parseAnalyticsEventInput(request);
    const payload = await ingestAnalyticsEvent(input, token);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to ingest analytics event.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
