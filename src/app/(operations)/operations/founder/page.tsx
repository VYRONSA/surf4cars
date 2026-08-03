import type { Metadata } from "next";

import { FounderDashboardPage } from "@/features/founder-dashboard/founder-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Founder dashboard",
  robots: { index: false, follow: false },
};

/**
 * Behind the `/operations` gate in `src/proxy.ts`, like every other operations surface.
 *
 * `force-dynamic` deliberately: this is a control panel, and a cached one would tell the Founder the
 * queue was clear a minute after they cleared it — or, worse, that it was not.
 */
export default function OperationsFounderRoute() {
  return <FounderDashboardPage />;
}
