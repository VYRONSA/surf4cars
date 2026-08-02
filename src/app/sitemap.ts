import type { MetadataRoute } from "next";

import { env } from "@/config/env";
import { listDealerSlugs } from "@/features/dealer-profile/server/dealer-profile";
import { getVehicleEngine } from "@/services/vehicle-engine";

/**
 * Every page a search engine should know about, built from what is actually published.
 *
 * THE SLUG COMES FROM THE RECORD, NEVER FROM A LOCAL CONCATENATION
 * ================================================================
 * `record.core.slug` is the same value the detail route resolves against. Assembling one here from
 * year/make/model would be a second slug builder, and this codebase has already paid for that twice:
 * a Founder report whose 76 dealer links all returned 404, and a duplicate `buildVehicleSlug` that
 * kept an eight-character discriminator after the canonical one had been raised to twelve — 29
 * colliding slugs, 34 vehicles shadowed. A sitemap full of 404s is worse than no sitemap, because
 * a crawler treats it as a statement about the site's quality.
 *
 * `listPublishable()` is the same read path the marketplace uses, so a vehicle that is not visible
 * to a customer cannot appear here either. That is the property that matters: a sitemap is a public
 * document, and one that names an unpublished listing has disclosed it.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl.replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  /*
    A sitemap must never be the reason a deploy fails — but a failure must never be silent either.

    The first version of this file caught and discarded the error, and shipped a sitemap containing
    six static pages, forty-three dealers and *zero vehicles*. It looked like a working sitemap. That
    is the same swallow-and-carry-on pattern PCP-038 found in the inventory service, reproduced here
    within a day of removing it, which is a fair measure of how easy it is to write.

    So the read still cannot take the route down, and it now says so loudly enough to be found.
  */
  let vehicles: MetadataRoute.Sitemap = [];
  try {
    const records = await getVehicleEngine().listPublishable();
    vehicles = records
      .filter((record) => Boolean(record.slug))
      .map((record) => ({
        url: `${base}/vehicle/${record.slug}`,
        lastModified: record.updatedAt ? new Date(record.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    if (vehicles.length === 0 && records.length > 0) {
      console.error(`[sitemap] ${records.length} publishable vehicles but none carried a slug.`);
    }
  } catch (error) {
    console.error("[sitemap] could not list publishable vehicles", error);
    vehicles = [];
  }

  let dealers: MetadataRoute.Sitemap = [];
  try {
    const entries = await listDealerSlugs();
    dealers = entries.map((entry) => ({
      url: `${base}/dealers/${entry.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("[sitemap] could not list dealer slugs", error);
    dealers = [];
  }

  return [...staticEntries, ...vehicles, ...dealers];
}
