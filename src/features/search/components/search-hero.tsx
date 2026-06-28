"use client";

import { HeroImageBackground } from "@/components/ui/media";
import { Badge } from "@/components/ui/feedback";
import { FormField, Input } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Search, Sparkles } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { homePolish } from "@/features/marketplace/homepage/components/home-shared";
import { EXAMPLE_SEARCH_QUERIES } from "@/features/search/config";
import { cn } from "@/utils";

export interface SearchHeroProps {
  readonly className?: string;
}

export function SearchHero({ className }: SearchHeroProps) {
  return (
    <section
      className={cn("relative overflow-hidden", className)}
      aria-labelledby="search-hero-heading"
    >
      <HeroImageBackground
        src={PREMIUM_IMAGES.sections.vehicleSearch}
        alt=""
        priority
        sizes={PREMIUM_IMAGE_SIZES.fullWidth}
        overlayVariant="cinematic"
        objectPosition="landscape"
      />

      <div className="relative mx-auto max-w-[var(--container-2xl)] px-4 pb-8 pt-8 lg:px-6 lg:pb-10 lg:pt-12">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="primary" className="mb-5 inline-flex gap-1.5 px-3 py-1">
            <Icon icon={Sparkles} size="xs" aria-hidden />
            SURF Intelligence
          </Badge>

          <Text
            id="search-hero-heading"
            variant="display-md"
            as="h1"
            className="text-balance"
          >
            Tell us what you&apos;re looking for
          </Text>

          <Text
            variant="body-lg"
            tone="muted"
            className="mx-auto mt-4 max-w-2xl text-pretty leading-[var(--leading-relaxed)]"
          >
            Search the way you think. Natural language, intelligent filters, and
            a experience built for the future of automotive discovery.
          </Text>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <div
            className={cn(homePolish.heroSearchPanel, "motion-card")}
            role="search"
            aria-label="Intelligent vehicle search"
          >
            <div className="relative space-y-6">
              <FormField label="Search" htmlFor="search-hero-query" className="sr-only">
                <span>Search</span>
              </FormField>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 sm:left-5">
                  <Icon icon={Sparkles} size="md" tone="primary" aria-hidden />
                </span>
                <Input
                  id="search-hero-query"
                  inputSize="lg"
                  placeholder="Describe your ideal vehicle…"
                  disabled
                  className={cn(homePolish.heroSearchInput, "sm:pl-[4.25rem]")}
                  aria-describedby="search-hero-examples"
                />
                <button
                  type="button"
                  disabled
                  aria-label="Search"
                  className={cn(
                    "absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center",
                    "rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white sm:size-12",
                    "motion-button hover:bg-[var(--color-primary-hover)]",
                  )}
                >
                  <Icon icon={Search} size="sm" aria-hidden />
                </button>
              </div>

              <div id="search-hero-examples" className="space-y-3">
                <Text variant="caption" tone="muted" className="block text-center sm:text-left">
                  Try asking
                </Text>
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  {EXAMPLE_SEARCH_QUERIES.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      disabled
                      className={cn(
                        "rounded-[var(--radius-pill)] border border-[var(--color-border)]/80",
                        "bg-[var(--color-surface)]/55 px-3.5 py-2.5 text-left",
                        "text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] backdrop-blur-sm",
                        "motion-button hover:border-[var(--color-primary)]/35 hover:text-[var(--color-foreground)]",
                        "min-h-10 sm:min-h-0",
                      )}
                    >
                      &ldquo;{example.query}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
