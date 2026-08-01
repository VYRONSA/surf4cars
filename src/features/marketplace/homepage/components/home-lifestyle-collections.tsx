import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { MediaAttribution } from "@/components/ui/media";
import { cn } from "@/utils";

/**
 * Explore by Lifestyle — the imagination.
 *
 * This replaces the body-style band. "Hatch / Sedan / Double Cab" is a filter vocabulary: it is what
 * you use once you already know what you want, and nobody has ever wanted a Panel Van. A collection is
 * the opposite — it describes a life and lets the photograph make the argument.
 *
 * Each collection resolves to a real search, so the emotion leads somewhere factual. "Weekend
 * Adventures" is SUVs and bakkies; the buyer never sees that vocabulary, but the results are honest.
 *
 * Photography is drawn from the repository's cinematic set rather than the demonstration vehicle
 * library. Those two sets are not the same standard — the vehicle library is documentary, the set used
 * here is one deliberate visual language of Cape Town blue hour, dark showrooms and coastal road — and
 * the brand moodboard exists precisely to make that difference visible. Every frame here is at least
 * 3:2, so `object-cover` only ever trims sky and tarmac. See docs/experience-bible/03-photography.md.
 */

export interface LifestyleCollection {
  readonly id: string;
  /** The headline. Emotional, never a body style. */
  readonly title: string;
  /** One line, and only one. The image is doing the work. */
  readonly line: string;
  readonly image: string;
  /** Premium library id, where one exists — so an approval can replace the frame with no code change. */
  readonly mediaId?: string;
  readonly href: string;
  readonly emphasis: "lead" | "standard";
}

export const LIFESTYLE_COLLECTIONS: readonly LifestyleCollection[] = [
  {
    id: "adventure",
    title: "Driven by adventure",
    line: "For the turn-off you did not plan to take.",
    image: "/images/categories/category-suv-hero.webp",
    href: "/search?bodyType=SUV",
    emphasis: "lead",
  },
  {
    id: "luxury",
    title: "Luxury without compromise",
    line: "Quiet, considered, and entirely yours.",
    image: "/images/dealers/dealer-profile-hero.webp",
    href: "/search?bodyType=Sedan",
    emphasis: "standard",
  },
  {
    id: "performance",
    title: "Performance icons",
    line: "Built for the long way round.",
    image: "/images/sections/ai-intelligence-main.webp",
    href: "/search?bodyType=Coupe",
    emphasis: "standard",
  },
  {
    id: "family",
    title: "Family first",
    line: "Everyone, and everything they bring.",
    image: "/images/search/advanced-search-hero.webp",
    href: "/search?bodyType=MPV",
    emphasis: "standard",
  },
  {
    id: "electric",
    title: "The electric future",
    line: "Silent, and already here.",
    image: "/images/ai/ai-vehicle-valuation-hero.webp",
    href: "/search?fuel=Electric",
    emphasis: "standard",
  },
  {
    id: "business",
    title: "Built for business",
    line: "The vehicles that keep everything else running.",
    image: "/images/dashboard/inventory-management-hero.webp",
    href: "/search?bodyType=Panel%20Van",
    emphasis: "standard",
  },
];

function CollectionTile({ collection }: { readonly collection: LifestyleCollection }) {
  const lead = collection.emphasis === "lead";

  return (
    <Link
      href={collection.href}
      className={cn(
        "group relative isolate block overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] motion-card",
        "hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
        /* Two columns wide and two rows tall, in a three-column grid. With six collections that
           tiles exactly — lead block, two tiles beside it, three along the bottom — and no lone
           tile stranded on a final row. */
        lead ? "sm:col-span-2 lg:row-span-2" : "",
      )}
    >
      <div className={cn("relative", lead ? "aspect-[3/2] lg:h-full lg:aspect-auto" : "aspect-[3/2]")}>
        <Image
          src={collection.image}
          alt=""
          fill
          sizes={lead ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"}
          priority={lead}
          className="object-cover transition-transform duration-[var(--duration-slower)] ease-[var(--ease-premium)] group-hover:scale-[1.05]"
        />

        {/* Type sits directly on the photograph — no panel. The scrim is the only concession. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,8,8,0.9)_0%,rgba(8,8,8,0.45)_34%,rgba(8,8,8,0.05)_70%)]"
        />

        {collection.mediaId && <MediaAttribution mediaId={collection.mediaId} />}

        <div className={cn("absolute inset-x-0 bottom-0 p-6", lead && "lg:p-8")}>
          <h3
            className={cn(
              "font-semibold tracking-[-0.02em] text-[var(--color-foreground)]",
              lead
                ? "text-[length:var(--text-h3)] lg:text-[length:var(--text-h1)] lg:leading-[1.05]"
                : "text-[length:var(--text-h4)]",
            )}
          >
            {collection.title}
          </h3>

          <p
            className={cn(
              "mt-2 max-w-sm text-[var(--color-muted-foreground)]",
              lead ? "text-[length:var(--text-body-md)] lg:text-[length:var(--text-body-lg)]" : "text-[length:var(--text-body-sm)]",
            )}
          >
            {collection.line}
          </p>

          <span
            className={cn(
              "mt-4 inline-flex items-center gap-2 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)]",
            )}
          >
            <span
              aria-hidden
              className="block h-px w-6 bg-[var(--color-primary)] transition-all duration-[var(--duration-slower)] ease-[var(--ease-premium)] group-hover:w-12"
            />
            Explore
            <Icon
              icon={ArrowRight}
              aria-hidden
              className="size-4 transition-transform motion-hover group-hover:translate-x-1"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HomeLifestyleCollections() {
  return (
    <section
      aria-labelledby="collections-heading"
      className="mx-auto w-full max-w-[var(--container-2xl)] px-6 py-20 sm:px-8 lg:px-10 lg:py-28"
    >
      <div className="max-w-2xl">
        <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
          Collections
        </p>
        <h2
          id="collections-heading"
          className="mt-3 text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]"
        >
          Find your next journey
        </h2>
        <p className="mt-3 text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
          Nobody sets out wanting a body style.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LIFESTYLE_COLLECTIONS.map((collection) => (
          <CollectionTile key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}
