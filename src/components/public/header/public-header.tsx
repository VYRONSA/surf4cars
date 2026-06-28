"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SurfLogoLink } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import {
  Bell,
  Heart,
  Menu,
  Search,
  X,
} from "@/components/ui/icons/registry";
import { NAVIGATION_BY_USER_TYPE } from "@/config/architecture";
import { cn } from "@/utils";

const publicNav = NAVIGATION_BY_USER_TYPE["public-visitor"];

export interface PublicHeaderProps {
  readonly className?: string;
}

export function PublicHeader({ className }: PublicHeaderProps) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const mobileOpen = menuPath === pathname;

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 8);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const openMobileMenu = () => setMenuPath(pathname);
  const closeMobileMenu = () => setMenuPath(null);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b motion-nav",
          scrolled
            ? "glass-header border-[var(--color-border-subtle)] shadow-[var(--shadow-sm)]"
            : "border-[var(--color-border-subtle)]/50 bg-[var(--color-background)]/88 backdrop-blur-xl",
          className,
        )}
        role="banner"
      >
        <div className="mx-auto flex h-[4.75rem] max-w-[var(--container-2xl)] items-center gap-6 px-4 sm:px-5 lg:h-[5.5rem] lg:gap-6 lg:px-8">
          <SurfLogoLink variant="header" priority className="shrink-0 px-2" />

          <button
            type="button"
            disabled
            aria-label="Vehicle search"
            className="hidden h-11 min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 px-4 text-left text-[length:var(--text-body-sm)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-strong)] md:flex lg:max-w-md xl:max-w-xl"
          >
            <Icon icon={Search} size="sm" tone="muted" aria-hidden />
            <span className="truncate">Search vehicles, brands, or describe what you want…</span>
          </button>

          <nav
            className="hidden shrink-0 items-center lg:flex"
            aria-label="Primary navigation"
          >
            <ul className="flex items-center gap-3">
              {publicNav.primary.map((item) => {
                const active = pathname === item.path;

                return (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex h-10 items-center rounded-[var(--radius-lg)] px-3.5",
                        "text-[length:var(--text-body-sm)] font-medium motion-nav",
                        active
                          ? "text-[var(--color-foreground)]"
                          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled
              aria-label="Saved vehicles"
              className="hidden sm:inline-flex"
            >
              <Icon icon={Heart} size="sm" tone="muted" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              disabled
              aria-label="Notifications"
              className="hidden md:inline-flex"
            >
              <Icon icon={Bell} size="sm" tone="muted" />
            </Button>

            <Button variant="ghost" size="sm" disabled className="hidden h-10 lg:inline-flex">
              Buyer Login
            </Button>

            <Button variant="outline" size="sm" disabled className="hidden h-10 md:inline-flex">
              Dealer Login
            </Button>

            <Button variant="primary" size="sm" disabled className="hidden h-10 sm:inline-flex">
              Dealer Registration
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="public-mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => (mobileOpen ? closeMobileMenu() : openMobileMenu())}
            >
              <Icon icon={mobileOpen ? X : Menu} size="sm" />
            </Button>
          </div>
        </div>
      </header>

      <PublicMobileMenu open={mobileOpen} onClose={closeMobileMenu} />
    </>
  );
}

interface PublicMobileMenuProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

function PublicMobileMenu({ open, onClose }: PublicMobileMenuProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div
      id="public-mobile-menu"
      className="fixed inset-0 z-40 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 motion-nav"
        aria-label="Close menu"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] motion-nav">
        <div className="flex h-[4.5rem] items-center justify-between border-b border-[var(--color-border-subtle)] px-4">
          <SurfLogoLink variant="header" />
          <Button variant="ghost" size="icon-sm" aria-label="Close menu" onClick={onClose}>
            <Icon icon={X} size="sm" />
          </Button>
        </div>

        <button
          type="button"
          disabled
          className="mx-4 mt-4 flex h-11 items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 text-left text-[length:var(--text-body-sm)] text-[var(--color-muted)]"
        >
          <Icon icon={Search} size="sm" tone="muted" aria-hidden />
          Search vehicles…
        </button>

        <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile navigation">
          <ul className="space-y-0.5">
            {publicNav.mobile.map((item) => {
              const active = pathname === item.path;

              return (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center rounded-[var(--radius-lg)] px-3 text-[length:var(--text-body-md)] font-medium motion-nav",
                      active
                        ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                        : "text-[var(--color-foreground)] hover:bg-[var(--color-hover)]",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-2 border-t border-[var(--color-border-subtle)] p-4">
          <Button variant="outline" size="md" disabled className="h-11 w-full">
            Buyer Login
          </Button>
          <Button variant="outline" size="md" disabled className="h-11 w-full">
            Dealer Login
          </Button>
          <Button variant="primary" size="md" disabled className="h-11 w-full">
            Dealer Registration
          </Button>
        </div>
      </div>
    </div>
  );
}
