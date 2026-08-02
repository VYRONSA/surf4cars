import { HomeBrandRail } from "@/features/marketplace/homepage/components/home-brand-rail";
import { HomeCta } from "@/features/marketplace/homepage/components/home-cta";
import { HomeDealerSpotlight } from "@/features/marketplace/homepage/components/home-dealer-spotlight";
import { HomeFeaturedEditorial } from "@/features/marketplace/homepage/components/home-featured-editorial";
import { HomeHeroV2 } from "@/features/marketplace/homepage/components/home-hero-v2";
import { HomeLifestyleCollections } from "@/features/marketplace/homepage/components/home-lifestyle-collections";
import { HomeWhyBuyers } from "@/features/marketplace/homepage/components/home-why-buyers";
import { loadHomepageStock } from "@/features/marketplace/homepage/server/homepage-stock";
import { selectBrands } from "@/services/presentation";

/**
 * Homepage V3 — brand-first.
 *
 * V2 was a well-built marketplace homepage: hero, stock, categories, value story, dealers, AI, CTA. It
 * answered "what can I search for here". V3 answers a different question, because people fall in love
 * with cars long before they start filtering them.
 *
 * The order is the emotional journey, and each section has one feeling to produce:
 *
 *   hero        inspire   — Cape Town at blue hour, and one instruction: find the one
 *   marques     invite    — brands, not body styles. Nobody wants "a sedan"
 *   featured    desire    — six cars, photographed large enough to want
 *   collections imagine   — a life, and the vehicle that belongs to it
 *   latest      discover  — a reason to come back on Thursday
 *   spotlight   trust     — one real dealership, presented as a business
 *   why         reassure  — the three promises, told editorially over one photograph
 *   cta         convert   — the supply side, last, where it belongs
 *
 * Two things left V2 deliberately.
 *
 * The body-style band is gone, replaced by lifestyle collections. "Panel Van" is filter vocabulary: it
 * is what you use once you already know, and it was the weakest section on the page.
 *
 * The dealer-facing AI section is gone from the buyer homepage. Every one of its claims was a reason a
 * *dealership* should buy the platform, shown to somebody who came to look at cars — the same mismatch
 * that made "Built for the future of automotive" read as SaaS. It belongs on the dealer acquisition
 * journey, which `HomeCta` opens.
 *
 * Vehicle sections read live marketplace stock and render nothing where stock cannot be read, rather
 * than falling back to the invented listings the original homepage shipped.
 */
export async function HomePage() {
  const { featured, collections, total, countsByMake, facets, spotlight } = await loadHomepageStock();

  /* The rail is a wall of marks, so it takes only marques we hold artwork for — a brand name set in type
     between nine coloured logos reads as a missing image. Everything else is reached via the rail's "All"
     link and is unaffected in search. */
  const brands = selectBrands(countsByMake, { artworkOnly: true, limit: 10 });

  return (
    <>
      <HomeHeroV2 vehicleCount={total} facets={facets} />

      {/*
        Stock first. Everything editorial waits.
        =======================================
        Two things used to sit between the hero and any browsable inventory: a curated "This week's
        featured vehicles" spread, and the lifestyle collections. Both are good sections and both
        answer a question the visitor has not asked yet.

        Somebody arriving on a car marketplace is asking one thing — *show me cars I can buy* — and a
        magazine spread of five hand-picked vehicles answers "here is what we think you should want".
        The order now answers the visitor first and the editor second: real stock, then the ways in,
        then the curation for people still browsing rather than shopping.

        The section is unchanged in substance — it was already reading live published inventory — but
        it now presents as stock rather than as a collection: a uniform grid, and a route to the full
        marketplace rather than a curatorial rationale.
      */}
      <HomeFeaturedEditorial
        eyebrow="Available now"
        title="Cars you can buy today"
        description={
          total > 0
            ? `${total.toLocaleString("en-ZA")} vehicles listed by South African dealerships, every one with a full gallery and specification.`
            : undefined
        }
        listings={featured}
        viewAllHref="/search"
        layout="uniform"
        priority
      />

      <HomeBrandRail brands={brands} />

      {/*
        Every published collection, in the Founder's order.
        =================================================
        One rail used to be hardcoded here. Now the page maps whatever the editorial console has
        published — Founder's Collection, Spring Collection, Performance Week — so launching a
        campaign is publishing a slot, and this file does not change for any of them.

        Ordering is the console's: `editorial_slots.position`.
      */}
      {collections.map((section) => (
        <HomeFeaturedEditorial
          key={section.key}
          eyebrow="Collection"
          title={section.headline}
          description={section.description ?? undefined}
          listings={section.listings}
          viewAllHref="/search"
          layout="uniform"
        />
      ))}

      {/* Editorial lives here now — past the stock, for visitors still browsing rather than shopping. */}
      <HomeLifestyleCollections />

      {spotlight && <HomeDealerSpotlight spotlight={spotlight} />}

      <HomeWhyBuyers />
      <HomeCta />
    </>
  );
}
