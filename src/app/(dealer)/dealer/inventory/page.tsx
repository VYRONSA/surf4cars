import type { Metadata } from "next";

import { InventoryIntelligencePage } from "@/features/inventory";

export const metadata: Metadata = {
  title: "Inventory Intelligence",
  /* Was "…AI-powered insights for Atlantic Auto Collective." — one dealership's name in the page
     description served to all 128, and the specific name AGENTS.md warns about. */
  description: "Stock, listing quality and pricing for your dealership.",
  robots: { index: false, follow: false },
};

export default function DealerInventoryRoute() {
  return <InventoryIntelligencePage />;
}
