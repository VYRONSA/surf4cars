import { NextResponse } from "next/server";

import { analyzeDescriptionBuilder } from "@/features/intelligence/server/intelligence.service";
import { parseDescriptionBuilderInput } from "@/features/intelligence/server/intelligence-request";

export async function POST(request: Request) {
  try {
    const input = await parseDescriptionBuilderInput(request);
    const payload = await analyzeDescriptionBuilder(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run description builder.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
