import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ACTIVE_DEALERSHIP_COOKIE } from "@/features/authentication/constants";
import { DealershipTeamPage } from "@/features/dealership/dealership-team-page";

export const metadata: Metadata = {
  title: "Team Management | SURF FOR CARS",
  description: "Manage dealership team memberships, roles, and branch assignments.",
};

export default async function DealerTeamRoutePage() {
  const cookieStore = await cookies();
  const initialDealershipId = cookieStore.get(ACTIVE_DEALERSHIP_COOKIE)?.value ?? null;

  return <DealershipTeamPage initialDealershipId={initialDealershipId} />;
}
