import { NextResponse } from "next/server";

import { analyzeLicenceDiscOcr } from "@/features/intelligence/server/intelligence.service";
import { parseLicenceDiscOcrInput } from "@/features/intelligence/server/intelligence-request";

export async function POST(request: Request) {
  try {
    const input = await parseLicenceDiscOcrInput(request);
    const payload = await analyzeLicenceDiscOcr(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run licence disc OCR.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
