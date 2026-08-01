import type { Metadata } from "next";

import { ResetPasswordPage } from "@/features/authentication/components/reset-password-page";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your SURF4CARS account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordRoute() {
  return <ResetPasswordPage />;
}
