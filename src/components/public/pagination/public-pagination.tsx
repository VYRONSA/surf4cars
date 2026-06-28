"use client";

import type { HTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

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
        <Button
          variant="outline"
          size="icon-sm"
          disabled
          aria-label="Previous page"
        >
          <Icon icon={ChevronLeft} size="sm" />
        </Button>

        <PaginationPages currentPage={currentPage} totalPages={totalPages} />

        <Button
          variant="outline"
          size="icon-sm"
          disabled
          aria-label="Next page"
        >
          <Icon icon={ChevronRight} size="sm" />
        </Button>
      </div>
    </nav>
  );
}

interface PaginationPagesProps {
  readonly currentPage: number;
  readonly totalPages: number;
}

function PaginationPages({ currentPage, totalPages }: PaginationPagesProps) {
  const pages = buildPageList(currentPage, totalPages);

  return (
    <div className="flex items-center gap-1" role="list">
      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-[var(--color-muted)]"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "primary" : "ghost"}
            size="icon-sm"
            disabled
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
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
