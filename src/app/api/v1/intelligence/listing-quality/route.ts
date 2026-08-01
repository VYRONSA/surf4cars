import { NextResponse } from "next/server";

import { analyzeListingQuality } from "@/features/intelligence/server/intelligence.service";
import { parseListingQualityInput } from "@/features/intelligence/server/intelligence-request";

export async function POST(request: Request) {
  try {
    const input = await parseListingQualityInput(request);
    const payload = await analyzeListingQuality(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze listing quality.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
