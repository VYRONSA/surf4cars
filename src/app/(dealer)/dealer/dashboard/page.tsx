import type { Metadata } from "next";

import { DealerDashboardPage } from "@/features/dealer-command-centre";

export const metadata: Metadata = {
  title: "Dealer Command Centre",
  description:
    "Atlantic Auto Collective — executive dashboard for inventory, leads, performance, and AI business insights.",
  robots: { index: false, follow: false },
};

export default function DealerDashboardRoute() {
  return <DealerDashboardPage />;
}
