import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/utils";

export interface PublicCardGridSkeletonProps {
  readonly count?: number;
  readonly columns?: 2 | 3 | 4;
  readonly className?: string;
}

export function PublicCardGridSkeleton({
  count = 4,
  columns = 4,
  className,
}: PublicCardGridSkeletonProps) {
  const gridClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div
      className={cn("grid gap-4", gridClass, className)}
      aria-busy="true"
      aria-label="Loading cards"
    >
      {Array.from({ length: count }).map((_, i) => (
        <PublicCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PublicCardSkeleton({ className }: { readonly className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]", className)}>
      <Skeleton variant="rectangular" className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
        <Skeleton variant="text" className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function PublicListSkeleton({
  count = 6,
  className,
}: {
  readonly count?: number;
  readonly className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] p-4">
          <Skeleton variant="rectangular" className="size-16 shrink-0 rounded-[var(--radius-lg)]" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicSearchSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] p-6",
        className,
      )}
      aria-busy="true"
      aria-label="Loading search"
    >
      <Skeleton variant="text" className="mb-4 h-12 w-full rounded-[var(--radius-xl)]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-10 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    </div>
  );
}

export function PublicVehiclePageSkeleton({ className }: { readonly className?: string }) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true" aria-label="Loading vehicle page">
      <Skeleton variant="rectangular" className="aspect-[16/10] w-full rounded-[var(--radius-2xl)]" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="h-4 w-full" />
          ))}
        </div>
        <Skeleton variant="rectangular" className="h-64 rounded-[var(--radius-xl)]" />
      </div>
    </div>
  );
}

export function PublicDealerPageSkeleton({ className }: { readonly className?: string }) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true" aria-label="Loading dealer page">
      <Skeleton variant="rectangular" className="h-48 w-full rounded-[var(--radius-2xl)] lg:h-56" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <PublicCardGridSkeleton count={3} columns={3} />
        <Skeleton variant="rectangular" className="h-48 rounded-[var(--radius-xl)]" />
      </div>
    </div>
  );
}

export function PublicArticleSkeleton({ className }: { readonly className?: string }) {
  return (
    <div className={cn("mx-auto max-w-2xl space-y-6", className)} aria-busy="true" aria-label="Loading article">
      <Skeleton variant="rectangular" className="aspect-[21/9] w-full rounded-[var(--radius-2xl)]" />
      <div className="flex gap-3">
        <Skeleton variant="text" className="h-4 w-24" />
        <Skeleton variant="text" className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
