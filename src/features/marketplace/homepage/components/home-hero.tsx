import Link from "next/link";

import { HeroImageBackground } from "@/components/ui/media";
import { Icon } from "@/components/ui/icons";
import { ArrowRight, Search, Store } from "@/components/ui/icons/registry";
import { DisplayXL, Text } from "@/components/ui/typography";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { HomeHeroSearch } from "@/features/marketplace/homepage/components/home-hero-search";
import { homeLinkStyles } from "@/features/marketplace/homepage/components/home-shared";
import { cn } from "@/utils";

export function HomeHero() {
  return (
    <section
      className="relative flex min-h-[calc(100dvh-4.5rem)] flex-col justify-center overflow-hidden lg:min-h-[calc(100dvh-5.25rem)]"
      aria-labelledby="home-hero-heading"
    >
      <HeroImageBackground
        src={PREMIUM_IMAGES.hero.homepage}
        alt=""
        priority
        sizes={PREMIUM_IMAGE_SIZES.fullWidth}
        overlayVariant="cinematic"
        objectPosition="heroSubject"
      />

      <div className="relative mx-auto w-full max-w-[var(--container-2xl)] px-4 py-12 lg:px-6 lg:py-16 xl:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Text variant="overline" tone="accent" className="mb-4 block animate-slide-up-sfc">
            South Africa · Premium Automotive Technology
          </Text>

          <DisplayXL
            id="home-hero-heading"
            as="h1"
            className="text-balance animate-slide-up-sfc"
          >
            South Africa&apos;s smarter way to buy & sell cars
          </DisplayXL>

          <Text
            variant="body-lg"
            tone="muted"
            className="mx-auto mt-4 max-w-xl text-pretty leading-[var(--leading-relaxed)] animate-slide-up-sfc"
          >
            Find the right vehicle faster with intelligent search, verified dealerships and premium buying tools.
          </Text>
        </div>

        <div className="mx-auto mt-8 max-w-[26rem] animate-slide-up-sfc lg:mt-10 lg:max-w-[28rem]">
          <HomeHeroSearch />
        </div>

        <div className="mx-auto mt-6 flex max-w-3xl flex-col justify-center gap-2.5 sm:flex-row sm:items-center sm:justify-center">
          <Link href="/search" className={cn(homeLinkStyles.primary, "w-full sm:w-auto")}>
            <Icon icon={Search} size="sm" aria-hidden />
            Search Vehicles
          </Link>
          <Link
            href="/auth/sign-up/dealer"
            className={cn(homeLinkStyles.secondary, "w-full sm:w-auto")}
          >
            <Icon icon={Store} size="sm" aria-hidden />
            List Your Dealership
            <Icon icon={ArrowRight} size="sm" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
