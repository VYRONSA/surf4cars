import { NextResponse } from "next/server";

import { parseBearerToken } from "@/features/inventory/server/inventory-request";
import { analyzeInventoryAgeing } from "@/features/market-intelligence/server/market-intelligence.service";
import { parseInventoryAgeingInput } from "@/features/market-intelligence/server/market-intelligence.request";

export async function POST(request: Request) {
  try {
    const token = parseBearerToken(request.headers.get("authorization"));
    const input = await parseInventoryAgeingInput(request);
    const payload = await analyzeInventoryAgeing(input, token);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run inventory ageing intelligence.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
