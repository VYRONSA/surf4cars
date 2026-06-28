"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button/button";
import { Icon } from "@/components/ui/icons";
import { ChevronDown } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

export interface DropdownButtonProps extends Omit<ButtonProps, "rightIcon"> {
  readonly menuItems: readonly {
    readonly id: string;
    readonly label: string;
    readonly icon?: ReactNode;
    readonly onSelect?: () => void;
    readonly disabled?: boolean;
  }[];
}

export function DropdownButton({
  menuItems,
  children,
  className,
  ...props
}: DropdownButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative inline-flex", className)}>
      <Button
        {...props}
        aria-haspopup="menu"
        aria-expanded={open}
        rightIcon={<Icon icon={ChevronDown} size="sm" />}
        onClick={(e) => {
          props.onClick?.(e);
          setOpen((prev) => !prev);
        }}
      >
        {children}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-48 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 shadow-[var(--shadow-floating)] animate-slide-up-sfc"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[length:var(--text-body-sm)] text-[var(--color-foreground)] motion-hover hover:bg-[var(--color-hover)] disabled:opacity-40"
              onClick={() => {
                item.onSelect?.();
                setOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
