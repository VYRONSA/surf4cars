import { NextResponse } from "next/server";

import { analyzeIntelligenceBundle } from "@/features/intelligence/server/intelligence.service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      readonly listing?: Parameters<typeof analyzeIntelligenceBundle>[0]["listing"];
      readonly pricing?: Parameters<typeof analyzeIntelligenceBundle>[0]["pricing"];
      readonly images?: Parameters<typeof analyzeIntelligenceBundle>[0]["images"];
      readonly market?: Parameters<typeof analyzeIntelligenceBundle>[0]["market"];
      readonly lifecycleStatus?: string;
      readonly leadCount30d?: number;
      readonly daysInStock?: number;
      readonly serviceHistoryAvailable?: boolean;
    };

    if (!body.listing || !body.pricing || !body.images || !body.market) {
      throw new Error("listing, pricing, images, and market payloads are required.");
    }

    const payload = await analyzeIntelligenceBundle({
      listing: body.listing,
      pricing: body.pricing,
      images: body.images,
      market: body.market,
      lifecycleStatus: body.lifecycleStatus,
      leadCount30d: body.leadCount30d,
      daysInStock: body.daysInStock,
      serviceHistoryAvailable: body.serviceHistoryAvailable,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute intelligence analysis.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
