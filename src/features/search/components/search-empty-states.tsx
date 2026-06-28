import type { ReactNode } from "react";

import { EmptyState, Spinner } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import {
  AlertCircle,
  Search,
  WifiOff,
} from "@/components/ui/icons/registry";

export interface SearchEmptyStateProps {
  readonly action?: ReactNode;
}

export function SearchNoResults(props: SearchEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Search} size="lg" tone="muted" />}
      title="No results found"
      description="Try adjusting your search or filters. Intelligent search will understand natural language when connected."
      action={props.action}
    />
  );
}

export function SearchSearching() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="size-8" label="Searching" />
      <p className="text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
        Searching…
      </p>
    </div>
  );
}

export function SearchLoading() {
  return (
    <div
      className="space-y-4 py-4"
      aria-busy="true"
      aria-label="Loading search results"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/40 motion-pulse-sfc"
          aria-hidden
        />
      ))}
    </div>
  );
}

export function SearchError(props: SearchEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={AlertCircle} size="lg" tone="danger" />}
      title="Something went wrong"
      description="We couldn't complete your search. Please try again."
      action={props.action}
    />
  );
}

export function SearchOffline(props: SearchEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={WifiOff} size="lg" tone="muted" />}
      title="You're offline"
      description="Check your connection and try again. Saved searches will sync when you're back online."
      action={props.action}
    />
  );
}
