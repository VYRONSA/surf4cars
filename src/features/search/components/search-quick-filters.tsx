"use client";

import { Icon } from "@/components/ui/icons";
import { X } from "@/components/ui/icons/registry";
import { QUICK_FILTERS } from "@/features/search/config";
import { useSearchUi } from "@/features/search/context/search-ui-context";
import { cn } from "@/utils";

export interface SearchQuickFiltersProps {
  readonly className?: string;
}

export function SearchQuickFilters({ className }: SearchQuickFiltersProps) {
  const { activeQuickFilters, toggleQuickFilter, clearQuickFilters } = useSearchUi();

  return (
    <div className={cn("space-y-3", className)} aria-label="Quick filters">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[length:var(--text-label)] font-medium uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
          Quick Filters
        </span>
        {activeQuickFilters.length > 0 && (
          <button
            type="button"
            onClick={clearQuickFilters}
            className="inline-flex items-center gap-1 text-[length:var(--text-body-sm)] text-[var(--color-primary)] motion-nav hover:text-[var(--color-primary-hover)]"
          >
            Clear
            <Icon icon={X} size="xs" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_FILTERS.map((filter) => {
          const active = activeQuickFilters.includes(filter.id);

          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggleQuickFilter(filter.id)}
              className={cn(
                "shrink-0 rounded-[var(--radius-pill)] border px-4 py-2.5",
                "text-[length:var(--text-body-sm)] font-medium motion-button",
                "min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-foreground)]",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
