"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/feedback";
import { FormField, Input } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Search, Sparkles } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { homeLinkStyles, homePolish } from "@/features/marketplace/homepage/components/home-shared";
import { cn } from "@/utils";

export interface HomeHeroSearchProps {
  readonly className?: string;
}

export function HomeHeroSearch({ className }: HomeHeroSearchProps) {
  const EXAMPLE_SEARCH_QUERIES = [
    "Family SUV under R500,000",
    "Reliable first car",
    "Double cab for towing",
    "Best fuel economy",
    "Luxury sedan under R800,000",
    "Safe car for a new driver",
  ];

  return (
    <div
      className={cn(
        "glass-hero-float relative w-full overflow-hidden",
        "bg-[color-mix(in_srgb,var(--color-glass)_48%,transparent)]",
        "border border-[color-mix(in_srgb,white_12%,transparent)]",
        "backdrop-blur-[36px] shadow-[0_18px_44px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.06)]",
        "p-7 sm:p-8 lg:p-9",
        "motion-card",
        className,
      )}
      role="search"
      aria-label="SURF Intelligence vehicle search"
    >
      <div className="relative space-y-6">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)]/40 pb-3">
            <Badge variant="primary" className="gap-1.5 px-3.5 py-1.5 text-[length:var(--text-caption)]">
              <Icon icon={Sparkles} size="xs" aria-hidden />
              SURF Intelligence
            </Badge>
            <Text variant="caption" tone="muted" className="text-[length:var(--text-caption)]">
              AI-assisted vehicle discovery
            </Text>
          </div>

          <Text variant="body-sm" tone="muted" className="max-w-2xl leading-[var(--leading-relaxed)]">
            Describe what you're looking for in natural language. SURF Intelligence helps you discover vehicles that match your needs.
          </Text>
        </div>

        <FormField label="Search" htmlFor="home-hero-search" className="sr-only">
          <span>Search</span>
        </FormField>

        <div className="space-y-3">
          <Text variant="label" tone="muted" className="block text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
            Find your next vehicle
          </Text>
          <div className="relative">
            <span className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 sm:left-6">
              <Icon icon={Sparkles} size="md" tone="primary" aria-hidden />
            </span>
            <Input
              id="home-hero-search"
              inputSize="lg"
              placeholder="Describe your ideal vehicle…"
              disabled
              className={cn(
                homePolish.heroSearchInput,
                "h-[3.75rem] sm:h-[4.25rem] sm:pl-[4.25rem] transition-shadow duration-200 focus:shadow-[0_8px_30px_rgba(0,102,255,0.12)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              )}
              aria-describedby="home-search-examples"
            />
          </div>
        </div>

        <div id="home-search-examples" className="space-y-3">
          <Text variant="caption" tone="muted" className="block">
            Try asking
          </Text>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SEARCH_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                disabled
                className={cn(
                  "rounded-[var(--radius-pill)] border border-[var(--color-border)]/60",
                  "bg-[var(--color-surface)]/50 px-3.5 py-2 text-[length:var(--text-body-sm)]",
                  "text-[var(--color-muted-foreground)] motion-button min-h-10 backdrop-blur-sm",
                  "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-foreground)] transition-colors duration-200",
                )}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-1">
          <Link href="/search" className={homeLinkStyles.searchSubmit}>
            <Icon icon={Search} size="sm" aria-hidden />
            Search Vehicles
          </Link>
        </div>
      </div>
    </div>
  );
}
