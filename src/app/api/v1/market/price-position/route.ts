import { NextResponse } from "next/server";

import { analyzePricePosition } from "@/features/market-intelligence/server/market-intelligence.service";
import { parsePricePositionInput } from "@/features/market-intelligence/server/market-intelligence.request";

export async function POST(request: Request) {
  try {
    const input = await parsePricePositionInput(request);
    const payload = await analyzePricePosition(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run price position analysis.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
