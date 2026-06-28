import type { LucideIcon } from "lucide-react";

import { createVariants } from "@/components/ui/shared";
import { cn } from "@/utils";

const iconSizes = createVariants("", {
  size: {
    xs: "size-3",
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
    xl: "size-8",
  },
  tone: {
    default: "text-[var(--color-foreground)]",
    muted: "text-[var(--color-muted-foreground)]",
    primary: "text-[var(--color-primary)]",
    accent: "text-[var(--color-accent)]",
    success: "text-[var(--color-success)]",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-danger)]",
    info: "text-[var(--color-info)]",
  },
});

export interface IconProps {
  readonly icon: LucideIcon;
  readonly size?: "xs" | "sm" | "md" | "lg" | "xl";
  readonly tone?: "default" | "muted" | "primary" | "accent" | "success" | "warning" | "danger" | "info";
  readonly className?: string;
  readonly label?: string;
}

export function Icon({
  icon: IconComponent,
  size = "md",
  tone = "default",
  className,
  label,
}: IconProps) {
  return (
    <IconComponent
      className={cn(iconSizes({ size, tone }), "shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}

export type { LucideIcon };
