"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Bookmark, GitCompare, Search, SlidersHorizontal } from "@/components/ui/icons/registry";
import { useSearchUi } from "@/features/search/context/search-ui-context";
import { cn } from "@/utils";

export interface SearchMobileBarProps {
  readonly className?: string;
}

export function SearchMobileBar({ className }: SearchMobileBarProps) {
  const { setMobileFiltersOpen } = useSearchUi();

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)]",
        "bg-[var(--color-glass)] px-4 py-3 backdrop-blur-xl lg:hidden",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className,
      )}
      role="toolbar"
      aria-label="Search actions"
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <Button
          variant="outline"
          size="md"
          leftIcon={<Icon icon={SlidersHorizontal} size="sm" />}
          onClick={() => setMobileFiltersOpen(true)}
          className="min-h-12 flex-1"
        >
          Filters
        </Button>
        <Button variant="primary" size="md" disabled className="min-h-12 flex-1">
          <Icon icon={Search} size="sm" aria-hidden />
          Search
        </Button>
        <Button variant="ghost" size="icon" disabled aria-label="Save search" className="min-h-12 min-w-12">
          <Icon icon={Bookmark} size="sm" tone="muted" />
        </Button>
        <Button variant="ghost" size="icon" disabled aria-label="Compare" className="min-h-12 min-w-12">
          <Icon icon={GitCompare} size="sm" tone="muted" />
        </Button>
      </div>
    </div>
  );
}
