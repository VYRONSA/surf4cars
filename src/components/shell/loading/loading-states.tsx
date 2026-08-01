import { SurfWordmark } from "@/components/brand";
import { Skeleton, Spinner } from "@/components/ui/feedback";
import { cn } from "@/utils";

export function PageLoading({ className }: { readonly className?: string }) {
  return (
    <div
      className={cn("flex flex-1 flex-col gap-6 p-6 lg:p-8", className)}
      role="status"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-4 pb-2">
        <SurfWordmark size="header" />
        <Spinner className="size-5" label="Loading" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardLoadingSkeleton key={i} />
        ))}
      </div>
      <TableLoadingSkeleton rows={6} />
    </div>
  );
}

export function CardLoadingSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--color-border)] p-4",
        className,
      )}
      aria-hidden
    >
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function TableLoadingSkeleton({
  rows = 5,
  className,
}: {
  readonly rows?: number;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]",
        className,
      )}
      aria-hidden
    >
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-4">
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="size-10 rounded-[var(--radius-lg)]" variant="circular" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiLoadingSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-12 text-center",
        className,
      )}
      role="status"
      aria-label="AI processing"
    >
      <Spinner className="size-8" />
      <div className="space-y-2">
        <Skeleton className="mx-auto h-4 w-40" />
        <Skeleton className="mx-auto h-3 w-56" />
      </div>
    </div>
  );
}

export function InlineLoading({ label = "Loading" }: { readonly label?: string }) {
  return (
    <div className="flex items-center gap-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
      <Spinner className="size-4" label={label} />
      <span>{label}</span>
    </div>
  );
}
