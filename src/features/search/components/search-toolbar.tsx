"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import {
  Bookmark,
  GitCompare,
  LayoutGrid,
  List,
  Map,
  Share2,
  SlidersHorizontal,
} from "@/components/ui/icons/registry";
import { DropdownMenu } from "@/components/ui/navigation";
import { Text } from "@/components/ui/typography";
import { SearchAdvancedDrawerTrigger } from "@/features/search/components/search-advanced-drawer";
import { SORT_OPTIONS, type SearchViewMode } from "@/features/search/config";
import { useSearchUi } from "@/features/search/context/search-ui-context";
import { cn } from "@/utils";

export interface SearchToolbarProps {
  readonly resultsCount?: number;
  readonly className?: string;
}

export function SearchToolbar({ resultsCount, className }: SearchToolbarProps) {
  const { viewMode, setViewMode } = useSearchUi();

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]",
        "bg-[var(--color-surface-raised)]/40 p-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Text variant="body-sm" tone="muted">
          {resultsCount !== undefined
            ? `${resultsCount.toLocaleString()} results`
            : "Results framework ready"}
        </Text>
        <SearchViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SortMenu />
        <SearchAdvancedDrawerTrigger />
        <ToolbarAction icon={Bookmark} label="Save Search" disabled />
        <ToolbarAction icon={GitCompare} label="Compare" disabled />
        <ToolbarAction icon={Share2} label="Share" disabled />
      </div>
    </div>
  );
}

interface SearchViewToggleProps {
  readonly viewMode: SearchViewMode;
  readonly onViewModeChange: (mode: SearchViewMode) => void;
}

function SearchViewToggle({ viewMode, onViewModeChange }: SearchViewToggleProps) {
  const views: { mode: SearchViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: "grid", icon: LayoutGrid, label: "Grid view" },
    { mode: "list", icon: List, label: "List view" },
    { mode: "map", icon: Map, label: "Map view" },
  ];

  return (
    <div
      className="inline-flex rounded-[var(--radius-lg)] border border-[var(--color-border)] p-1"
      role="group"
      aria-label="View mode"
    >
      {views.map(({ mode, icon, label }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={viewMode === mode}
          aria-label={label}
          disabled={mode === "map"}
          title={mode === "map" ? "Coming soon" : undefined}
          onClick={() => onViewModeChange(mode)}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] motion-button",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
            viewMode === mode
              ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
              : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
            mode === "map" && "cursor-not-allowed opacity-50",
          )}
        >
          <Icon icon={icon} size="sm" aria-hidden />
        </button>
      ))}
    </div>
  );
}

function SortMenu() {
  return (
    <DropdownMenu
      trigger={
        <Button variant="outline" size="md" className="min-h-11">
          Sort
        </Button>
      }
      items={SORT_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        disabled: true,
      }))}
    />
  );
}

function ToolbarAction({
  icon,
  label,
  disabled,
}: {
  readonly icon: typeof Bookmark;
  readonly label: string;
  readonly disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled}
      aria-label={label}
      className="min-h-11 min-w-11"
    >
      <Icon icon={icon} size="sm" tone="muted" />
    </Button>
  );
}

export function SearchMobileFilterTrigger() {
  const { setMobileFiltersOpen } = useSearchUi();

  return (
    <Button
      variant="outline"
      size="md"
      leftIcon={<Icon icon={SlidersHorizontal} size="sm" />}
      onClick={() => setMobileFiltersOpen(true)}
      className="min-h-11 flex-1"
    >
      Filters
    </Button>
  );
}
