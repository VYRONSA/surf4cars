import type { Metadata } from "next";

import { VerifyEmailPage } from "@/features/authentication/components/verify-email-page";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your SURF4CARS email address.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailRoute() {
  return <VerifyEmailPage />;
}
