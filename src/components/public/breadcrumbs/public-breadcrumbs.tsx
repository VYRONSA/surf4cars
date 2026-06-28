import type { ReactNode } from "react";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/ui/navigation";
import { cn } from "@/utils";

export type PublicBreadcrumbItem = BreadcrumbItem;

export interface PublicBreadcrumbsProps {
  readonly items: readonly PublicBreadcrumbItem[];
  readonly className?: string;
}

export function PublicBreadcrumbs({ items, className }: PublicBreadcrumbsProps) {
  return (
    <Breadcrumbs
      items={items}
      className={cn("text-[var(--color-muted-foreground)]", className)}
    />
  );
}

export interface PublicPageBreadcrumbsProps extends PublicBreadcrumbsProps {
  readonly trailing?: ReactNode;
}

export function PublicPageBreadcrumbs({
  items,
  trailing,
  className,
}: PublicPageBreadcrumbsProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:mb-6",
        className,
      )}
    >
      <PublicBreadcrumbs items={items} />
      {trailing}
    </div>
  );
}
