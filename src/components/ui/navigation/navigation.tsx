import type { HTMLAttributes, ReactNode } from "react";

import { type DivProps } from "@/components/ui/shared";
import { cn } from "@/utils";

export interface TopNavProps extends HTMLAttributes<HTMLElement> {
  readonly logo?: ReactNode;
  readonly navigation?: ReactNode;
  readonly actions?: ReactNode;
  readonly glass?: boolean;
}

export function TopNav({
  logo,
  navigation,
  actions,
  glass = true,
  className,
  children,
  ...props
}: TopNavProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between gap-4 px-4 lg:px-6",
        glass ? "glass-header" : "border-b border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-6">
        {logo}
        {navigation}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
      {children}
    </header>
  );
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  readonly glass?: boolean;
  readonly collapsed?: boolean;
}

export function Sidebar({
  header,
  footer,
  glass = true,
  collapsed = false,
  className,
  children,
  ...props
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col",
        collapsed ? "w-16" : "w-64",
        glass ? "glass-sidebar" : "border-r border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
      {...props}
    >
      {header && (
        <div className="flex h-16 shrink-0 items-center border-b border-[var(--color-border-subtle)] px-4">
          {header}
        </div>
      )}
      <nav className="flex-1 overflow-y-auto p-3 motion-nav" aria-label="Sidebar">
        {children}
      </nav>
      {footer && (
        <div className="shrink-0 border-t border-[var(--color-border-subtle)] p-3">
          {footer}
        </div>
      )}
    </aside>
  );
}

export interface SidebarItemProps extends HTMLAttributes<HTMLAnchorElement> {
  readonly active?: boolean;
  readonly icon?: ReactNode;
  readonly label: ReactNode;
  readonly href?: string;
}

export function SidebarItem({
  active,
  icon,
  label,
  href = "#",
  className,
  ...props
}: SidebarItemProps) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2 text-[length:var(--text-body-sm)] font-medium motion-nav",
        active
          ? "bg-[var(--color-primary-muted)] text-[var(--color-primary-text)]"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-hover)] hover:text-[var(--color-foreground)]",
        className,
      )}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

export interface BreadcrumbItem {
  readonly label: ReactNode;
  readonly href?: string;
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  readonly items: readonly BreadcrumbItem[];
}

export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className} {...props}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[length:var(--text-body-sm)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-[var(--color-muted)]" aria-hidden>
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className="font-medium text-[var(--color-foreground)]"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="text-[var(--color-muted-foreground)] motion-hover hover:text-[var(--color-foreground)]"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface TabItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly disabled?: boolean;
}

export interface TabsProps extends DivProps {
  readonly items: readonly TabItem[];
  readonly activeId: string;
  readonly onTabChange?: (id: string) => void;
}

export function Tabs({ items, activeId, onTabChange, className, children, ...props }: TabsProps) {
  return (
    <div className={className} {...props}>
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]"
      >
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={activeId === item.id}
            disabled={item.disabled}
            className={cn(
              "relative px-4 py-2.5 text-[length:var(--text-body-sm)] font-medium motion-nav whitespace-nowrap",
              activeId === item.id
                ? "text-[var(--color-foreground)] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[var(--color-primary)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
              item.disabled && "opacity-40 cursor-not-allowed",
            )}
            onClick={() => onTabChange?.(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {children}
      </div>
    </div>
  );
}
