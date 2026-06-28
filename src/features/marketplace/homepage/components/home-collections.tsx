import Image from "next/image";
import Link from "next/link";

import { HeroImageBackground } from "@/components/ui/media";
import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { HOME_COLLECTION_CATEGORIES } from "@/features/marketplace/homepage/config/home-collections";
import { HomeSection } from "@/features/marketplace/homepage/components/home-section";
import { homePolish } from "@/features/marketplace/homepage/components/home-shared";
import { cn } from "@/utils";

const CATEGORY_IMAGES: Record<string, string> = {
  suvs: PREMIUM_IMAGES.categories.suv,
};

export function HomeCollections() {
  return (
    <HomeSection
      id="collections"
      eyebrow="Collections"
      title="Explore by category"
      description="Curated entry points — designed for how South Africans buy."
      className="overflow-hidden border-t border-[var(--color-border-subtle)]"
      backgroundSlot={
        <HeroImageBackground
          src={PREMIUM_IMAGES.sections.featuredCollections}
          alt=""
          sizes={PREMIUM_IMAGE_SIZES.fullWidth}
          overlayVariant="sectionLight"
          objectPosition="landscape"
        />
      }
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {HOME_COLLECTION_CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className={cn(
              homePolish.categoryCard,
              "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
              "min-h-[300px] sm:min-h-[320px]",
            )}
          >
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={CATEGORY_IMAGES[category.id] ?? PREMIUM_IMAGES.categories.default}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={category.id === "suvs"}
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.16),_transparent_45%),linear-gradient(180deg,rgba(0,0,0,0.28),rgba(0,0,0,0.58))]" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between gap-6">
              <div className="flex items-center justify-between gap-3">
                <span className={homePolish.categoryIcon}>
                  <Icon icon={category.icon} size="md" aria-hidden />
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors duration-300 group-hover:bg-white/15">
                  <Icon icon={ArrowRight} size="xs" aria-hidden />
                </span>
              </div>

              <div className="mt-auto space-y-3">
                <Text variant="overline" tone="accent" className="tracking-[0.3em] text-white/80 uppercase">
                  {category.tagline}
                </Text>
                <Text variant="h4" as="h3" className="tracking-[var(--tracking-heading)] text-white">
                  {category.label}
                </Text>
                <Text variant="body-sm" tone="muted" className="max-w-[18rem] text-white/80 leading-[var(--leading-relaxed)]">
                  {category.description}
                </Text>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-white/70">
                <span className="text-[length:var(--text-caption)] font-medium uppercase tracking-[var(--tracking-wide)]">
                  {category.vehicleCount} vehicles
                </span>
                <span className="text-[length:var(--text-body-sm)] font-semibold text-white">
                  Explore →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </HomeSection>
  );
}
