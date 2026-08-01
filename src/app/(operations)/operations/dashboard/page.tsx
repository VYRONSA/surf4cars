import type { Metadata } from "next";

import { OperationsDashboardPage } from "@/features/operations";

export const metadata: Metadata = {
  title: "SURF Operations Centre",
  description: "SURF FOR CARS internal operating system dashboard for platform operations teams.",
  robots: { index: false, follow: false },
};

export default function OperationsDashboardRoute() {
  return <OperationsDashboardPage />;
}
