import { HomeHeroSearch } from "@/features/marketplace/homepage/components/home-hero-search";
import type { SearchFacets } from "@/features/marketplace/homepage/server/homepage-facets";
import { Icon } from "@/components/ui/icons";
import { HeroImageBackground } from "@/components/ui/media";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { BadgeCheck, Car, Shield } from "@/components/ui/icons/registry";

/**
 * Homepage hero, built to the PCP-031 reference composition.
 *
 * THE COMPOSITION
 * ===============
 * Brand top left, headline lower left, search beneath the headline, vehicle lower right, background
 * uninterrupted, navigation floating. That is the reference and it is followed closely, because the
 * arrangement is doing real work: the eye enters at the marque, falls down the left edge through the
 * statement into the search, and the car occupies the space it travels past. Nothing crosses the
 * photograph's right half above the car.
 *
 * WHAT MOVED, AND WHY
 * ===================
 * The wordmark used to sit at display scale in the middle-left of the hero, with the masthead's own
 * mark hidden on the homepage to avoid showing the brand twice. The reference puts the marque in the
 * masthead instead — smaller, but *permanent*, and lockup-shaped rather than word-shaped.
 *
 * That is the better arrangement and it resolves an awkwardness the old one had: the brand was
 * absent from every interior page's first screen, and reappeared on scroll, which meant the identity
 * behaved differently depending on where you were. Now it is in the same place on every page, and
 * the hero's largest element is the statement — which is what a luxury title card actually does.
 *
 * NO CLIENT JAVASCRIPT IN THIS FILE
 * =================================
 * This is a server component. The only interactive part of the hero is the search panel, which is
 * its own client island. The headline, the marque, the stat cards and the assurance strip are all
 * static markup — so the hero paints without waiting for hydration, which is the whole reason its
 * CLS is 0.000 and should stay that way.
 */

export interface HomeHeroV2Props {
  readonly vehicleCount?: number;
  readonly facets: SearchFacets;
}

