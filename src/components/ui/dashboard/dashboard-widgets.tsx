import type { HTMLAttributes, ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type DivProps } from "@/components/ui/shared";
import { cn } from "@/utils";

export interface MetricWidgetProps extends DivProps {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly change?: ReactNode;
  readonly icon?: ReactNode;
  readonly footer?: ReactNode;
}

export function MetricWidget({
  label,
  value,
  change,
  icon,
  footer,
  className,
  ...props
}: MetricWidgetProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader className="flex-row items-start justify-between pb-2">
        <CardDescription>{label}</CardDescription>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)]">
          {value}
        </p>
        {change && (
          <div className="mt-1 text-[length:var(--text-body-sm)]">{change}</div>
        )}
        {footer && <div className="mt-4">{footer}</div>}
      </CardContent>
    </Card>
  );
}

export interface ChartContainerProps extends DivProps {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly height?: number | string;
}

export function ChartContainer({
  title,
  description,
  actions,
  children,
  height = 280,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <Card className={className} {...props}>
      {(title ?? description ?? actions) && (
        <CardHeader className="flex-row items-start justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions}
        </CardHeader>
      )}
      <CardContent>
        <div
          className="w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)]"
          style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export interface ActivityFeedProps extends DivProps {
  readonly title?: ReactNode;
  readonly items: readonly ReactNode[];
  readonly empty?: ReactNode;
}

export function ActivityFeed({
  title,
  items,
  empty,
  className,
  ...props
}: ActivityFeedProps) {
  return (
    <Card className={className} {...props}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {items.length === 0 ? (
          empty
        ) : (
          <ul className="space-y-4">
            {items.map((item, index) => (
              <li
                key={index}
                className="relative pl-6 before:absolute before:left-0 before:top-2 before:size-2 before:rounded-[var(--radius-pill)] before:bg-[var(--color-border-strong)]"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export interface TimelineProps extends DivProps {
  readonly items: readonly {
    readonly content: ReactNode;
    readonly timestamp?: ReactNode;
  }[];
}

export function Timeline({ items, className, ...props }: TimelineProps) {
  return (
    <div className={cn("relative space-y-6", className)} {...props}>
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-[var(--color-border)]" aria-hidden />
      {items.map((item, index) => (
        <div key={index} className="relative flex gap-4 pl-6">
          <span className="absolute left-0 top-1.5 size-3.5 rounded-[var(--radius-pill)] border-2 border-[var(--color-primary)] bg-[var(--color-background)]" />
          <div className="min-w-0 flex-1">
            {item.content}
            {item.timestamp && (
              <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                {item.timestamp}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface HeatmapProps extends DivProps {
  readonly title?: ReactNode;
  readonly cells: readonly ReactNode[];
  readonly columns?: number;
}

export function Heatmap({
  title,
  cells,
  columns = 7,
  className,
  ...props
}: HeatmapProps) {
  return (
    <Card className={className} {...props}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {cells}
        </div>
      </CardContent>
    </Card>
  );
}

export interface HeatmapCellProps extends HTMLAttributes<HTMLDivElement> {
  readonly intensity?: number;
  readonly label?: string;
}

export function HeatmapCell({
  intensity = 0,
  label,
  className,
  ...props
}: HeatmapCellProps) {
  return (
    <div
      title={label}
      aria-label={label}
      className={cn(
        "aspect-square rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)]",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, var(--color-primary) ${intensity * 100}%, var(--color-surface-sunken))`,
      }}
      {...props}
    />
  );
}

export interface PerformanceCardProps extends DivProps {
  readonly title: ReactNode;
  readonly metric: ReactNode;
  readonly chart?: ReactNode;
  readonly period?: ReactNode;
}

export function PerformanceCard({
  title,
  metric,
  chart,
  period,
  className,
  ...props
}: PerformanceCardProps) {
  return (
    <Card variant="elevated" className={className} {...props}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{title}</CardTitle>
          {period && <CardDescription>{period}</CardDescription>}
        </div>
        <p className="text-[length:var(--text-h2)] font-semibold">{metric}</p>
      </CardHeader>
      {chart && <CardContent>{chart}</CardContent>}
    </Card>
  );
}

export interface TrendCardProps extends DivProps {
  readonly title: ReactNode;
  readonly trend: ReactNode;
  readonly chart?: ReactNode;
}

export function TrendCard({ title, trend, chart, className, ...props }: TrendCardProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <div className="text-[length:var(--text-h4)] font-semibold">{trend}</div>
      </CardHeader>
      {chart && <CardContent>{chart}</CardContent>}
    </Card>
  );
}

export interface LeaderboardProps extends DivProps {
  readonly title?: ReactNode;
  readonly rows: readonly ReactNode[];
}

export function Leaderboard({ title, rows, className, ...props }: LeaderboardProps) {
  return (
    <Card className={className} {...props}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ol className="space-y-2">{rows.map((row, i) => <li key={i}>{row}</li>)}</ol>
      </CardContent>
    </Card>
  );
}

export interface LeaderboardRowProps extends HTMLAttributes<HTMLDivElement> {
  readonly rank: number;
  readonly primary: ReactNode;
  readonly secondary?: ReactNode;
  readonly value: ReactNode;
}

export function LeaderboardRow({
  rank,
  primary,
  secondary,
  value,
  className,
  ...props
}: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2 motion-hover hover:bg-[var(--color-hover)]",
        className,
      )}
      {...props}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] text-[length:var(--text-caption)] font-semibold">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[length:var(--text-body-sm)] font-medium">{primary}</p>
        {secondary && (
          <p className="truncate text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
            {secondary}
          </p>
        )}
      </div>
      <span className="shrink-0 text-[length:var(--text-body-sm)] font-semibold">{value}</span>
    </div>
  );
}

export interface RecentActivityProps extends DivProps {
  readonly title?: ReactNode;
  readonly activities: readonly ReactNode[];
  readonly footer?: ReactNode;
}

export function RecentActivity({
  title,
  activities,
  footer,
  className,
  ...props
}: RecentActivityProps) {
  return (
    <Card className={className} {...props}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">{activities}</div>
      </CardContent>
      {footer && <CardContent className="border-t border-[var(--color-border-subtle)] pt-4">{footer}</CardContent>}
    </Card>
  );
}
