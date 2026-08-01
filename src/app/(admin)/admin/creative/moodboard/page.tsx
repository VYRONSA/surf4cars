import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoodboardPage, isCreativeReviewAvailable } from "@/features/creative-review";

export const metadata: Metadata = {
  title: "Brand moodboard — Creative direction",
  description: "Every photograph the product leads with, reviewed as one collection.",
  robots: { index: false, follow: false },
};

/** Reads the manifest and the working tree at request time, like the review board it sits beside. */
export const dynamic = "force-dynamic";

export default function AdminCreativeMoodboardPage() {
  /**
   * Belt to the middleware's braces. `/admin/creative/*` is refused before rendering in production —
   * see middleware.ts, which is the only gate that can set a real 404 status on a streamed route.
   */
  if (!isCreativeReviewAvailable()) {
    notFound();
  }

  return <MoodboardPage />;
}