export function HomeHeroV2({ vehicleCount, facets }: HomeHeroV2Props) {
  const count = typeof vehicleCount === "number" && vehicleCount > 0 ? vehicleCount : 0;
  const formattedCount = count.toLocaleString("en-ZA").replace(/,/g, " ");

  return (
    <section
      /* Pulled up under the floating masthead so the photograph starts at the top edge of the
         viewport. The header floats on the image rather than sitting above it. */
      className="relative isolate -mt-[4.5rem] flex min-h-[calc(94svh+4.5rem)] flex-col justify-end overflow-hidden lg:-mt-[5rem] lg:min-h-[calc(94svh+5rem)]"
      aria-labelledby="hero-heading"
    >
      <HeroImageBackground
        src={PREMIUM_IMAGES.hero.homepage}
        alt=""
        priority
        sizes={PREMIUM_IMAGE_SIZES.fullWidth}
        overlay={false}
        objectPosition="center"
        imageClassName="[filter:brightness(1.16)_contrast(1.05)_saturate(1.08)]"
      />

      {/*
        Scrims, shaped to the copy rather than applied to the photograph.
        ===============================================================
        A horizontal wash carrying the left column, masked by a vertical fade so it never touches the
        mountain, the skyline or the car.

        RETUNED FOR THIS COMPOSITION, AND MEASURED
        ==========================================
        The PCP-022 tuning assumed a headline anchored near the bottom of the frame, so the mask went
        transparent above 66%. The reference composition lifts the statement into the middle of the
        hero, and the first render of it measured 2.40:1 on the headline and 2.06:1 on the
        sub-headline — both failing, both invisible to `audit-design-contrast.mjs`, which reads token
        pairings and cannot see a photograph.

        The mask now carries to 84% and the wash is a little deeper across the copy column. Nothing
        right of 82% of the frame is touched, so the car and the mountain are unchanged.

        Re-measure with `scripts/verify-hero-premium.mjs` after any change here. It samples the
        rendered pixels behind each line, which is the only way this is knowable.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-background)_0%,rgba(var(--color-scrim-rgb),0.62)_10%,rgba(var(--color-scrim-rgb),0.12)_28%,transparent_50%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--color-scrim-rgb),0.95)_0%,rgba(var(--color-scrim-rgb),0.93)_32%,rgba(var(--color-scrim-rgb),0.82)_46%,rgba(var(--color-scrim-rgb),0.30)_64%,transparent_82%)] [mask-image:linear-gradient(to_top,black_0%,black_66%,rgba(0,0,0,0.62)_84%,transparent_97%)]"
      />
      {/* A short top scrim so the floating navigation keeps its contrast against open sky. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgba(var(--color-scrim-rgb),0.78)_0%,rgba(var(--color-scrim-rgb),0.34)_46%,transparent_100%)]"
      />

      <div className="relative mx-auto w-full max-w-[var(--container-2xl)] px-6 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32 lg:px-10 lg:pb-20">
        {/*
          The eyebrow, and the claim that is not in it.
          ============================================
          The concept reads "South Africa's trusted car marketplace". "Trusted" is an assertion about
          a reputation the platform has not had time to earn, and this codebase has an entire section
          of AGENTS.md about the difference between an obviously empty placeholder and a convincing
          claim nobody checks.

          What can be said instead is what the marketplace *is*: every car on it was listed by a
          registered dealership rather than by an anonymous seller, which is the actual substance
          behind the word "trusted" and is verifiable from the data model.
        */}
        <p className="inline-flex items-center gap-2.5 rounded-[var(--radius-pill)] border border-white/12 bg-black/25 px-4 py-2 backdrop-blur-sm">
          <Icon icon={Shield} aria-hidden className="size-4 text-[var(--color-primary)]" />
          <span className="text-[length:var(--text-caption)] font-medium uppercase tracking-[0.16em] text-white/85">
            South Africa&rsquo;s dealership marketplace
          </span>
        </p>

        {/*
          The statement, in two lines and in caps.
          =======================================
          Uppercase because the reference is uppercase and because at this scale it is the difference
          between a headline and a title card — caps have a flat top line, so two stacked lines read
          as a block rather than as a sentence that wrapped.

          `text-balance` is deliberately *not* used: the break between the two sentences is the
          composition, and letting the browser rebalance it moves "DRIVE" onto the first line at some
          widths.
        */}
        <h1
          id="hero-heading"
          /* Sized in `clamp` at the small end rather than jumping at a breakpoint. At the display-md
             token a 390px screen wrapped the statement onto four lines and pushed the search panel —
             the thing the hero exists to present — entirely below the fold. */
          className="mt-5 max-w-[19ch] text-[clamp(2.1rem,8.4vw,3.25rem)] font-bold uppercase leading-[0.94] tracking-[-0.015em] text-white sm:mt-7 sm:text-[length:var(--text-display-lg)] lg:text-[length:var(--text-display-xl)]"
        >
          Find <span className="text-[var(--color-primary)]">the</span> one.
          <br />
          Drive your story.
        </h1>

        {/* A hairline rule under the statement — the editorial device that separates a title from its
            standfirst in print, and the cheapest way to make a hero read as composed. */}
        <div aria-hidden className="mt-5 h-[3px] w-24 rounded-full bg-[var(--color-primary)] sm:mt-7" />

        {/*
          "Every verified dealer" was the previous line here, and it had to go.
          ====================================================================
          `vehicle-platform.repository.ts` sets `verified: true` on every dealership unconditionally
          — alongside a 4.8 rating, 24 reviews and eight years in business, none of which is measured
          from anything. There is no verification column in the database to measure it from.

          Repeating that on the hero would put the platform's least defensible claim in its most
          prominent position. What is left is true of every listing on the site.
        */}
        {/*
          #dedede and a narrower measure, both for the same reason.
          ========================================================
          Measured at 3.07:1 against the brightest pixels behind it, where 4.5:1 is required. Two
          things were wrong: the tone was calibrated for a flat surface, and the line ran far enough
          right to cross the city lights, which are the brightest part of the photograph.

          Lifting the tone alone would have needed near-white, which then competes with the headline
          two lines above it. Pulling the measure in moves the tail of the sentence back over the
          darkened column instead, and a shorter line is the better line anyway.
        */}
        <p className="mt-5 max-w-md text-[length:var(--text-body-md)] leading-relaxed text-[#dedede] sm:mt-7 sm:text-[length:var(--text-body-lg)]">
          Every car listed by a registered dealership.
          <br />
          Photographed, specified and priced by the people who sell it.
        </p>

        {/*
          The stat row: four cards in the concept, three here, all countable.
          ==================================================================
          The concept's set is "229+ Vehicles / Verified Dealers / Trusted Marketplace / Local
          Support". Only the first of those is a number, and the other three are adjectives arranged
          to look like data — which is the most persuasive way to say nothing.

          These three are each a figure the platform can produce on demand: live published stock, the
          dealerships behind it, and the provinces they cover. `229+` becomes the exact figure,
          because a marketplace that knows its own stock to the unit should say so — "+" is what you
          write when you are rounding up.

          Each card renders only when its number is real. A hero with two cards on a quiet day is
          better than a hero with a zero dressed up as a feature.
        */}
        <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-9 sm:gap-3">
          {count > 0 && (
            <HeroStat icon={Car} value={formattedCount} label={count === 1 ? "Vehicle" : "Vehicles"} />
          )}
          {facets.dealershipCount > 0 && (
            <HeroStat
              icon={BadgeCheck}
              value={String(facets.dealershipCount)}
              label={facets.dealershipCount === 1 ? "Dealership" : "Dealerships"}
            />
          )}
          {facets.provinces.length > 0 && (
            <HeroStat
              icon={Shield}
              value={String(facets.provinces.length)}
              label={facets.provinces.length === 1 ? "Province" : "Provinces"}
            />
          )}
        </div>

        {/* Full content width, not `max-w-6xl`. Six selects and a button share one row, and at the
            narrower measure the option text clipped mid-word — "Any locatior", "Choose a m". A
            control that cannot show its own label is a control a visitor does not trust. */}
        <div className="mt-7 sm:mt-10 lg:mt-12">
          <HomeHeroSearch facets={facets} vehicleCount={count} />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  icon,
  value,
  label,
}: {
  readonly icon: Parameters<typeof Icon>[0]["icon"];
  readonly value: string;
  readonly label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-white/10 bg-black/25 px-5 py-3.5 backdrop-blur-sm">
      <Icon icon={icon} aria-hidden className="size-5 shrink-0 text-[var(--color-primary)]" />
      <span className="flex flex-col leading-tight">
        <span className="text-[length:var(--text-body-md)] font-semibold text-white">{value}</span>
        <span className="text-[length:var(--text-caption)] text-white/65">{label}</span>
      </span>
    </div>
  );
}
