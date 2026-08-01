import type { Metadata } from "next";

import { SignInPage } from "@/features/authentication/components/sign-in-page";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your SURF4CARS account.",
  robots: { index: false, follow: false },
};

export default function SignInRoute() {
  return <SignInPage />;
}
