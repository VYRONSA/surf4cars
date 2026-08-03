import type { Metadata } from "next";

import { HomePage } from "@/features/marketplace/homepage";
import { APP_DESCRIPTION, APP_METADATA, APP_NAME } from "@/constants";
import { PREMIUM_IMAGES } from "@/config/images";

/**
 * The homepage is a shop window, so it may not be frozen at build time.
 *
 * WHAT WAS ACTUALLY HAPPENING
 * ===========================
 * This route prerendered as static (`○ /` in the build output) because nothing on it opted into
 * dynamic rendering. Every number and every vehicle on the marketplace's front page was therefore
 * whatever had been true at the moment of the last deploy: a dealership publishing stock did not
 * appear until somebody shipped, and — the reason this was found — a Dealer Spotlight approved in
 * the Editorial Console did nothing at all.
 *
 * That last one matters commercially rather than cosmetically. The rule for the spotlight is that
 * only an approved dealership may appear there; if approving one has no effect until a rebuild, the
 * approval is not a control, and the console is a form that appears to work.
 *
 * A minute, not `force-dynamic`. The homepage does real work — it reads every publishable vehicle,
 * ranks it, segments it and builds the search facets — and rendering that per request would put a
 * full marketplace read in front of the most-hit page on the site. Revalidation serves the cached
 * copy and regenerates behind it, so the cost is at most one background render per minute however
 * much traffic arrives, and a dealer who publishes a car sees it on the front page within one.
 */
export const revalidate = 60;

const title = "SURF FOR CARS — Premium Automotive Discovery";
const description =
  "Every vehicle, every verified dealer, and the intelligence to tell you which one is actually worth buying.";

export const metadata: Metadata = {
  /*
    `absolute`, so the root template does not append the brand a second time.
    ========================================================================
    The layout defines `template: "%s | SURF FOR CARS"`, which is right for every page whose title
    does not already name the brand — "Search Vehicles", a vehicle's make and model. This page's
    title does name it, so the tab read:

        SURF FOR CARS — Premium Automotive Discovery | SURF FOR CARS

    That is the browser tab, the Google result and the preview on every shared link, saying the
    company's name twice. Found by walking the journey and reading the tab, which is the one piece of
    the interface no screenshot of the page ever contains.
  */
  title: { absolute: title },
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
    /*
      The homepage had no `og:image` at all.
      =====================================
      Only the vehicle page set one, so sharing the site itself — the link most likely to be posted,
      and on WhatsApp the way most things are shared in South Africa — produced a bare text card. On
      a marketplace whose entire argument is photography.

      The hero frame is the right image: it is the brand's best asset, it is already commissioned,
      and it is what somebody sees a second later when they follow the link.
    */
    images: [
      {
        url: PREMIUM_IMAGES.hero.homepage,
        alt: "A car on Chapman's Peak above Cape Town at blue hour",
      },
    ],
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
