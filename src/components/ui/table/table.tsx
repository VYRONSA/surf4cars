import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/utils";

export function Table({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto rounded-[var(--radius-xl)] border border-[var(--color-border)]">
      <table
        className={cn("w-full caption-bottom text-[length:var(--text-body-sm)]", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  sticky,
  ...props
}: HTMLAttributes<HTMLTableSectionElement> & { readonly sticky?: boolean }) {
  return (
    <thead
      className={cn(
        "border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)]",
        sticky && "sticky top-0 z-10",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

export function TableFooter({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn(
        "border-t border-[var(--color-border)] bg-[var(--color-surface-sunken)] font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({
  className,
  selected,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { readonly selected?: boolean }) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--color-border-subtle)] motion-hover hover:bg-[var(--color-hover)]",
        selected && "bg-[var(--color-primary-muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  sortable,
  sorted,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  readonly sortable?: boolean;
  readonly sorted?: "asc" | "desc" | false;
}) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-[length:var(--text-label)] font-medium text-[var(--color-muted-foreground)]",
        sortable && "cursor-pointer select-none motion-hover hover:text-[var(--color-foreground)]",
        className,
      )}
      aria-sort={
        sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
      }
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 align-middle text-[var(--color-foreground)]", className)}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn("mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]", className)}
      {...props}
    />
  );
}

export interface TableToolbarProps extends HTMLAttributes<HTMLDivElement> {
  readonly filters?: ReactNode;
  readonly actions?: ReactNode;
}

export function TableToolbar({
  filters,
  actions,
  className,
  ...props
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">{filters}</div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

export interface TablePaginationProps extends HTMLAttributes<HTMLDivElement> {
  readonly pageInfo?: ReactNode;
  readonly controls?: ReactNode;
}

export function TablePagination({
  pageInfo,
  controls,
  className,
  ...props
}: TablePaginationProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {pageInfo}
      </div>
      <div className="flex items-center gap-2">{controls}</div>
    </div>
  );
}

export interface TableBulkActionsProps extends HTMLAttributes<HTMLDivElement> {
  readonly selectedCount?: number;
  readonly actions?: ReactNode;
}

export function TableBulkActions({
  selectedCount,
  actions,
  className,
  ...props
}: TableBulkActionsProps) {
  if (!selectedCount) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2",
        className,
      )}
      {...props}
    >
      <span className="text-[length:var(--text-body-sm)] font-medium">
        {selectedCount} selected
      </span>
      {actions}
    </div>
  );
}
