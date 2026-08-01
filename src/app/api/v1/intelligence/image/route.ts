import { NextResponse } from "next/server";

import { analyzeImageIntelligence } from "@/features/intelligence/server/intelligence.service";
import { parseImageIntelligenceInput } from "@/features/intelligence/server/intelligence-request";

export async function POST(request: Request) {
  try {
    const input = await parseImageIntelligenceInput(request);
    const payload = await analyzeImageIntelligence(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze image intelligence.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
