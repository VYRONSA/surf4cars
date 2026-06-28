import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Icon } from "@/components/ui/icons";
import { Loader2 } from "@/components/ui/icons/registry";
import {
  createVariants,
  disabledStyles,
  focusRing,
  type Size,
  type Variant,
} from "@/components/ui/shared";
import { cn } from "@/utils";

const buttonStyles = createVariants(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap motion-button focus-visible:outline-none",
  {
    variant: {
      primary:
        "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] shadow-sm",
      secondary:
        "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)] active:bg-[var(--color-secondary-active)] shadow-sm",
      ghost:
        "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-hover)] active:bg-[var(--color-active)]",
      outline:
        "border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-hover)] active:bg-[var(--color-active)]",
      text: "bg-transparent text-[var(--color-foreground)] hover:text-[var(--color-primary)] px-0",
      danger:
        "bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:bg-[var(--color-danger-hover)] shadow-sm",
      success:
        "bg-[var(--color-success)] text-[var(--color-success-foreground)] hover:bg-[var(--color-success-hover)] shadow-sm",
    },
    size: {
      sm: "h-8 px-3 text-[length:var(--text-body-sm)] rounded-[var(--radius-md)]",
      md: "h-10 px-4 text-[length:var(--text-button)] rounded-[var(--radius-lg)]",
      lg: "h-12 px-6 text-[length:var(--text-body-md)] rounded-[var(--radius-lg)]",
      xl: "h-14 px-8 text-[length:var(--text-body-lg)] rounded-[var(--radius-xl)]",
      icon: "size-10 rounded-[var(--radius-lg)] p-0",
      "icon-sm": "size-8 rounded-[var(--radius-md)] p-0",
      "icon-lg": "size-12 rounded-[var(--radius-lg)] p-0",
    },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
  readonly size?: Size | "icon" | "icon-sm" | "icon-lg";
  readonly loading?: boolean;
  readonly leftIcon?: ReactNode;
  readonly rightIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled ?? loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        buttonStyles({ variant, size }),
        focusRing,
        disabledStyles,
        className,
      )}
      {...props}
    >
      {loading ? (
        <Icon icon={Loader2} size="sm" className="animate-spin-sfc" label="Loading" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
