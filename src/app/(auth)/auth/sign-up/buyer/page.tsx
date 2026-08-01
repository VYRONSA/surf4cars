import type { Metadata } from "next";

import { BuyerSignUpPage } from "@/features/authentication/components/buyer-sign-up-page";

export const metadata: Metadata = {
  title: "Buyer Sign Up",
  description: "Create a SURF4CARS buyer account.",
  robots: { index: false, follow: false },
};

export default function BuyerSignUpRoute() {
  return <BuyerSignUpPage />;
}
