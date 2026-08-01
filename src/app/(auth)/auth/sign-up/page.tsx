import type { Metadata } from "next";

import { SignUpPage } from "@/features/authentication/components/sign-up-page";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Choose your SURF4CARS account type.",
  robots: { index: false, follow: false },
};

export default function SignUpRoute() {
  return <SignUpPage />;
}
