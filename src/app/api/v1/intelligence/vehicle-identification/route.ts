import { NextResponse } from "next/server";

import { analyzeVehicleIdentification } from "@/features/intelligence/server/intelligence.service";
import { parseVehicleIdentificationInput } from "@/features/intelligence/server/intelligence-request";

export async function POST(request: Request) {
  try {
    const input = await parseVehicleIdentificationInput(request);
    const payload = await analyzeVehicleIdentification(input);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run vehicle identification.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
