import { HeroImageBackground } from "@/components/ui/media";
import { Icon } from "@/components/ui/icons";
import { Bot, Megaphone, Sparkles, Target } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { HOME_AI_DEALER_CARDS } from "@/features/marketplace/homepage/config/home-content";
import { HomeSection } from "@/features/marketplace/homepage/components/home-section";
import { cn } from "@/utils";

const AI_ICONS = [Megaphone, Bot, Target] as const;

export function HomeAiSection() {
  return (
    <HomeSection
      id="surf-ai"
      eyebrow="SURF AI"
      title="Quiet intelligence for dealerships"
      description="No chat windows. No gimmicks. AI that works behind the scenes — so your team can focus on selling."
      align="center"
    >
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] p-6 lg:p-10">
        <HeroImageBackground
          src={PREMIUM_IMAGES.sections.aiIntelligence}
          alt=""
          sizes={PREMIUM_IMAGE_SIZES.sectionWide}
          overlayVariant="contained"
          objectPosition="center"
        />

        <div className="relative mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-secondary)]/25 bg-[var(--color-secondary-muted)] px-4 py-2">
            <Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />
            <Text variant="label" tone="primary">
              SURF Intelligence
            </Text>
          </div>
        </div>

        <div className="relative grid gap-5 md:grid-cols-3">
          {HOME_AI_DEALER_CARDS.map((card, index) => (
            <article
              key={card.id}
              className={cn(
                "glass-card p-7 text-center motion-card",
                "hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]",
              )}
            >
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-secondary-muted)] text-[var(--color-secondary)]">
                <Icon icon={AI_ICONS[index]!} size="md" aria-hidden />
              </div>
              <Text variant="h5" as="h3">
                {card.title}
              </Text>
              <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
                {card.tagline}
              </Text>
            </article>
          ))}
        </div>
      </div>
    </HomeSection>
  );
}
