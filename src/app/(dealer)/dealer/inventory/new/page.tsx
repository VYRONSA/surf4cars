import type { Metadata } from "next";

import { VehicleUploadWizardPage } from "@/features/vehicle-upload";

export const metadata: Metadata = {
  title: "AI Vehicle Listing Builder",
  description: "Create and publish a new vehicle listing with SURF Intelligence-driven workflow.",
};

export default function DealerInventoryNewRoute() {
  return <VehicleUploadWizardPage />;
}
