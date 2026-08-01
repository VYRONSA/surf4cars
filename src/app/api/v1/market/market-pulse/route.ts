import { NextResponse } from "next/server";

import { analyzeMarketPulse } from "@/features/market-intelligence/server/market-intelligence.service";
import { parseMarketPulseInput } from "@/features/market-intelligence/server/market-intelligence.request";

export async function POST(request: Request) {
  try {
    const input = await parseMarketPulseInput(request);
    const payload = await analyzeMarketPulse(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run market pulse analysis.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
