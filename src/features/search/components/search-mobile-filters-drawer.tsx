"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { RotateCcw, X } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { SearchClassicFilters } from "@/features/search/components/search-classic-filters";
import { useSearchUi } from "@/features/search/context/search-ui-context";
import { cn } from "@/utils";

export function SearchMobileFiltersDrawer() {
  const { mobileFiltersOpen, setMobileFiltersOpen } = useSearchUi();

  if (!mobileFiltersOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Search filters"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 motion-nav"
        aria-label="Close filters"
        onClick={() => setMobileFiltersOpen(false)}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col",
          "rounded-t-[var(--radius-2xl)] border-t border-[var(--color-border)]",
          "bg-[var(--color-surface)] shadow-[var(--shadow-xl)] motion-drawer",
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
          <Text variant="h5" as="h2">
            Filters
          </Text>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <Icon icon={X} size="sm" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <SearchClassicFilters compact />
        </div>

        <div className="flex gap-3 border-t border-[var(--color-border-subtle)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" size="md" disabled className="flex-1 min-h-12">
            Clear
          </Button>
          <Button
            variant="ghost"
            size="md"
            disabled
            leftIcon={<Icon icon={RotateCcw} size="sm" />}
            className="flex-1 min-h-12"
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1 min-h-12"
            onClick={() => setMobileFiltersOpen(false)}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
