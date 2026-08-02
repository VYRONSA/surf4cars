import type { Metadata } from "next";

import { FoundingDealerPage } from "@/features/pricing/founding-dealer-page";
import {
  FOUNDING_PROGRAMME_FREE_UNTIL,
  FOUNDING_PROGRAMME_PLACES,
} from "@/features/pricing/config/founding-programme";

export const metadata: Metadata = {
  title: "Founding Dealer Programme",
  description: `Join the first ${FOUNDING_PROGRAMME_PLACES} dealerships shaping South Africa's next premium automotive marketplace. Free until ${FOUNDING_PROGRAMME_FREE_UNTIL}.`,
};

export default function PricingRoute() {
  return <FoundingDealerPage />;
}
