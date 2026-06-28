"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icons";
import { ChevronRight } from "@/components/ui/icons/registry";
import { useShell } from "@/components/shell/context";
import {
  getShellIcon,
  SHELL_NAV_BY_PORTAL,
  type ShellNavGroup,
  type ShellNavItem,
} from "@/components/shell/navigation";
import { cn } from "@/utils";

export function AppSidebar() {
  const { portal, sidebarCollapsed, showSidebar } = useShell();
  const groups = SHELL_NAV_BY_PORTAL[portal] ?? [];

  if (!showSidebar) return null;

  return (
    <aside
      className={cn(
        "glass-sidebar hidden h-full shrink-0 flex-col transition-[width] duration-[var(--duration-normal)] ease-[var(--ease-premium)] lg:flex",
        sidebarCollapsed ? "w-[4.5rem]" : "w-64",
      )}
      aria-label="Main navigation"
    >
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        {groups.map((group) => (
          <SidebarNavGroup
            key={group.id}
            group={group}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>
    </aside>
  );
}

export function MobileSidebarDrawer() {
  const { mobileSidebarOpen, setMobileSidebarOpen, portal, showSidebar } = useShell();
  const groups = SHELL_NAV_BY_PORTAL[portal] ?? [];

  if (!showSidebar || !mobileSidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <div
        className="glass-overlay absolute inset-0"
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden
      />
      <aside
        className="glass-sidebar absolute inset-y-0 left-0 flex w-72 flex-col motion-drawer animate-slide-up-sfc"
        aria-label="Mobile navigation"
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--color-border-subtle)] px-4">
          <span className="text-[length:var(--text-body-sm)] font-semibold">Navigation</span>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-[var(--radius-md)] p-2 motion-hover hover:bg-[var(--color-hover)]"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {groups.map((group) => (
            <SidebarNavGroup
              key={group.id}
              group={group}
              collapsed={false}
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          ))}
        </nav>
      </aside>
    </div>
  );
}

function SidebarNavGroup({
  group,
  collapsed,
  onNavigate,
}: {
  readonly group: ShellNavGroup;
  readonly collapsed: boolean;
  readonly onNavigate?: () => void;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="mb-2 px-3 text-[length:var(--text-overline)] font-medium uppercase tracking-[var(--tracking-overline)] text-[var(--color-muted-foreground)]">
          {group.label}
        </p>
      )}
      <ul className="space-y-0.5" role="list">
        {group.items.map((item) => (
          <li key={item.id}>
            <SidebarNavItem
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarNavItem({
  item,
  collapsed,
  onNavigate,
}: {
  readonly item: ShellNavItem;
  readonly collapsed: boolean;
  readonly onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const IconComponent = getShellIcon(item.icon);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2 text-[length:var(--text-body-sm)] font-medium motion-nav",
        active
          ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-hover)] hover:text-[var(--color-foreground)]",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon icon={IconComponent} size="sm" tone={active ? "primary" : "muted"} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 text-[length:var(--text-caption)]">
              {item.badge}
            </span>
          )}
          <Icon
            icon={ChevronRight}
            size="xs"
            className="opacity-0 motion-nav group-hover:opacity-100"
          />
        </>
      )}
    </Link>
  );
}
