"use client";

import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { Icon } from "@/components/ui/icons";
import { Search } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

export interface DropdownMenuProps {
  readonly trigger: ReactNode;
  readonly items: readonly {
    readonly id: string;
    readonly label: ReactNode;
    readonly icon?: ReactNode;
    readonly onSelect?: () => void;
    readonly disabled?: boolean;
    readonly destructive?: boolean;
  }[];
  readonly align?: "start" | "end";
  readonly className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <div onClick={() => setOpen((p) => !p)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-2 min-w-48 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 shadow-[var(--shadow-floating)] animate-slide-up-sfc",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-[length:var(--text-body-sm)] motion-hover hover:bg-[var(--color-hover)] disabled:opacity-40",
                item.destructive && "text-[var(--color-danger)]",
              )}
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

export interface ContextMenuProps extends HTMLAttributes<HTMLDivElement> {
  readonly items: DropdownMenuProps["items"];
  readonly children: ReactNode;
}

export function ContextMenu({ items, children, className, ...props }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <div
      className={className}
      onContextMenu={(e) => {
        e.preventDefault();
        setPosition({ x: e.clientX, y: e.clientY });
        setOpen(true);
      }}
      {...props}
    >
      {children}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            style={{ top: position.y, left: position.x }}
            className="fixed z-50 min-w-44 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 shadow-[var(--shadow-floating)]"
          >
            {items.map((item) => (
              <button
                key={item.id}
                role="menuitem"
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[length:var(--text-body-sm)] motion-hover hover:bg-[var(--color-hover)]"
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
        </>
      )}
    </div>
  );
}

export interface CommandMenuItem {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  readonly onSelect?: () => void;
}

export interface CommandMenuProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly items: readonly CommandMenuItem[];
  readonly placeholder?: string;
}

export function CommandMenu({
  open,
  onClose,
  items,
  placeholder = "Search commands…",
}: CommandMenuProps) {
  const [query, setQuery] = useState("");

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="glass-overlay fixed inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Command menu"
        className="glass-dialog relative z-10 w-full max-w-lg overflow-hidden animate-slide-up-sfc"
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4">
          <Icon icon={Search} size="sm" tone="muted" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-12 w-full bg-transparent text-[length:var(--text-body-md)] outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center rounded-[var(--radius-md)] px-3 py-2 text-left text-[length:var(--text-body-sm)] motion-hover hover:bg-[var(--color-hover)]"
              onClick={() => {
                item.onSelect?.();
                onClose();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface QuickSearchProps extends HTMLAttributes<HTMLButtonElement> {
  readonly placeholder?: string;
  readonly onActivate?: () => void;
}

export function QuickSearch({
  placeholder = "Quick search…",
  onActivate,
  className,
  ...props
}: QuickSearchProps) {
  return (
    <button
      type="button"
      onClick={onActivate}
      className={cn(
        "flex h-10 w-full max-w-sm items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-left text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] motion-hover hover:border-[var(--color-border-strong)]",
        className,
      )}
      {...props}
    >
      <Icon icon={Search} size="sm" tone="muted" />
      <span>{placeholder}</span>
      <kbd className="ml-auto hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] px-1.5 py-0.5 text-[length:var(--text-caption)] sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
