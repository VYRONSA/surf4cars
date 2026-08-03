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
  /**
   * What the tile resolves to, declared rather than encoded in a URL.
   *
   * The href used to be the only statement of what a tile meant, which made it impossible to ask
   * "does this lead anywhere" without parsing it back out. Declaring the filter lets the section
   * count the stock behind each tile and drop the ones with none — see below.
   */
  readonly filter: { readonly bodyType?: string; readonly fuel?: string };
}

export const LIFESTYLE_COLLECTIONS: readonly LifestyleCollection[] = [
  {
    id: "adventure",
    title: "Driven by adventure",
    line: "For the turn-off you did not plan to take.",
    image: "/images/categories/category-suv-hero.webp",
    filter: { bodyType: "SUV" },
  },
  {
    id: "luxury",
    title: "Luxury without compromise",
    line: "Quiet, considered, and entirely yours.",
    image: "/images/dealers/dealer-profile-hero.webp",
    filter: { bodyType: "Sedan" },
  },
  {
    id: "performance",
    title: "Performance icons",
    line: "Built for the long way round.",
    image: "/images/sections/ai-intelligence-main.webp",
    filter: { bodyType: "Coupe" },
  },
  {
    id: "family",
    title: "Family first",
    line: "Everyone, and everything they bring.",
    image: "/images/search/advanced-search-hero.webp",
    filter: { bodyType: "MPV" },
  },
  {
    id: "electric",
    title: "The electric future",
    line: "Silent, and already here.",
    image: "/images/ai/ai-vehicle-valuation-hero.webp",
    filter: { fuel: "Electric" },
  },
  {
    id: "business",
    title: "Built for business",
    line: "The vehicles that keep everything else running.",
    image: "/images/dashboard/inventory-management-hero.webp",
    filter: { bodyType: "Panel Van" },
  },
];

const hrefFor = (collection: LifestyleCollection): string => {
  const params = new URLSearchParams();
  if (collection.filter.bodyType) params.set("bodyType", collection.filter.bodyType);
  if (collection.filter.fuel) params.set("fuel", collection.filter.fuel);
  return `/search?${params.toString()}`;
};

function CollectionTile({
  collection,
  lead,
}: {
  readonly collection: LifestyleCollection;
  readonly lead: boolean;
}) {
  return (
    <Link
      href={hrefFor(collection)}
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

export interface HomeLifestyleCollectionsProps {
  readonly countsByBodyType: Readonly<Record<string, number>>;
  readonly countsByFuel: Readonly<Record<string, number>>;
}

/**
 * A tile may only promise a life the marketplace can actually sell.
 *
 * WHAT THIS FIXED
 * ===============
 * Two of these tiles led nowhere. "The electric future — silent, and already here" resolved to
 * `?fuel=Electric`, and the marketplace holds no electric vehicle at all: petrol, diesel and eight
 * hybrids. "Built for business" resolved to `?bodyType=Panel Van`, of which there are none. Both
 * rendered as full-bleed photographs with confident copy, and both delivered an empty results page.
 *
 * "Already here" is not a stylistic overreach, it is a false statement about the inventory — the
 * same class of defect as a headline claiming performance cars the rails cannot show, and the
 * marque rail has been counting its stock for exactly this reason since it was built.
 *
 * So the tiles are filtered against live counts and the section renders whatever survives. The
 * entries stay in the list: the day a dealership publishes an EV, the tile returns on its own.
 */
export function HomeLifestyleCollections({
  countsByBodyType,
  countsByFuel,
}: HomeLifestyleCollectionsProps) {
  const available = LIFESTYLE_COLLECTIONS.filter((collection) => {
    const { bodyType, fuel } = collection.filter;
    if (bodyType && (countsByBodyType[bodyType] ?? 0) === 0) return false;
    if (fuel && (countsByFuel[fuel] ?? 0) === 0) return false;
    return true;
  });

  /* The grid is three columns with a double-width lead. Below three tiles it stops reading as a
     considered spread and starts reading as a section that failed to load. */
  if (available.length < 3) return null;

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
        {/* Whichever tile survives first takes the lead slot, so removing one never leaves the grid
            without its anchor. */}
        {available.map((collection, index) => (
          <CollectionTile key={collection.id} collection={collection} lead={index === 0} />
        ))}
      </div>
    </section>
  );
}
