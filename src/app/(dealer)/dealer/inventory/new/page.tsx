import type { Metadata } from "next";

import { VehicleUploadWizardPage } from "@/features/vehicle-upload";

export const metadata: Metadata = {
  title: "Add Vehicle",
  description: "Upload a new vehicle to your dealer inventory on SURF FOR CARS.",
};

export default function DealerInventoryNewRoute() {
  return <VehicleUploadWizardPage />;
}
