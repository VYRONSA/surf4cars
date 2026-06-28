import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import {
  BookOpen,
  Car,
  Layers,
  Newspaper,
  Search,
  Store,
} from "@/components/ui/icons/registry";

export interface PublicEmptyStateProps {
  readonly action?: ReactNode;
}

export function PublicEmptySearch(props: PublicEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Search} size="lg" tone="muted" />}
      title="No search results"
      description="Adjust your search criteria or filters to find vehicles."
      action={props.action}
    />
  );
}

export function PublicEmptyVehicles(props: PublicEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Car} size="lg" tone="muted" />}
      title="No vehicles"
      description="Vehicles matching your criteria will appear here."
      action={props.action}
    />
  );
}

export function PublicEmptyDealers(props: PublicEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Store} size="lg" tone="muted" />}
      title="No dealers"
      description="Dealers matching your criteria will appear here."
      action={props.action}
    />
  );
}

export function PublicEmptyCollections(props: PublicEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Layers} size="lg" tone="muted" />}
      title="No collections"
      description="Curated collections will appear here."
      action={props.action}
    />
  );
}

export function PublicEmptyArticles(props: PublicEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Newspaper} size="lg" tone="muted" />}
      title="No articles"
      description="Articles and news will appear here."
      action={props.action}
    />
  );
}

export function PublicEmptyNoResults(props: PublicEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={BookOpen} size="lg" tone="muted" />}
      title="No results found"
      description="Try different keywords or browse our categories."
      action={props.action}
    />
  );
}
