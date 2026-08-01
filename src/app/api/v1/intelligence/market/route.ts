import { NextResponse } from "next/server";

import { analyzeMarketIntelligence } from "@/features/intelligence/server/intelligence.service";
import { parseMarketIntelligenceInput } from "@/features/intelligence/server/intelligence-request";

export async function POST(request: Request) {
  try {
    const input = await parseMarketIntelligenceInput(request);
    const payload = await analyzeMarketIntelligence(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze market intelligence.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
