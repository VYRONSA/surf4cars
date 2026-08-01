"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { HTMLAttributes, ReactNode } from "react";

import { Icon } from "@/components/ui/icons";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

/**
 * Pagination that pages.
 *
 * WHAT THIS REPLACES
 * ==================
 * A control where **every button was hardcoded `disabled`** — Previous, Next and each page number —
 * with no handler and no href behind any of them. The marketplace rendered it under 229 vehicles at
 * 24 to a page, so 205 of them could not be reached by clicking anything. The only way through the
 * catalogue was to type `?page=2` into the address bar.
 *
 * It was also mounted with no props at all, so `totalPages` fell to its default of 1 and the control
 * did not even know there was anywhere to go.
 *
 * This is the most expensive kind of dead UI: not a button that looks broken, but one that looks
 * finished. A buyer reaching the bottom of page one concludes the marketplace holds 24 cars.
 *
 * LINKS, NOT BUTTONS
 * ==================
 * Every destination is a real URL carrying the current filters, so a page deep in a filtered set can
 * be shared, bookmarked, opened in a new tab and reached with the browser's own Back. Click handlers
 * would have given none of that, and the search page already reads its whole state from the query
 * string — pagination was the one control never wired to it.
 */

export interface PublicPaginationProps extends HTMLAttributes<HTMLElement> {
  readonly currentPage?: number;
  readonly totalPages?: number;
  readonly pageSize?: number;
  readonly totalItems?: number;
  readonly showInfo?: boolean;
}

export function PublicPagination({
  currentPage = 1,
  totalPages = 1,
  pageSize = 24,
  totalItems,
  showInfo = true,
  className,
  ...props
}: PublicPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* One page is not a catalogue to navigate. A lone disabled "1" is the same dead control in
     miniature. */
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const start = totalItems ? (currentPage - 1) * pageSize + 1 : undefined;
  const end = totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-4 border-t border-[var(--color-border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      {showInfo && (
        <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {totalItems !== undefined && start !== undefined && end !== undefined
            ? `Showing ${start}–${end} of ${totalItems}`
            : `Page ${currentPage} of ${totalPages}`}
        </p>
      )}

      <div className="flex items-center gap-1">
        <Step href={hrefFor(currentPage - 1)} enabled={currentPage > 1} label="Previous page">
          <Icon icon={ChevronLeft} size="sm" aria-hidden />
        </Step>

        <PaginationPages currentPage={currentPage} totalPages={totalPages} hrefFor={hrefFor} />

        <Step href={hrefFor(currentPage + 1)} enabled={currentPage < totalPages} label="Next page">
          <Icon icon={ChevronRight} size="sm" aria-hidden />
        </Step>
      </div>
    </nav>
  );
}

/**
 * A step control that is a link when it goes somewhere and inert markup when it does not.
 *
 * At the first and last page the arrow genuinely has no destination, and a disabled *link* is not a
 * thing HTML has. That boundary is the one place in this component where inert is honest.
 */
function Step({
  href,
  enabled,
  label,
  children,
}: {
  readonly href: string;
  readonly enabled: boolean;
  readonly label: string;
  readonly children: ReactNode;
}) {
  const shape =
    "motion-button inline-flex size-9 items-center justify-center rounded-[var(--radius-lg)] border";

  if (!enabled) {
    return (
      <span
        aria-hidden
        className={cn(shape, "border-[var(--color-border-subtle)] text-[var(--color-muted)] opacity-45")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        shape,
        "border-[var(--color-border)] text-[var(--color-foreground)]",
        "hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
      )}
    >
      {children}
    </Link>
  );
}

interface PaginationPagesProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly hrefFor: (page: number) => string;
}

function PaginationPages({ currentPage, totalPages, hrefFor }: PaginationPagesProps) {
  const pages = buildPageList(currentPage, totalPages);

  return (
    <div className="flex items-center gap-1">
      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-[var(--color-muted)]" aria-hidden>
            …
          </span>
        ) : page === currentPage ? (
          /* The current page is not a destination. It reads as the marker it is, rather than as a
             link that appears to do nothing when clicked. */
          <span
            key={page}
            aria-current="page"
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-body-sm)] font-medium text-white"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={hrefFor(page)}
            aria-label={`Page ${page}`}
            className={cn(
              "motion-button inline-flex size-9 items-center justify-center rounded-[var(--radius-lg)]",
              "text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]",
              "hover:bg-[var(--color-hover)] hover:text-[var(--color-foreground)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
            )}
          >
            {page}
          </Link>
        ),
      )}
    </div>
  );
}

function buildPageList(current: number, total: number): readonly (number | "ellipsis")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total];
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}
