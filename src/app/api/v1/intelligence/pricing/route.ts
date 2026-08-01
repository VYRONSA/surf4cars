import { NextResponse } from "next/server";

import { analyzePricingIntelligence } from "@/features/intelligence/server/intelligence.service";
import { parsePricingIntelligenceInput } from "@/features/intelligence/server/intelligence-request";

export async function POST(request: Request) {
  try {
    const input = await parsePricingIntelligenceInput(request);
    const payload = await analyzePricingIntelligence(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze pricing intelligence.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
