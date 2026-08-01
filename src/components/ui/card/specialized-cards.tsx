import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
} from "@/components/ui/card/card";
import { cn } from "@/utils";

export interface VehicleCardProps extends CardProps {
  readonly imageSlot?: ReactNode;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly specs?: ReactNode;
  readonly price?: ReactNode;
  readonly badge?: ReactNode;
  readonly footer?: ReactNode;
}

export function VehicleCard({
  imageSlot,
  title,
  subtitle,
  specs,
  price,
  badge,
  footer,
  className,
  ...props
}: VehicleCardProps) {
  return (
    <Card interactive padding="none" className={cn("overflow-hidden", className)} {...props}>
      {imageSlot && (
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-sunken)]">
          {imageSlot}
          {badge && <div className="absolute left-3 top-3">{badge}</div>}
        </div>
      )}
      <div className="p-4">
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        {specs && <CardContent className="pb-2">{specs}</CardContent>}
        {price && (
          <p className="text-[length:var(--text-h5)] font-semibold tracking-[var(--tracking-heading)]">
            {price}
          </p>
        )}
        {footer && <CardFooter className="pt-3">{footer}</CardFooter>}
      </div>
    </Card>
  );
}

export interface DealerCardProps extends CardProps {
  readonly logo?: ReactNode;
  readonly name: ReactNode;
  readonly location?: ReactNode;
  readonly stats?: ReactNode;
  readonly verified?: ReactNode;
  readonly footer?: ReactNode;
}

export function DealerCard({
  logo,
  name,
  location,
  stats,
  verified,
  footer,
  className,
  ...props
}: DealerCardProps) {
  return (
    <Card interactive className={className} {...props}>
      <CardHeader>
        <div className="flex items-start gap-3">
          {logo && (
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)]">
              {logo}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>{name}</CardTitle>
              {verified}
            </div>
            {location && <CardDescription>{location}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      {stats && <CardContent>{stats}</CardContent>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

export interface MetricCardProps extends CardProps {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly change?: ReactNode;
  readonly icon?: ReactNode;
}

export function MetricCard({
  label,
  value,
  change,
  icon,
  className,
  ...props
}: MetricCardProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
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
      </CardContent>
    </Card>
  );
}

export interface StatisticCardProps extends CardProps {
  readonly title: ReactNode;
  readonly statistic: ReactNode;
  readonly description?: ReactNode;
  readonly trend?: ReactNode;
}

export function StatisticCard({
  title,
  statistic,
  description,
  trend,
  className,
  ...props
}: StatisticCardProps) {
  return (
    <Card variant="elevated" className={className} {...props}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-[length:var(--text-h2)]">{statistic}</CardTitle>
      </CardHeader>
      {(description ?? trend) && (
        <CardFooter className="justify-between pt-0">
          {description && (
            <CardDescription className="pt-0">{description}</CardDescription>
          )}
          {trend}
        </CardFooter>
      )}
    </Card>
  );
}

export interface InsightCardProps extends CardProps {
  readonly title: ReactNode;
  readonly insight: ReactNode;
  readonly source?: ReactNode;
}

export function InsightCard({
  title,
  insight,
  source,
  className,
  ...props
}: InsightCardProps) {
  return (
    <Card variant="glass" className={className} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[length:var(--text-body-md)] leading-[var(--leading-relaxed)]">
          {insight}
        </p>
      </CardContent>
      {source && (
        <CardFooter>
          <CardDescription>{source}</CardDescription>
        </CardFooter>
      )}
    </Card>
  );
}

export interface RecommendationCardProps extends CardProps {
  readonly title: ReactNode;
  readonly recommendation: ReactNode;
  readonly actions?: ReactNode;
}

export function RecommendationCard({
  title,
  recommendation,
  actions,
  className,
  ...props
}: RecommendationCardProps) {
  return (
    <Card interactive className={className} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{recommendation}</CardDescription>
      </CardHeader>
      {actions && <CardFooter>{actions}</CardFooter>}
    </Card>
  );
}

export interface ActionCardProps extends CardProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action: ReactNode;
  readonly icon?: ReactNode;
}

export function ActionCard({
  title,
  description,
  action,
  icon,
  className,
  ...props
}: ActionCardProps) {
  return (
    <Card interactive className={className} {...props}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardFooter>{action}</CardFooter>
    </Card>
  );
}

export interface EmptyStateCardProps extends CardProps {
  readonly icon?: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
}

export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateCardProps) {
  return (
    <Card variant="flat" className={cn("border-dashed text-center", className)} {...props}>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        {icon && (
          <div className="flex size-12 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-surface-sunken)] text-[var(--color-muted-foreground)]">
            {icon}
          </div>
        )}
        <div>
          <CardTitle className="mb-1">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export interface FeatureCardProps extends CardProps {
  readonly icon?: ReactNode;
  readonly title: ReactNode;
  readonly description: ReactNode;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
  ...props
}: FeatureCardProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        {icon && <div className="mb-2 text-[var(--color-primary-text)]">{icon}</div>}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export interface MarketingCardProps extends CardProps {
  readonly media?: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly metrics?: ReactNode;
  readonly footer?: ReactNode;
}

export function MarketingCard({
  media,
  title,
  description,
  metrics,
  footer,
  className,
  ...props
}: MarketingCardProps) {
  return (
    <Card padding="none" className={cn("overflow-hidden", className)} {...props}>
      {media && (
        <div className="aspect-[21/9] overflow-hidden bg-[var(--color-surface-sunken)]">
          {media}
        </div>
      )}
      <div className="p-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        {metrics && <CardContent>{metrics}</CardContent>}
        {footer && <CardFooter>{footer}</CardFooter>}
      </div>
    </Card>
  );
}
