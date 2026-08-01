import { NextResponse } from "next/server";

import { analyzeDemand } from "@/features/market-intelligence/server/market-intelligence.service";
import { parseDemandAnalysisInput } from "@/features/market-intelligence/server/market-intelligence.request";

export async function POST(request: Request) {
  try {
    const input = await parseDemandAnalysisInput(request);
    const payload = await analyzeDemand(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run demand analysis.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
