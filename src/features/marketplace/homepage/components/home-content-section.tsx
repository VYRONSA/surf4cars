import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { HOME_EDITORIAL_TILES } from "@/features/marketplace/homepage/config/home-content";
import { HomeSection } from "@/features/marketplace/homepage/components/home-section";
import { cn } from "@/utils";

export function HomeContentSection() {
  const featured = HOME_EDITORIAL_TILES.find((t) => t.variant === "featured");
  const standard = HOME_EDITORIAL_TILES.filter((t) => t.variant === "standard");

  return (
    <HomeSection
      id="editorial"
      eyebrow="News & Guides"
      title="Editorial, elevated"
      description="Guides and news — presented with magazine quality. Content arrives in a future phase."
      className="border-t border-[var(--color-border-subtle)]"
    >
      <div className="grid gap-5 lg:grid-cols-12 lg:grid-rows-2">
        {featured && (
          <Link
            href={featured.href}
            className={cn(
              "group relative flex min-h-[360px] flex-col justify-end overflow-hidden rounded-[var(--radius-2xl)]",
              "border border-[var(--color-border-subtle)] p-8 lg:col-span-7 lg:row-span-2 lg:min-h-[480px]",
              "motion-card hover:border-[var(--color-border)] hover:shadow-[var(--shadow-hover)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
            )}
          >
            <EditorialSurface variant="featured" />
            <div className="relative">
              <Text variant="overline" tone="accent" className="mb-3 block">
                Featured
              </Text>
              <Text variant="h2" as="h3" className="text-white">
                {featured.label}
              </Text>
              <Text variant="body-sm" className="mt-3 max-w-md text-white/75 leading-[var(--leading-relaxed)]">
                {featured.description}
              </Text>
              <span className="mt-6 inline-flex items-center gap-2 text-[length:var(--text-body-md)] font-medium text-white/90">
                Explore guides
                <Icon icon={ArrowRight} size="sm" aria-hidden />
              </span>
            </div>
          </Link>
        )}

        {standard.map((tile, index) => (
          <Link
            key={tile.id}
            href={tile.href}
            className={cn(
              "group flex min-h-[220px] flex-col justify-end overflow-hidden rounded-[var(--radius-2xl)]",
              "border border-[var(--color-border-subtle)] p-6 lg:col-span-5",
              "motion-card hover:border-[var(--color-border)] hover:shadow-[var(--shadow-hover)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
              index === 0 && "lg:row-start-1",
              index === 1 && "lg:row-start-2",
            )}
          >
            <EditorialSurface variant="standard" index={index} />
            <div className="relative">
              <Text variant="h5" as="h3" className="text-white">
                {tile.label}
              </Text>
              <Text variant="body-sm" className="mt-2 text-white/70 leading-[var(--leading-relaxed)]">
                {tile.description}
              </Text>
              <span className="mt-3 inline-flex items-center gap-1 text-[length:var(--text-body-sm)] font-medium text-white/80 opacity-0 transition-opacity motion-card group-hover:opacity-100">
                Coming soon
                <Icon icon={ArrowRight} size="xs" aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </HomeSection>
  );
}

function EditorialSurface({
  variant,
  index = 0,
}: {
  readonly variant: "featured" | "standard";
  readonly index?: number;
}) {
  const standardGradients = [
    "from-[var(--color-surface-raised)] via-[#1a1a2e] to-[var(--color-background)]",
    "from-[var(--color-surface-raised)] via-[#1a2a24] to-[var(--color-background)]",
  ] as const;

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          variant === "featured"
            ? "from-[#1a2332] via-[#0f1419] to-[var(--color-background)]"
            : standardGradients[index % standardGradients.length],
        )}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(0,0,0,0.65)_100%)]"
        aria-hidden
      />
      <div className="absolute left-6 top-6 h-2 w-16 rounded-[var(--radius-pill)] bg-white/10" aria-hidden />
    </>
  );
}
