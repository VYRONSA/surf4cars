import type { HTMLAttributes, ReactNode } from "react";

import { type DivProps } from "@/components/ui/shared";
import { createVariants } from "@/components/ui/shared";
import { cn } from "@/utils";

const badgeStyles = createVariants(
  "inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[length:var(--text-caption)] font-medium",
  {
    variant: {
      default: "bg-[var(--color-surface-sunken)] text-[var(--color-foreground)]",
      primary: "bg-[var(--color-primary-muted)] text-[var(--color-primary)]",
      success: "bg-[var(--color-success-muted)] text-[var(--color-success)]",
      warning: "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
      danger: "bg-[var(--color-danger-muted)] text-[var(--color-danger)]",
      info: "bg-[var(--color-info-muted)] text-[var(--color-info)]",
      outline: "border border-[var(--color-border)] bg-transparent text-[var(--color-muted-foreground)]",
    },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeStyles({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
  ...props
}: BadgeProps & { readonly status: "success" | "warning" | "danger" | "info" | "default" }) {
  return (
    <Badge variant={status === "default" ? "default" : status} className={className} {...props} />
  );
}

export interface NotificationBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly count?: number;
}

export function NotificationBadge({ count, className, ...props }: NotificationBadgeProps) {
  if (!count) return null;

  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-danger)] px-1.5 py-0.5 text-[length:var(--text-caption)] font-semibold text-white",
        className,
      )}
      aria-label={`${count} notifications`}
      {...props}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

const alertStyles = createVariants(
  "flex gap-3 rounded-[var(--radius-xl)] border p-4 text-[length:var(--text-body-sm)]",
  {
    variant: {
      default: "border-[var(--color-border)] bg-[var(--color-surface-raised)]",
      success: "border-[var(--color-success)]/20 bg-[var(--color-success-muted)] text-[var(--color-success)]",
      warning: "border-[var(--color-warning)]/20 bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
      danger: "border-[var(--color-danger)]/20 bg-[var(--color-danger-muted)] text-[var(--color-danger)]",
      info: "border-[var(--color-info)]/20 bg-[var(--color-info-muted)] text-[var(--color-info)]",
    },
  },
);

export interface AlertProps extends DivProps {
  readonly variant?: "default" | "success" | "warning" | "danger" | "info";
  readonly title?: ReactNode;
  readonly icon?: ReactNode;
}

export function Alert({
  variant = "default",
  title,
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div role="alert" className={cn(alertStyles({ variant }), className)} {...props}>
      {icon}
      <div className="min-w-0 flex-1">
        {title && <p className="mb-1 font-medium">{title}</p>}
        {children && <div className="text-[var(--color-muted-foreground)]">{children}</div>}
      </div>
    </div>
  );
}

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: AlertProps["variant"];
  readonly action?: ReactNode;
}

export function Banner({
  variant = "info",
  action,
  className,
  children,
  ...props
}: BannerProps) {
  return (
    <div
      className={cn(
        alertStyles({ variant }),
        "items-center justify-between rounded-none border-x-0",
        className,
      )}
      {...props}
    >
      <div>{children}</div>
      {action}
    </div>
  );
}

export interface ToastProps extends DivProps {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
}

export function Toast({ title, description, action, className, ...props }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-floating)] animate-slide-up-sfc",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {title && <p className="text-[length:var(--text-body-sm)] font-medium">{title}</p>}
        {description && (
          <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  readonly value?: number;
  readonly max?: number;
  readonly label?: string;
}

export function Progress({
  value = 0,
  max = 100,
  label,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)} {...props}>
      {label && (
        <div className="mb-1.5 flex justify-between text-[length:var(--text-caption)]">
          <span>{label}</span>
          <span className="text-[var(--color-muted-foreground)]">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)]"
      >
        <div
          className="h-full rounded-[var(--radius-pill)] bg-[var(--color-primary)] motion-button"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function Spinner({
  className,
  label = "Loading",
  ...props
}: HTMLAttributes<HTMLDivElement> & { readonly label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "size-5 animate-spin-sfc rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]",
        className,
      )}
      {...props}
    />
  );
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  variant = "rectangular",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse-sfc bg-[var(--color-surface-sunken)]",
        variant === "text" && "h-4 w-full rounded-[var(--radius-sm)]",
        variant === "circular" && "size-10 rounded-[var(--radius-pill)]",
        variant === "rectangular" && "rounded-[var(--radius-lg)]",
        className,
      )}
      {...props}
    />
  );
}

export interface EmptyStateProps extends DivProps {
  readonly icon?: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-[var(--radius-2xl)] bg-[var(--color-surface-sunken)] text-[var(--color-muted-foreground)]">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-[length:var(--text-h5)] font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 max-w-sm text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
