"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { SurfWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Search, Sparkles } from "@/components/ui/icons/registry";
import { HeroImageBackground } from "@/components/ui/media";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { cn } from "@/utils";

/**
 * Homepage V2 hero.
 *
 * Built to the Experience Bible: the interface is the unlit room and the photography is the lit
 * object, so the chrome here is deliberately minimal — a scrim, one headline, and the search.
 *
 * Search is the hero, not a field inside it. Two modes share one input because they are the same
 * user intent expressed differently: describe the car you want, or specify it. Both land on
 * /search, so the existing search route, parsing and SEO are untouched.
 */

const AI_EXAMPLES = [
  "Family SUV under R500 000 in Cape Town",
  "Reliable first car with low mileage",
  "Double cab that can tow a boat",
  "Something economical for the N1 commute",
] as const;

export interface HomeHeroV2Props {
  /** Live marketplace stock count. Omitted rather than faked when unavailable. */
  readonly vehicleCount?: number;
}

export function HomeHeroV2({ vehicleCount }: HomeHeroV2Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"ai" | "classic">("ai");
  const [query, setQuery] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/search?query=${encodeURIComponent(next)}` : "/search");
  };

  const countLabel =
    typeof vehicleCount === "number" && vehicleCount > 0
      ? `Search ${vehicleCount.toLocaleString("en-ZA").replace(/,/g, " ")} vehicles`
      : "Search vehicles";

  return (
    <section
      /*
        Pulled up under the sticky header, so the photograph starts at the top of the viewport.
        =====================================================================================
        The header is 4.5rem tall and sits in normal flow, so without this the hero began 72px down
        the page and the sky was clipped by a bar. The negative margin puts the frame where a
        cinematic hero belongs — against the top edge — and the header floats on it.

        The height grows by the same amount so the visible hero is unchanged: 92svh of image, with
        the last 8% of the viewport showing the section beneath as an invitation to scroll.
      */
      className="relative isolate -mt-[4.5rem] flex min-h-[calc(92svh+4.5rem)] flex-col justify-end overflow-hidden lg:-mt-[5rem] lg:min-h-[calc(92svh+5rem)]"
      aria-labelledby="hero-heading"
    >
      <HeroImageBackground
        src={PREMIUM_IMAGES.hero.homepage}
        alt=""
        priority
        sizes={PREMIUM_IMAGE_SIZES.fullWidth}
        overlay={false}
        objectPosition="center"
        /**
         * The contrast comes from the photograph, not from black on top of it. A small lift in
         * contrast and saturation separates the mountain from the sky and the tail-lights from the
         * road — which is what "cinematic" actually means. Kept deliberately slight: past about 1.1
         * the sunset band posterises and the frame starts to look processed rather than shot.
         */
        imageClassName="[filter:brightness(1.16)_contrast(1.05)_saturate(1.08)]"
      />

      {/*
        Scrims, reshaped.
        =================
        This hero was measurably too dark rather than arguably so. With the copy hidden, the frame
        averaged 0.025 relative luminance, the sports car sat at 0.011 — effectively black — and the
        sub-headline was carrying 6.68:1 against a 4.5:1 requirement. That headroom was being spent
        on darkness nobody asked for: two full-bleed linear gradients, 0.94 and 0.82 deep, flattening
        the entire frame to protect two lines of text in one corner.

        So the darkness is now shaped to the text instead of applied to the photograph. A radial
        ellipse anchored bottom-left does the contrast work where the copy actually is, and the
        vertical gradient is pulled in to the bottom third — enough to carry the page into the next
        section without a seam, and no further. The mountain, the skyline and the car are left alone.

        Verified by measurement, not by eye: see the numbers in the sprint notes. Anyone retuning
        these stops should re-run the check rather than trusting the result to look right.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-background)_0%,rgba(var(--color-scrim-rgb),0.62)_10%,rgba(var(--color-scrim-rgb),0.12)_28%,transparent_50%)]"
      />
      <div
        aria-hidden
        /**
         * The copy column, and only the copy column.
         *
         * A horizontal wash masked by a vertical fade — a proper two-dimensional falloff, which a
         * single gradient cannot express and a radial ellipse gets wrong. The ellipse that was here
         * first protected the text but closed the city lights back down to darker than they started,
         * because the skyline and the headline occupy the same band of the frame. Feathering right
         * *and* up separates them: the type keeps its column, the mountain and the car keep the frame.
         */
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--color-scrim-rgb),0.90)_0%,rgba(var(--color-scrim-rgb),0.84)_22%,rgba(var(--color-scrim-rgb),0.54)_42%,rgba(var(--color-scrim-rgb),0.18)_62%,transparent_80%)] [mask-image:linear-gradient(to_top,black_0%,black_42%,rgba(0,0,0,0.55)_66%,transparent_88%)]"
      />

      {/*
        The brand, as the opening frame.
        ================================
        The identity used to live only in the masthead at 2rem — the size and position of ordinary
        website navigation, which is what it read as. A visitor's first impression was the photograph
        and a search box, with the name of the company a detail in the corner.

        It now anchors the top of the hero at display scale, with the headline and search anchored to
        the bottom and the car occupying the frame between them. That is the composition of a luxury
        automotive title card: marque above, statement below, subject in the middle.

        Three constraints held it here rather than anywhere else:

          it must not cover the vehicle   — the car sits lower-right, so the mark takes the upper-left
                                            sky, which is the emptiest region of the frame
          it must not compete with search — 500px of vertical separation, and the search panel keeps
                                            the only filled red button on the screen
          it must stay legible            — the top scrim already darkens this band for the site
                                            header, so no new overlay was needed

        `aria-hidden`: the accessible name for the brand is on the masthead link, which is a real
        navigation landmark. Announcing "SURF4CARS" twice on arrival helps nobody.
      */}
      <div
        aria-hidden
        /* Header height plus a clear 3rem, so the mark sits in open sky rather than immediately
             beneath the navigation. */
          className="pointer-events-none absolute inset-x-0 top-0 z-10 mx-auto w-full max-w-[var(--container-2xl)] px-6 pt-[7.5rem] sm:px-8 lg:px-10 lg:pt-[8.5rem]"
      >
        <SurfWordmark size="display" />
        {/* Lifted from `white/45`, which was faint enough that a pixel sample of the rendered hero
            could not find it at all against the sky. A locality line under a marque is part of the
            lockup — it should read as quietly deliberate, not as something that failed to load. */}
        <p className="mt-3 text-[length:var(--text-body-sm)] uppercase tracking-[0.34em] text-white/65 sm:mt-4">
          South Africa
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[var(--container-2xl)] px-6 pb-20 pt-32 sm:px-8 lg:px-10 lg:pb-28">
        <h1
          id="hero-heading"
          className="max-w-4xl text-balance text-[length:var(--text-display-md)] font-semibold leading-[1.02] tracking-[-0.02em] text-[var(--color-foreground)] sm:text-[length:var(--text-display-lg)] lg:text-[length:var(--text-display-xl)]"
        >
          Find the one.
        </h1>

        {/*
          Brighter than `--color-muted-foreground`, deliberately.
          ======================================================
          The muted token is calibrated against flat surfaces, where it holds 9:1. Over a photograph it is
          the wrong instrument: brightening the frame by a third dropped this line to 4.47:1 — under AA by
          three hundredths — and the honest fix is not to re-darken a hero the brief asked to lighten.

          #c7c7c7 restores the margin to 5.5:1 while reading as the same tone against a photograph, and it
          leaves the token untouched everywhere it is correct. Re-measure with the hero harness if either
          the scrim or this colour changes; the two are a pair.
        */}
        {/*
          Shortened to fit the scrim, not just to be shorter.
          =================================================
          The previous line ran to "…the intelligence to tell you which one is actually worth
          buying" — 96 characters, which pushed the last third of it past the horizontal wash and
          onto the brightest part of the photograph, the city lights. Measured contrast there was
          fine on paper because the scrim is sampled at the copy column; on screen the tail of the
          sentence was unreadable.

          A shorter line is also the better line. The headline already says what the page is for.
        */}
        <p className="mt-6 max-w-md text-[length:var(--text-body-lg)] leading-relaxed text-[#c7c7c7]">
          Every vehicle. Every verified dealer.
        </p>

        {/* The search block floats over the photography — the one place glass is correct here. */}
        <div className="glass-hero-float mt-12 max-w-3xl lg:mt-14 rounded-[var(--radius-2xl)] border border-[var(--color-glass-border)] p-2 sm:p-3">
          <div
            role="tablist"
            aria-label="Search mode"
            className="flex gap-1 px-1 pb-2 pt-1"
          >
            {(
              [
                { id: "ai", label: "Describe it", icon: Sparkles },
                { id: "classic", label: "Specify it", icon: Search },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => setMode(tab.id)}
                className={cn(
                  "motion-button inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-[length:var(--text-body-sm)] font-medium",
                  /* Neutral, not brand red. A filled red tab sat 40px above a filled red submit
                     button, so the loudest thing on the hero was a *mode switch* rather than the
                     action. This is the same segmented control the vehicle enquiry form uses —
                     one pattern for "pick one of these", everywhere. */
                  mode === tab.id
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-hover)] hover:text-[var(--color-foreground)]",
                )}
              >
                <Icon icon={tab.icon} className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="hero-search" className="sr-only">
              {mode === "ai" ? "Describe the vehicle you want" : "Search by make or model"}
            </label>
            <div className="relative flex-1">
              <Icon
                icon={mode === "ai" ? Sparkles : Search}
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                id="hero-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  mode === "ai"
                    ? "Family SUV under R500 000 in Cape Town"
                    : "Make, model or keyword"
                }
                className="h-14 w-full rounded-[var(--radius-xl)] border border-[var(--color-border-interactive)] bg-[var(--color-surface)]/80 pl-12 pr-4 text-[length:var(--text-body-md)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              />
            </div>
            <Button type="submit" size="xl" className="shrink-0 sm:w-auto">
              {countLabel}
            </Button>
          </form>

          {mode === "ai" && (
            <div className="flex flex-wrap gap-2 px-1 pb-1 pt-3">
              {AI_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuery(example)}
                  className="motion-hover rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1.5 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-foreground)]"
                >
                  {example}
                </button>
              ))}
            </div>
          )}
        </div>

        {/*
          The "Popular" row is gone.
          ========================
          Between the example chips inside the panel and this row beneath it, the first screen
          offered ten pre-canned searches in two different visual languages — pills that fill the
          input, and links that navigate. Two mechanisms, one purpose, and the eye had to work out
          which was which before it could use either.

          The chips stay because they teach the search what it accepts. The collections stay too —
          on the marketplace, where somebody browsing rather than describing will actually reach for
          them, and where they are already the catalogue header's first row.
        */}
      </div>
    </section>
  );
}
