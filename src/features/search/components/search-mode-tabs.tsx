"use client";

import { cn } from "@/utils";
import type { SearchMode } from "@/features/search/config";
import { useSearchUi } from "@/features/search/context/search-ui-context";

const MODES: { id: SearchMode; label: string }[] = [
  { id: "intelligent", label: "Intelligent" },
  { id: "classic", label: "Classic" },
];

export interface SearchModeTabsProps {
  readonly className?: string;
}

export function SearchModeTabs({ className }: SearchModeTabsProps) {
  const { searchMode, setSearchMode } = useSearchUi();

  return (
    <div
      className={cn(
        "inline-flex rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1",
        className,
      )}
      role="tablist"
      aria-label="Search mode"
    >
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="tab"
          aria-selected={searchMode === mode.id}
          onClick={() => setSearchMode(mode.id)}
          className={cn(
            "rounded-[var(--radius-lg)] px-4 py-2.5 text-[length:var(--text-body-sm)] font-medium motion-button",
            "min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
            searchMode === mode.id
              ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
              : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
