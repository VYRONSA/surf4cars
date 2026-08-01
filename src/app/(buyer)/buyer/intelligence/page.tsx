import type { Metadata } from "next";

import { BuyerIntelligencePage } from "@/features/buyer-intelligence";

export const metadata: Metadata = {
  title: "Buyer Intelligence Platform",
  description: "SURF4CARS intelligent buying assistant with natural language search and recommendations.",
  robots: { index: false, follow: false },
};

export default function BuyerIntelligenceRoute() {
  return <BuyerIntelligencePage />;
}
