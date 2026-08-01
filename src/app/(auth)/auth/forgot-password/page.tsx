import type { Metadata } from "next";

import { ForgotPasswordPage } from "@/features/authentication/components/forgot-password-page";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Recover your SURF4CARS account password.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
