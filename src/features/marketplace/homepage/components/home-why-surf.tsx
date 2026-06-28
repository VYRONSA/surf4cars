import { Icon } from "@/components/ui/icons";
import { Bot, Car, TrendingUp } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { HOME_PILLARS } from "@/features/marketplace/homepage/config/home-content";
import { HomeSection } from "@/features/marketplace/homepage/components/home-section";
import { cn } from "@/utils";

const PILLAR_ICONS = {
  "ai-marketing": Bot,
  "dealer-growth": TrendingUp,
  discovery: Car,
} as const;

export function HomeWhySurf() {
  return (
    <HomeSection
      id="why-surf"
      eyebrow="Why SURF FOR CARS"
      title="Built for the future of automotive"
      align="center"
      compact
      className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)]/30"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {HOME_PILLARS.map((pillar) => {
          const IconComponent = PILLAR_ICONS[pillar.id as keyof typeof PILLAR_ICONS];

          return (
            <article
              key={pillar.id}
              className={cn(
                "glass-card group relative overflow-hidden p-7 text-center motion-card",
                "hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]",
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,102,255,0.08),transparent_60%)] opacity-0 transition-opacity motion-card group-hover:opacity-100"
                aria-hidden
              />
              <div className="relative">
                <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-[var(--radius-2xl)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] transition-transform motion-card group-hover:scale-105">
                  <Icon icon={IconComponent} size="lg" aria-hidden />
                </div>
                <Text variant="h4" as="h3">
                  {pillar.title}
                </Text>
                <Text variant="body-sm" tone="muted" className="mt-3 leading-[var(--leading-relaxed)]">
                  {pillar.tagline}
                </Text>
              </div>
            </article>
          );
        })}
      </div>
    </HomeSection>
  );
}
