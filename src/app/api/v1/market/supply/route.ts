import { NextResponse } from "next/server";

import { analyzeSupply } from "@/features/market-intelligence/server/market-intelligence.service";
import { parseSupplyAnalysisInput } from "@/features/market-intelligence/server/market-intelligence.request";

export async function POST(request: Request) {
  try {
    const input = await parseSupplyAnalysisInput(request);
    const payload = await analyzeSupply(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run supply analysis.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
