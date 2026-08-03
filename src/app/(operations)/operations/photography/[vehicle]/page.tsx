import type { Metadata } from "next";

import { VehicleReviewWorkspace } from "@/features/photography-review/vehicle-review-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approval workspace",
  robots: { index: false, follow: false },
};

/**
 * Behind the `/operations` gate in `src/proxy.ts`, like the console it belongs to.
 *
 * The segment accepts either the vehicle id or its slug, because both are things a person ends up
 * with in their clipboard — the queue links by id, and a slug is what you copy out of the live
 * listing you were just looking at.
 */
export default async function OperationsPhotographyVehicleRoute({
  params,
}: {
  params: Promise<{ vehicle: string }>;
}) {
  const { vehicle } = await params;
  return <VehicleReviewWorkspace vehicleId={decodeURIComponent(vehicle)} />;
}
