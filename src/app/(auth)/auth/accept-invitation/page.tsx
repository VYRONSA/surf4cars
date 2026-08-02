import type { Metadata } from "next";
import { Suspense } from "react";

import { AcceptInvitationPage } from "@/features/authentication/components/accept-invitation-page";

export const metadata: Metadata = {
  title: "Accept Invitation",
  description: "Join your dealership on SURF4CARS.",
  robots: { index: false, follow: false },
};

export default function AcceptInvitationRoute() {
  return (
    <Suspense fallback={null}>
      <AcceptInvitationPage />
    </Suspense>
  );
}
