import Link from "next/link";

import { MarqueMark } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import type { BrandPresentation } from "@/services/presentation";
import { cn } from "@/utils";

/**
 * The marque strip — navigation, not a feature.
 *
 * Second section, immediately after the hero, and deliberately not categories: someone who wants a BMW
 * does not want "a sedan", they want that badge on that driveway.
 *
 * It was first built as a bordered grid of twelve large tiles, roughly 470px tall, with a section
 * heading and a paragraph of its own. That made it a *destination* — it competed with the featured
 * vehicles for the first scroll, and lost, because a list of words cannot beat photographs of cars and
 * should not try. It is now about a third of that height: one line of context and two rows of compact
 * marques, no borders, no panel, nothing to read.
 *
 * The order of the page's visual weight is hero, then vehicles. This helps people navigate; the cars
 * create the desire.
 *
 * **Each marque is represented at whatever fidelity we legitimately have.** Licensed SVG, manufacturer
 * wordmark, the marque's own published typographic style, or the strip default — resolved per marque by
 * `resolveMarqueIdentity`, rendered by `MarqueMark`. Manufacturers do not all publish the same asset type,
 * so a mixed row is the permanent design rather than an interim state.
 *
 * The strip should read like a luxury dashboard: small, understated, coherent. That coherence is achieved
 * by normalising *presentation* — one optical height, opacity-matched weight, one baseline, one hover —
 * and never by rescaling or recolouring a manufacturer's artwork to fit. `MarqueMark` owns all of it, so
 * this component sets no type styling of its own.
 *
 * Every marque shown has stock behind it. A brand tile that leads to an empty result set is a worse
 * first impression than a shorter rail.
 */

export interface HomeBrandRailProps {
  readonly brands: readonly BrandPresentation[];
}

export function HomeBrandRail({ brands }: HomeBrandRailProps) {
  if (brands.length === 0) return null;

  return (
    <section
      aria-labelledby="brand-rail-heading"
      className="border-y border-[var(--color-border-subtle)] bg-[var(--color-surface)]/30"
    >
      <div className="mx-auto flex w-full max-w-[var(--container-2xl)] flex-col gap-5 px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:gap-12 lg:px-10 lg:py-8">
        {/*
          One line of context, set at caption scale and holding its own column. At heading scale it read
          as a section title, which is what made the strip look like a feature.
        */}
        <h2
          id="brand-rail-heading"
          className="shrink-0 text-[length:var(--text-caption)] font-semibold uppercase leading-relaxed tracking-[0.2em] text-[var(--color-muted)] lg:max-w-[7.5rem]"
        >
          Browse by marque
        </h2>

        <ul className="flex flex-wrap items-center gap-x-1 gap-y-1 lg:gap-x-2">
          {brands.map((brand) => (
            <li key={brand.name}>
              <Link
                href={`/search?make=${encodeURIComponent(brand.name)}`}
                title={`${brand.name} — ${brand.count.toLocaleString("en-ZA").replace(/,/g, " ")} available`}
                className={cn(
                  "group relative inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 motion-hover",
                  "text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]",
                  "hover:bg-[var(--color-hover)] hover:text-[var(--color-foreground)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
                )}
              >
                {/*
                  Whatever fidelity we legitimately have for this marque, in one normalised frame.
                  `MarqueMark` owns the optical height, weight and baseline so the row reads as a single
                  control surface even when a licensed roundel sits beside a typographic treatment.
                */}
                <MarqueMark identity={brand.identity} />

                {/*
                  The count is present but subordinate — it is reassurance, not information anyone came
                  for, and at full contrast it doubled the visual noise of every marque.
                */}
                <span
                  aria-hidden
                  className="text-[0.625rem] font-medium tabular-nums tracking-normal text-[var(--color-muted)]/70 transition-colors motion-hover group-hover:text-[var(--color-primary-text)]"
                >
                  {brand.count}
                </span>
              </Link>
            </li>
          ))}

          <li>
            <Link
              href="/search"
              className="group inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-[length:var(--text-body-sm)] font-medium text-[var(--color-primary-text)] motion-hover hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              All
              <Icon
                icon={ArrowRight}
                aria-hidden
                className="size-3.5 transition-transform motion-hover group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
