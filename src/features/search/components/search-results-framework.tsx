"use client";

import type { ReactNode } from "react";

import { PublicPageBreadcrumbs } from "@/components/public/breadcrumbs";
import { PublicPagination } from "@/components/public/pagination";
import { SearchAdvancedDrawer } from "@/features/search/components/search-advanced-drawer";
import { SearchClassicFilters } from "@/features/search/components/search-classic-filters";
import { SearchHero } from "@/features/search/components/search-hero";
import { SearchMobileBar } from "@/features/search/components/search-mobile-bar";
import { SearchMobileFiltersDrawer } from "@/features/search/components/search-mobile-filters-drawer";
import { SearchModeTabs } from "@/features/search/components/search-mode-tabs";
import { SearchNoResults } from "@/features/search/components/search-empty-states";
import { SearchQuickFilters } from "@/features/search/components/search-quick-filters";
import { SearchToolbar } from "@/features/search/components/search-toolbar";
import { SearchUiProvider, useSearchUi } from "@/features/search/context/search-ui-context";
import { cn } from "@/utils";

export interface SearchResultsFrameworkProps {
  readonly resultsSlot?: ReactNode;
  readonly emptySlot?: ReactNode;
  readonly showHero?: boolean;
  readonly className?: string;
}

export function SearchResultsFramework(props: SearchResultsFrameworkProps) {
  return (
    <SearchUiProvider>
      <SearchResultsFrameworkInner {...props} />
    </SearchUiProvider>
  );
}

function SearchResultsFrameworkInner({
  resultsSlot,
  emptySlot,
  showHero = true,
  className,
}: SearchResultsFrameworkProps) {
  const { searchMode, viewMode } = useSearchUi();

  return (
    <div className={cn("pb-24 lg:pb-10", className)}>
      {showHero && <SearchHero />}

      <div className="mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <PublicPageBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Search" },
          ]}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchModeTabs />
        </div>

        {searchMode === "intelligent" ? (
          <div className="mb-6">
            <SearchQuickFilters />
          </div>
        ) : (
          <div className="mb-6 lg:hidden">
            <SearchQuickFilters />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
          <aside className="hidden lg:block" aria-label="Search filters">
            <div className="sticky top-24 space-y-4">
              {searchMode === "classic" && <SearchClassicFilters />}
              {searchMode === "intelligent" && (
                <SearchClassicFilters className="opacity-90" />
              )}
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <SearchToolbar />

            <SearchResultsViewport viewMode={viewMode}>
              {resultsSlot}
              {!resultsSlot && (emptySlot ?? <SearchNoResults />)}
            </SearchResultsViewport>

            <PublicPagination showInfo={false} />
          </div>
        </div>
      </div>

      <SearchAdvancedDrawer />
      <SearchMobileFiltersDrawer />
      <SearchMobileBar />
    </div>
  );
}

function SearchResultsViewport({
  viewMode,
  children,
}: {
  readonly viewMode: "grid" | "list" | "map";
  readonly children: ReactNode;
}) {
  if (viewMode === "map") {
    return (
      <div
        className="flex min-h-[320px] items-center justify-center rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30"
        aria-label="Map view placeholder"
      >
        <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          Map view — coming soon
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
          : "flex flex-col gap-4",
      )}
      aria-live="polite"
      aria-label="Search results"
    >
      {children}
    </div>
  );
}
