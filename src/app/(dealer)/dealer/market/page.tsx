import type { Metadata } from "next";

import { MarketIntelligencePage } from "@/features/market-intelligence";

export const metadata: Metadata = {
  title: "Market Intelligence Engine",
  description: "SURF4CARS Market Intelligence dashboard and daily intelligence brief for dealers.",
  robots: { index: false, follow: false },
};

export default function DealerMarketIntelligenceRoute() {
  return <MarketIntelligencePage />;
}
