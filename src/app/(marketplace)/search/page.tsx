import type { Metadata } from "next";

import { resolveSearchSeoMetadata } from "@/features/search/config";
import { SearchPage } from "@/features/search";

const seo = resolveSearchSeoMetadata();

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  alternates: {
    canonical: seo.canonicalPath,
  },
  robots: {
    index: seo.indexable,
    follow: seo.indexable,
  },
  openGraph: {
    title: seo.title,
    description: seo.description,
    type: "website",
  },
};

export default function VehicleSearchPage() {
  return <SearchPage />;
}
