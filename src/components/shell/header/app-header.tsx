"use client";

import { SurfLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import {
  Bell,
  ChevronDown,
  Command,
  MessageSquare,
  PanelLeft,
  Plus,
  User,
} from "@/components/ui/icons/registry";
import { DropdownMenu } from "@/components/ui/navigation";
import { useShell } from "@/components/shell/context";
import { GlobalSearchTrigger } from "@/components/shell/global-search";
import { cn } from "@/utils";

export interface AppHeaderProps {
  readonly className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const {
    toggleSidebar,
    toggleCommandPalette,
    setMobileSidebarOpen,
    showSidebar,
    portal,
  } = useShell();

  return (
    <header
      className={cn(
        "glass-header sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 px-4 lg:h-16 lg:gap-4 lg:px-6",
        className,
      )}
    >
      {showSidebar && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Icon icon={PanelLeft} size="sm" />
        </Button>
      )}

      {showSidebar && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden lg:inline-flex"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Icon icon={PanelLeft} size="sm" />
        </Button>
      )}

      <div className="flex min-w-0 items-center gap-2">
        <SurfLogo variant="shell" />
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-[length:var(--text-caption)] capitalize text-[var(--color-muted-foreground)]">
            {portal === "public" ? "Marketplace" : `${portal} portal`}
          </p>
        </div>
      </div>

      <div className="mx-auto hidden w-full max-w-md md:block lg:max-w-lg">
        <GlobalSearchTrigger />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={toggleCommandPalette}
          aria-label="Open search"
        >
          <Icon icon={Command} size="sm" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="hidden lg:inline-flex"
          disabled
          aria-label="Workspace selector"
        >
          Workspace
          <Icon icon={ChevronDown} size="xs" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          disabled
          aria-label="Quick actions"
        >
          <Icon icon={Plus} size="sm" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCommandPalette}
          aria-label="Open command palette"
          aria-keyshortcuts="Control+K"
        >
          <Icon icon={Command} size="sm" />
        </Button>

        <Button variant="ghost" size="icon-sm" disabled aria-label="Notifications">
          <Icon icon={Bell} size="sm" />
        </Button>

        <Button variant="ghost" size="icon-sm" disabled aria-label="Messages">
          <Icon icon={MessageSquare} size="sm" />
        </Button>

        <DropdownMenu
          trigger={
            <Button variant="ghost" size="icon-sm" aria-label="Profile menu">
              <Icon icon={User} size="sm" />
            </Button>
          }
          items={[
            { id: "profile", label: "Profile", disabled: true },
            { id: "settings", label: "Settings", disabled: true },
            { id: "sign-out", label: "Sign out", disabled: true },
          ]}
        />
      </div>
    </header>
  );
}
