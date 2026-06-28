import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button/button";
import { cn } from "@/utils";

export interface SplitButtonProps {
  readonly primaryLabel: ReactNode;
  readonly onPrimaryClick?: () => void;
  readonly menuItems: readonly {
    readonly id: string;
    readonly label: string;
    readonly onSelect?: () => void;
  }[];
  readonly variant?: ButtonProps["variant"];
  readonly size?: ButtonProps["size"];
  readonly className?: string;
  readonly disabled?: boolean;
}

export function SplitButton({
  primaryLabel,
  onPrimaryClick,
  menuItems,
  variant = "primary",
  size = "md",
  className,
  disabled,
}: SplitButtonProps) {
  return (
    <div
      className={cn(
        "inline-flex overflow-hidden rounded-[var(--radius-lg)] shadow-sm",
        className,
      )}
    >
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        className="rounded-none rounded-l-[var(--radius-lg)]"
        onClick={onPrimaryClick}
      >
        {primaryLabel}
      </Button>
      <details className="relative group">
        <summary
          className="flex h-10 list-none cursor-pointer items-center border-l border-white/10 bg-[var(--color-primary)] px-2 text-[var(--color-primary-foreground)] motion-button hover:bg-[var(--color-primary-hover)] [&::-webkit-details-marker]:hidden"
          aria-label="More actions"
        >
          ▾
        </summary>
        <div className="absolute right-0 top-full z-50 mt-1 min-w-40 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 shadow-[var(--shadow-floating)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="block w-full px-3 py-2 text-left text-[length:var(--text-body-sm)] motion-hover hover:bg-[var(--color-hover)]"
              onClick={item.onSelect}
            >
              {item.label}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
