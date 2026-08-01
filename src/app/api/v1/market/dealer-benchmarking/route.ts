import { NextResponse } from "next/server";

import { analyzeDealerBenchmarking } from "@/features/market-intelligence/server/market-intelligence.service";
import { parseDealerBenchmarkingInput } from "@/features/market-intelligence/server/market-intelligence.request";

export async function POST(request: Request) {
  try {
    const input = await parseDealerBenchmarkingInput(request);
    const payload = await analyzeDealerBenchmarking(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run dealer benchmarking.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
