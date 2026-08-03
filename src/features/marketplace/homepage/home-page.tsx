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
  const { rails, collections, total, countsByMake, countsByBodyType, countsByFuel, facets, spotlight } =
    await loadHomepageStock();

  /* The rail is a wall of marks, so it takes only marques we hold artwork for — a brand name set in type
     between nine coloured logos reads as a missing image. Everything else is reached via the rail's "All"
     link and is unaffected in search. */
  const brands = selectBrands(countsByMake, { artworkOnly: true, limit: 10 });

  /*
    "Remaining marketplace content" is the last vehicle section on the page, so it is split out of
    the rail list here rather than rendered with the segments it follows.
  */
  const segmentRails = rails.filter((rail) => rail.key !== "marketplace");
  const marketplaceRail = rails.find((rail) => rail.key === "marketplace");
  const hasVehicleRails = rails.length > 0;

  return (
    <>
      <HomeHeroV2 vehicleCount={total} facets={facets} />

      {/*
        Vehicles for sale, immediately, in bands — and editorial nowhere near the hero.
        =============================================================================
        Three arrangements preceded this one and each is worth a line, because the order of this page
        has been the single most-revised decision in the product.

        V1 put a curated editorial spread and the lifestyle collections between the hero and any
        browsable inventory: a magazine answering a question the visitor had not asked. V2 replaced
        that with one rail of live stock ordered by listing completeness — honest, and flat, because
        "best-filled-in form" is a fact about admin rather than about cars. V3 ranked that same stock
        by how aspirational it genuinely is, which fixed *what* led the page but left one long rail
        where a showroom has departments.

        This is V4, and the change is structural rather than cosmetic: the marketplace is presented
        the way a dealership floor is laid out. Sports and performance, luxury, premium SUVs,
        executive saloons, family, then work vehicles — each a rule rather than a hand-picked list,
        each vehicle in exactly one band, and every band omitted entirely when the stock cannot fill
        it. See `HOMEPAGE_SEGMENTS`.

        The visitor's first scroll is now stock, stock, stock. Editorial waits until after the
        dealership, which is where inspiration belongs once shopping has been offered.
      */}
      {segmentRails.map((rail, index) => (
        <HomeFeaturedEditorial
          key={rail.key}
          railKey={rail.key}
          eyebrow={rail.eyebrow}
          title={rail.headline}
          description={rail.description ?? undefined}
          listings={rail.listings}
          viewAllHref="/search"
          /* The first rail carries the page, so it gets the asymmetric grid and the preloaded
             photograph. Every rail below it is a row of equals. */
          layout={index === 0 ? "lead" : "uniform"}
          priority={index === 0}
        />
      ))}

      {/*
        The broader marketplace, and it sits *with* the vehicles rather than after the editorial.
        ========================================================================================
        PCP-042 placed this last, below the collections, which was right while the premium rails
        above it were always populated. PCP-043 made those rails conditional on Founder approval, and
        the first walk after that change showed what the old order really depended on: with nothing
        approved, the vehicle rails vanished and "Find your next journey" arrived 118px below the
        hero — the exact arrangement the previous brief was written to end.

        The rule the Founder has stated three times is the one to encode: the first thing below the
        hero is vehicles for sale. So the marketplace rail is part of the vehicle block, and editorial
        cannot float up past it however curation is set.
      */}
      {marketplaceRail && (
        <HomeFeaturedEditorial
          railKey={marketplaceRail.key}
          eyebrow={marketplaceRail.eyebrow}
          title={marketplaceRail.headline}
          description={
            total > 0
              ? `${total.toLocaleString("en-ZA")} vehicles listed by South African dealerships, every one with a full gallery and specification.`
              : undefined
          }
          listings={marketplaceRail.listings}
          viewAllHref="/search"
          layout="uniform"
        />
      )}

      {/* Navigation into the same inventory, so it stays with the shopping block rather than being
          filed under editorial. */}
      <HomeBrandRail brands={brands} />

      {/* An approved editorial placement, or nothing at all. Never a substituted dealership. */}
      {spotlight && <HomeDealerSpotlight spotlight={spotlight} />}

      {/*
        Editorial, and only now.
        =======================
        Both editorial surfaces sit here, below the dealership and well below the stock: the
        collections the Founder publishes from the console, and the lifestyle tiles. "Find your next
        journey" used to sit far higher, where it competed with the inventory it was meant to
        introduce.

        Ordering within the console block is the console's: `editorial_slots.position`.
      */}
      {/*
        Editorial only where there is stock for it to follow.
        ====================================================
        The rails are now gated on Founder approval, so a homepage with nothing approved has no
        vehicles at all — and the first walk in that state put "Find your next journey" 118px below
        the hero, which is a magazine with no cars in it. Inspiration is the second thing a
        marketplace offers; when it cannot offer the first, it should not lead with the second.

        This is not a fallback or a placeholder. It is the same rule every other section on this page
        now follows: appear when you have earned it, and otherwise not at all.
      */}
      {hasVehicleRails && (
        <>
          {collections.map((section) => (
            <HomeFeaturedEditorial
              key={section.key}
              railKey={section.key}
              eyebrow="Collection"
              title={section.headline}
              description={section.description ?? undefined}
              listings={section.listings}
              viewAllHref="/search"
              layout="uniform"
            />
          ))}

          <HomeLifestyleCollections countsByBodyType={countsByBodyType} countsByFuel={countsByFuel} />
        </>
      )}

      <HomeWhyBuyers />
      <HomeCta />
    </>
  );
}
