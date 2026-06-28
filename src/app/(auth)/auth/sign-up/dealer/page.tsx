import type { Metadata } from "next";

import { DealerOnboardingPage } from "@/features/dealer-onboarding";

export const metadata: Metadata = {
  title: "Dealer Onboarding",
  description:
    "Set up your dealership on SURF FOR CARS — the world's most advanced dealership growth platform.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DealerSignUpPage() {
  return <DealerOnboardingPage />;
}
