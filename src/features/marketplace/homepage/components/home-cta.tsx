import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight, Car, Store } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { homeLinkStyles, homeSurfaceStyles } from "@/features/marketplace/homepage/components/home-shared";
import { cn } from "@/utils";

export function HomeCta() {
  return (
    <section className="py-14 lg:py-20" aria-labelledby="home-cta-heading">
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] px-6 py-14 text-center lg:px-12 lg:py-20">
          <div className={homeSurfaceStyles.ctaGlow} aria-hidden />
          <div className={homeSurfaceStyles.ctaAccentGlow} aria-hidden />

          <div className="relative mx-auto max-w-3xl">
            <Text variant="overline" tone="primary" className="mb-4 block">
              The future is here
            </Text>
            <Text id="home-cta-heading" variant="h2" as="h2" className="text-balance">
              Ready to move forward?
            </Text>
            <Text
              variant="body-lg"
              tone="muted"
              className="mx-auto mt-4 max-w-xl text-pretty leading-[var(--leading-relaxed)]"
            >
              Dealers grow with modern tools. Buyers discover with confidence.
            </Text>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/auth/sign-up/dealer" className={cn(homeLinkStyles.primary, "w-full sm:w-auto")}>
                <Icon icon={Store} size="sm" aria-hidden />
                Join as Dealer
                <Icon icon={ArrowRight} size="sm" aria-hidden />
              </Link>
              <Link href="/search" className={cn(homeLinkStyles.secondary, "w-full sm:w-auto")}>
                <Icon icon={Car} size="sm" aria-hidden />
                Explore Vehicles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
