import type { Metadata } from "next";

import { PhotographyReviewPage } from "@/features/photography-review/photography-review-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Photography review",
  robots: { index: false, follow: false },
};

/**
 * Reachable only through the `/operations` gate in `src/proxy.ts`, which requires the
 * `operations:view` permission — the same authorisation story as the editorial console beside it.
 */
export default function OperationsPhotographyRoute() {
  return <PhotographyReviewPage />;
}
