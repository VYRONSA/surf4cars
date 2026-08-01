import type { Metadata } from "next";
import { cookies } from "next/headers";

import { DealershipBranchesPage } from "@/features/dealership/dealership-branches-page";
import { ACTIVE_DEALERSHIP_COOKIE } from "@/features/authentication/constants";

export const metadata: Metadata = {
  title: "Branch Management | SURF FOR CARS",
  description: "Manage dealership branches, contact details, and operating hours.",
};

export default async function DealerBranchesRoutePage() {
  const cookieStore = await cookies();
  const initialDealershipId = cookieStore.get(ACTIVE_DEALERSHIP_COOKIE)?.value ?? null;

  return <DealershipBranchesPage initialDealershipId={initialDealershipId} />;
}
