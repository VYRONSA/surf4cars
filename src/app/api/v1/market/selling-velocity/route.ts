import { NextResponse } from "next/server";

import { analyzeSellingVelocity } from "@/features/market-intelligence/server/market-intelligence.service";
import { parseSellingVelocityInput } from "@/features/market-intelligence/server/market-intelligence.request";

export async function POST(request: Request) {
  try {
    const input = await parseSellingVelocityInput(request);
    const payload = await analyzeSellingVelocity(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run selling velocity analysis.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
