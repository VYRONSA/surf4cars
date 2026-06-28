import type { Metadata } from "next";

import { HomePage } from "@/features/marketplace/homepage";
import { APP_DESCRIPTION, APP_METADATA, APP_NAME } from "@/constants";

const title = "SURF FOR CARS — Premium Automotive Discovery";
const description =
  "South Africa's premium automotive technology platform. Intelligent search, modern dealerships, and a experience built for what's next.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: APP_METADATA.url,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: APP_METADATA.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${APP_METADATA.url}/search`,
    "query-input": "required name=search_term_string",
  },
};

export default function PublicHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage />
    </>
  );
}
