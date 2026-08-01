"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { Icon } from "@/components/ui/icons";
import { Check, SlidersHorizontal } from "@/components/ui/icons/registry";
import { DropdownMenu } from "@/components/ui/navigation";
import { COLLECTION_LINKS, SORT_OPTIONS } from "@/features/search/config";
import { useSearchUi } from "@/features/search/context/search-ui-context";
import { parseSearchState, serializeSearchState } from "@/features/search/utils/search-query";
import { cn } from "@/utils";

/**
 * The catalogue header.
 *
 * It replaces five stacked control rows — breadcrumbs, an Intelligent/Classic tab pair, a "QUICK
 * FILTERS" label over ten chips, and a bordered toolbar carrying Filters, a result count, a
 * grid/list/map switch, Sort, Advanced, Save Search, Compare and Share. A buyer scrolled past all of
 * it to reach the first photograph, and most of it did nothing: the tabs rendered the same content on
 * both sides, the chips filtered nothing, Sort was disabled in full, map view was disabled, and Save
 * Search, Compare and Share were disabled icons. The page opened on a control panel for a machine
 * that was not plugged in.
 *
 * What is left is what a buyer needs to steer the catalogue and nothing else: where they are, how much
 * of it there is, a way in, and a way to order it. Both surviving controls do their job.
 */

export interface SearchCatalogueHeaderProps {
  /** Total matches across every page, not the length of this one. */
  readonly resultsCount?: number;
  /** Reads as a headline, so it is composed from the filters rather than echoing the query string. */
  readonly heading: string;
  readonly subheading?: string;
  readonly className?: string;
}

export function SearchCatalogueHeader({
  resultsCount,
  heading,
  subheading,
  className,
}: SearchCatalogueHeaderProps) {
  const { setMobileFiltersOpen } = useSearchUi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentState = useMemo(() => parseSearchState(searchParams), [searchParams]);
  const activeSort = currentState.sort ?? "relevance";

  /* Sorting resets to page one. Holding page 7 while reordering the whole set lands a buyer in the
     middle of a catalogue they have not seen the start of. */
  function applySort(id: string) {
    const next = serializeSearchState({
      ...currentState,
      sort: id === "relevance" ? undefined : (id as typeof currentState.sort),
      page: 1,
    });
    router.push(`/search${next}`);
  }

  const activeCollection = COLLECTION_LINKS.find(
    (link) => new URLSearchParams(link.query).toString() === searchParams.toString(),
  );

  return (
    /*
      The marketplace opens like the homepage, in the same voice.
      ==========================================================
      A visitor arriving here from the hero met a 40px heading on flat graphite and knew immediately
      they had crossed into a different product. The photography changes — that is the nature of a
      catalogue — so the continuity has to come from the typography and the rhythm instead.

      Three devices carry it, all borrowed from the hero rather than invented: a tracked-out eyebrow,
      a display-scale statement, and the red hairline rule beneath it. Nothing else about the page's
      structure changed; this is the same header doing the same job at the brand's actual scale.
    */
    <header className={cn("pt-14 lg:pt-20", className)}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[length:var(--text-caption)] font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Marketplace
          </p>
          <h1 className="mt-4 text-balance text-[length:var(--text-h1)] font-semibold leading-[1.02] tracking-[-0.025em] text-[var(--color-foreground)] lg:text-[length:var(--text-display-md)]">
            {heading}
          </h1>
          <div aria-hidden className="mt-6 h-[3px] w-16 rounded-full bg-[var(--color-primary)]" />
          {subheading && (
            <p className="mt-6 max-w-xl text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
              {subheading}
            </p>
          )}
        </div>

        {/* Two controls, unboxed. The toolbar's border was drawing a container around functionality
            that reads perfectly well as a pair of buttons at the end of a heading. */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className={cn(
              "motion-button inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-pill)]",
              "border border-[var(--color-border)] px-5 text-[length:var(--text-body-sm)] font-medium",
              "text-[var(--color-foreground)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
            )}
          >
            <Icon icon={SlidersHorizontal} className="size-4" aria-hidden />
            Refine
          </button>

          <DropdownMenu
            trigger={
              <button
                type="button"
                className={cn(
                  "motion-button inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-pill)]",
                  "border border-[var(--color-border)] px-5 text-[length:var(--text-body-sm)] font-medium",
                  "text-[var(--color-foreground)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
                )}
              >
                {SORT_OPTIONS.find((option) => option.id === activeSort)?.label ?? "Most relevant"}
              </button>
            }
            items={SORT_OPTIONS.map((option) => ({
              id: option.id,
              label: option.label,
              icon:
                option.id === activeSort ? (
                  <Icon icon={Check} className="size-4 text-[var(--color-primary-text)]" aria-hidden />
                ) : undefined,
              onSelect: () => applySort(option.id),
            }))}
          />
        </div>
      </div>

      {/* Collections, as links. Each is a real query and a real URL. */}
      <nav
        aria-label="Browse collections"
        className="mt-10 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {COLLECTION_LINKS.map((link) => {
          const active = activeCollection?.id === link.id;
          return (
            <Link
              key={link.id}
              href={active ? "/search" : `/search?${link.query}`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "motion-button inline-flex min-h-10 shrink-0 items-center rounded-[var(--radius-pill)]",
                "border px-4 text-[length:var(--text-body-sm)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
                active
                  ? "border-[var(--color-foreground)] bg-[var(--color-foreground)] font-medium text-[var(--color-background)]"
                  : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-foreground)]",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/*
        The count, set as a caption under a hairline rather than as a metric in a panel.

        Suppressed at zero. It used to read "No vehicles match" directly above an empty state whose
        headline said the same thing in better words — the page telling a disappointed buyer twice.
        The rule keeps its edge: the count reports what is there, and when nothing is, the empty
        state speaks alone.
      */}
      <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-4">
        {resultsCount !== 0 && (
          <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            {resultsCount === undefined
              ? "Loading the marketplace"
              : `${resultsCount.toLocaleString("en-ZA").replace(/,/g, " ")} ${resultsCount === 1 ? "vehicle" : "vehicles"}`}
          </p>
        )}
      </div>
    </header>
  );
}
