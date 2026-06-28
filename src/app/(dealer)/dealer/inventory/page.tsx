import type { Metadata } from "next";

import { InventoryIntelligencePage } from "@/features/inventory";

export const metadata: Metadata = {
  title: "Inventory Intelligence",
  description:
    "Smart Inventory Intelligence — AI-powered insights for Atlantic Auto Collective.",
  robots: { index: false, follow: false },
};

export default function DealerInventoryRoute() {
  return <InventoryIntelligencePage />;
}
