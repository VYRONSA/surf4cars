import type { MetadataRoute } from "next";

import { env } from "@/config/env";

/**
 * What a crawler may index.
 *
 * WHY THE DISALLOW LIST IS NOT THE SECURITY BOUNDARY
 * ==================================================
 * Every path below already refuses an unauthenticated request — `/dealer/*`, `/operations/*` and
 * `/buyer` all redirect, and the API returns 401. This file changes nothing about who can reach
 * them. It exists so a crawler does not waste its budget on redirects, and so the sign-in page does
 * not accumulate index entries from a hundred `?redirect=` variants.
 *
 * Saying that plainly matters: a `Disallow` line is a request to well-behaved crawlers, and reading
 * it as protection is how a private path ends up relying on one.
 */
export default function robots(): MetadataRoute.Robots {
  const base = env.appUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dealer/",
          "/operations/",
          "/buyer/",
          "/auth/",
          "/unauthorized",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
