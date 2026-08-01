"use client";

import type { ReactNode } from "react";

import { AppHeader } from "@/components/shell/header/app-header";
import { CommandPalette } from "@/components/shell/command-palette/command-palette";
import { ShellProvider, type ShellPortal } from "@/components/shell/context";
import {
  GlobalSearchDialog,
} from "@/components/shell/global-search/global-search";
import {
  AppSidebar,
  MobileSidebarDrawer,
} from "@/components/shell/sidebar/app-sidebar";
import { cn } from "@/utils";

export interface AppShellProps {
  readonly portal: ShellPortal;
  readonly showSidebar?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}

export function AppShell({
  portal,
  showSidebar = portal !== "public",
  children,
  className,
}: AppShellProps) {
  return (
    <ShellProvider portal={portal} showSidebar={showSidebar}>
      {/* Unfilled on purpose — the base colour and the page wash both come from `body`. Repainting the
          background here made this an opaque pane over the wash. See public-layout.tsx for the detail. */}
      <div className={cn("flex min-h-dvh flex-col", className)}>
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <MobileSidebarDrawer />
          <main
            id="main-content"
            className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
      <GlobalSearchDialog />
    </ShellProvider>
  );
}
