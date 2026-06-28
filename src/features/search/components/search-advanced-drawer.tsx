"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { RotateCcw, SlidersHorizontal, X } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { SearchClassicFilters } from "@/features/search/components/search-classic-filters";
import { useSearchUi } from "@/features/search/context/search-ui-context";
import { cn } from "@/utils";

export interface SearchAdvancedDrawerProps {
  readonly className?: string;
}

export function SearchAdvancedDrawer({ className }: SearchAdvancedDrawerProps) {
  const { advancedDrawerOpen, setAdvancedDrawerOpen } = useSearchUi();

  if (!advancedDrawerOpen) return null;

  return (
    <div
      className={cn("fixed inset-0 z-50", className)}
      role="dialog"
      aria-modal="true"
      aria-label="Advanced filters"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 motion-nav"
        aria-label="Close advanced filters"
        onClick={() => setAdvancedDrawerOpen(false)}
      />

      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col",
          "border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]",
          "motion-drawer lg:max-w-lg xl:max-w-xl",
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Icon icon={SlidersHorizontal} size="sm" tone="primary" aria-hidden />
            <Text variant="h5" as="h2">
              Advanced Filters
            </Text>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close advanced filters"
            onClick={() => setAdvancedDrawerOpen(false)}
          >
            <Icon icon={X} size="sm" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <SearchClassicFilters compact />
        </div>

        <div className="flex gap-3 border-t border-[var(--color-border-subtle)] p-5">
          <Button variant="outline" size="md" disabled className="flex-1">
            Clear All
          </Button>
          <Button
            variant="ghost"
            size="md"
            disabled
            leftIcon={<Icon icon={RotateCcw} size="sm" />}
            className="flex-1"
          >
            Reset
          </Button>
          <Button variant="primary" size="md" disabled className="flex-1">
            Apply
          </Button>
        </div>
      </aside>
    </div>
  );
}

export function SearchAdvancedDrawerTrigger() {
  const { setAdvancedDrawerOpen } = useSearchUi();

  return (
    <Button
      variant="outline"
      size="md"
      leftIcon={<Icon icon={SlidersHorizontal} size="sm" />}
      onClick={() => setAdvancedDrawerOpen(true)}
      className="min-h-11"
    >
      Advanced
    </Button>
  );
}
