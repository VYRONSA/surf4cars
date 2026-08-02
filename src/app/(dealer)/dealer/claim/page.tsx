import type { Metadata } from "next";

import { ClaimDealershipPage } from "@/features/dealership/components/claim-dealership-page";

export const metadata: Metadata = {
  title: "Claim your dealership",
  description: "Take ownership of your dealership's record on SURF4CARS.",
  robots: { index: false, follow: false },
};

export default function DealerClaimRoute() {
  return <ClaimDealershipPage />;
}
