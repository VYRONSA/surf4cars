"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { PortalId } from "@/config/architecture";

export type ShellPortal = PortalId | "public";

export interface ShellContextValue {
  readonly portal: ShellPortal;
  readonly sidebarCollapsed: boolean;
  readonly mobileSidebarOpen: boolean;
  readonly commandPaletteOpen: boolean;
  readonly globalSearchOpen: boolean;
  readonly toggleSidebar: () => void;
  readonly setSidebarCollapsed: (collapsed: boolean) => void;
  readonly setMobileSidebarOpen: (open: boolean) => void;
  readonly toggleCommandPalette: () => void;
  readonly setCommandPaletteOpen: (open: boolean) => void;
  readonly setGlobalSearchOpen: (open: boolean) => void;
  readonly showSidebar: boolean;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export interface ShellProviderProps {
  readonly portal: ShellPortal;
  readonly showSidebar?: boolean;
  readonly children: ReactNode;
}

export function ShellProvider({
  portal,
  showSidebar = true,
  children,
}: ShellProviderProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setGlobalSearchOpen(false);
        setMobileSidebarOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const value = useMemo<ShellContextValue>(
    () => ({
      portal,
      sidebarCollapsed,
      mobileSidebarOpen,
      commandPaletteOpen,
      globalSearchOpen,
      toggleSidebar,
      setSidebarCollapsed,
      setMobileSidebarOpen,
      toggleCommandPalette,
      setCommandPaletteOpen,
      setGlobalSearchOpen,
      showSidebar,
    }),
    [
      portal,
      sidebarCollapsed,
      mobileSidebarOpen,
      commandPaletteOpen,
      globalSearchOpen,
      toggleSidebar,
      toggleCommandPalette,
      showSidebar,
    ],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error("useShell must be used within ShellProvider");
  }
  return context;
}

export function useShellOptional(): ShellContextValue | null {
  return useContext(ShellContext);
}
