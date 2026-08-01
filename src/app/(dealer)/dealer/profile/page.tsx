import type { Metadata } from "next";
import { cookies } from "next/headers";

import { DealershipProfilePage } from "@/features/dealership/dealership-profile-page";
import { ACTIVE_DEALERSHIP_COOKIE } from "@/features/authentication/constants";

export const metadata: Metadata = {
  title: "Dealership Profile | SURF FOR CARS",
  description: "Manage dealership profile, branding, and contact information.",
};

export default async function DealerProfileRoutePage() {
  const cookieStore = await cookies();
  const initialDealershipId = cookieStore.get(ACTIVE_DEALERSHIP_COOKIE)?.value ?? null;

  return <DealershipProfilePage initialDealershipId={initialDealershipId} />;
}
