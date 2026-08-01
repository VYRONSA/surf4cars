import { NextResponse } from "next/server";

import { generateDealerInsights } from "@/features/intelligence/server/intelligence.service";
import { parseDealerInsightsInput } from "@/features/intelligence/server/intelligence-request";

export async function POST(request: Request) {
  try {
    const input = await parseDealerInsightsInput(request);
    const payload = await generateDealerInsights(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate dealer insights.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
