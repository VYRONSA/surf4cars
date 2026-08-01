import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { MediaAttribution } from "@/components/ui/media";
import { PREMIUM_IMAGES } from "@/config/images/premium-images";
import { HOME_BUYER_REASONS } from "@/features/marketplace/homepage/config/home-content";

/**
 * Why buyers choose Surf4Cars.
 *
 * This replaces "Built for the future of automotive" — three glass cards, three icons in tinted
 * circles, centred, with a blue radial glow behind them. It was competent and it was software
 * marketing. Two things made it read that way, and only one of them was visual:
 *
 *   it addressed the wrong person — every pillar was a reason a dealership should buy the platform,
 *     shown to someone who came to look at cars;
 *   it had no photograph — a section about confidence, illustrated with UI furniture.
 *
 * So the layout is editorial rather than modular. One photograph at full bleed, copy held in the
 * left third where the frame is quiet, three numbered claims in text, and nothing in a card. The
 * numerals do the work the icons were doing, without pretending to be illustration.
 *
 * The photograph resolves through the premium media library under the `editorial-buyers` brief, so
 * approving a candidate on the creative review board re-shoots this section with no code change.
 */
export function HomeWhyBuyers() {
  return (
    <section
      aria-labelledby="why-buyers-heading"
      className="relative isolate overflow-hidden border-y border-[var(--color-border-subtle)]"
    >
      <Image
        src={PREMIUM_IMAGES.sections.whyBuyers}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />

      {/*
        Two scrims, doing two different jobs. The horizontal one guarantees contrast under the copy
        without touching the right of the frame; the vertical one keeps the photograph from colliding
        with the sections above and below. Neither is heavy enough to flatten it — the Experience
        Bible's rule is to change the layout before obscuring a photograph, not the other way round.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,8,8,0.94)_0%,rgba(8,8,8,0.86)_34%,rgba(8,8,8,0.42)_62%,rgba(8,8,8,0.24)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,8,8,0.5)_0%,transparent_28%,transparent_72%,rgba(8,8,8,0.5)_100%)]"
      />

      <MediaAttribution mediaId="editorial-buyers" />

      <div className="relative mx-auto w-full max-w-[var(--container-2xl)] px-6 py-24 sm:px-8 lg:px-10 lg:py-36">
        <div className="max-w-xl">
          <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Why buyers choose Surf4Cars
          </p>

          <h2
            id="why-buyers-heading"
            className="mt-4 text-[length:var(--text-h1)] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]"
          >
            Confidence is the
            <br />
            whole product.
          </h2>

          <p className="mt-5 max-w-md text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
            Buying a car should not require you to be an expert, or to take anyone’s word for it.
          </p>

          <ol className="mt-12 space-y-8">
            {HOME_BUYER_REASONS.map((reason, position) => (
              <li key={reason.id} className="flex gap-5">
                {/* The numeral is an index, not an action. Red here was the accent used as
                    decoration — three times, in a section whose one red thing should be nothing. */}
                <span
                  aria-hidden
                  className="shrink-0 pt-1 font-mono text-[length:var(--text-body-sm)] tabular-nums text-[var(--color-muted)]"
                >
                  {String(position + 1).padStart(2, "0")}
                </span>
                <div className="border-l border-[var(--color-border-strong)] pl-5">
                  <h3 className="text-[length:var(--text-h4)] font-semibold tracking-[-0.01em] text-[var(--color-foreground)]">
                    {reason.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
                    {reason.tagline}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href="/search"
            className="motion-button group mt-12 inline-flex items-center gap-3 border-b border-[var(--color-border-strong)] pb-1 text-[length:var(--text-body-lg)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            Browse the marketplace
            <Icon
              icon={ArrowRight}
              aria-hidden
              className="size-5 transition-transform motion-hover group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
