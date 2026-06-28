import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import {
  BarChart3,
  Bell,
  Bot,
  Car,
  Megaphone,
  MessageSquare,
  Search,
} from "@/components/ui/icons/registry";

export interface ShellEmptyStateProps {
  readonly action?: ReactNode;
}

export function EmptyVehicles(props: ShellEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Car} size="lg" tone="muted" />}
      title="No vehicles"
      description="Vehicles will appear here once inventory is connected."
      action={props.action}
    />
  );
}

export function EmptyCampaigns(props: ShellEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Megaphone} size="lg" tone="muted" />}
      title="No campaigns"
      description="Marketing campaigns will appear here when the studio is connected."
      action={props.action}
    />
  );
}

export function EmptyAnalytics(props: ShellEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={BarChart3} size="lg" tone="muted" />}
      title="No analytics"
      description="Performance data will appear here once tracking is connected."
      action={props.action}
    />
  );
}

export function EmptyResults(props: ShellEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Search} size="lg" tone="muted" />}
      title="No results"
      description="Try adjusting your search or filters."
      action={props.action}
    />
  );
}

export function EmptyMessages(props: ShellEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={MessageSquare} size="lg" tone="muted" />}
      title="No messages"
      description="Conversations with dealers will appear here."
      action={props.action}
    />
  );
}

export function EmptyAiResults(props: ShellEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Bot} size="lg" tone="muted" />}
      title="No AI results"
      description="AI insights and recommendations will appear here when connected."
      action={props.action}
    />
  );
}

export function EmptyNotifications(props: ShellEmptyStateProps) {
  return (
    <EmptyState
      icon={<Icon icon={Bell} size="lg" tone="muted" />}
      title="No notifications"
      description="You're all caught up. New alerts will appear here."
      action={props.action}
    />
  );
}
