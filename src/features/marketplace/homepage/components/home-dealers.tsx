import Link from "next/link";

import { HeroImage } from "@/components/ui/media";
import { Icon } from "@/components/ui/icons";
import { ArrowRight, Megaphone, Sparkles, Store } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { HOME_DEALER_PILLARS } from "@/features/marketplace/homepage/config/home-content";
import { HomeSection } from "@/features/marketplace/homepage/components/home-section";
import { homeLinkStyles } from "@/features/marketplace/homepage/components/home-shared";

const PILLAR_ICONS = [Store, Megaphone, Sparkles] as const;

export function HomeDealers() {
  return (
    <HomeSection
      id="dealers"
      eyebrow="Dealer Growth"
      title="Join the dealerships moving forward"
      description="A single platform for presence, marketing, and intelligent growth — without the legacy software feel."
      className="border-y border-[var(--color-border-subtle)]"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <DealerVisual />

        <div className="space-y-8">
          <div className="grid gap-4">
            {HOME_DEALER_PILLARS.map((pillar, index) => (
              <article
                key={pillar.id}
                className="flex gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40 p-5 motion-card hover:-translate-y-0.5 hover:border-[var(--color-border)] hover:shadow-[var(--shadow-sm)]"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
                  <Icon icon={PILLAR_ICONS[index]!} size="md" aria-hidden />
                </span>
                <div>
                  <Text variant="h5" as="h3">
                    {pillar.title}
                  </Text>
                  <Text variant="body-sm" tone="muted" className="mt-1 leading-[var(--leading-relaxed)]">
                    {pillar.tagline}
                  </Text>
                </div>
              </article>
            ))}
          </div>

          <Link href="/auth/sign-up/dealer" className={homeLinkStyles.accent}>
            Join as Dealer
            <Icon icon={ArrowRight} size="sm" aria-hidden />
          </Link>
        </div>
      </div>
    </HomeSection>
  );
}

function DealerVisual() {
  return (
    <HeroImage
      src={PREMIUM_IMAGES.sections.dealerGrowth}
      alt="Dealership growth platform preview"
      sizes={PREMIUM_IMAGE_SIZES.sectionHalf}
      objectPosition="heroSubject"
      className="aspect-[4/5] rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] sm:aspect-[3/4] lg:aspect-auto lg:min-h-[520px]"
    />
  );
}
