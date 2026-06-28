import type { HTMLAttributes, ReactNode } from "react";

import { createVariants, type CardBaseProps } from "@/components/ui/shared";
import { cn } from "@/utils";

const cardStyles = createVariants(
  "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]",
  {
    variant: {
      default: "shadow-[var(--shadow-sm)]",
      elevated: "shadow-[var(--shadow-md)]",
      floating: "shadow-[var(--shadow-floating)]",
      glass: "glass-card border-[var(--color-glass-border)] bg-transparent",
      flat: "shadow-none",
    },
    padding: {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    interactive: {
      true: "motion-card cursor-pointer hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-hover)]",
      false: "",
    },
  },
);

export interface CardProps extends CardBaseProps {
  readonly variant?: "default" | "elevated" | "floating" | "glass" | "flat";
  readonly padding?: "none" | "sm" | "md" | "lg";
  readonly interactive?: boolean;
}

export function Card({
  variant = "default",
  padding = "md",
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(cardStyles({ variant, padding, interactive: interactive ? "true" : "false" }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[length:var(--text-h5)] font-semibold leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2 pt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardSlotProps extends CardProps {
  readonly media?: ReactNode;
  readonly actions?: ReactNode;
}
