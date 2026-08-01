import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CreativeReviewPage, isCreativeReviewAvailable } from "@/features/creative-review";

export const metadata: Metadata = {
  title: "Media review — Creative direction",
  description: "Founder review and approval of candidate brand photography.",
  robots: { index: false, follow: false },
};

/**
 * The board reads the working tree at request time — a shortlist refreshed in another terminal has
 * to be one reload away, not one restart away.
 */
export const dynamic = "force-dynamic";

export default function AdminCreativeMediaReviewPage() {
  /**
   * Approving writes into `public/media/premium/` and regenerates a committed source module, so this
   * is local curation work by construction. In a deployed environment those writes would fail or be
   * erased by the next deploy, and a button that silently does not record an approval is worse than
   * no button — so the route does not exist there at all.
   */
  if (!isCreativeReviewAvailable()) {
    notFound();
  }

  return <CreativeReviewPage />;
}
