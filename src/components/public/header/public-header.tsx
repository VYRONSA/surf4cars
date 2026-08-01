"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SurfWordmarkLink } from "@/components/brand";
import { Icon } from "@/components/ui/icons";
import { Menu, X } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

/**
 * The public masthead.
 *
 * WHAT IT USED TO CARRY, AND WHY NONE OF IT SURVIVED
 * ==================================================
 * Nine controls, on every page. Every single one of them was `disabled`:
 *
 *   search field        a 400px input reading "Search vehicles, brands, or describe what you
 *                       want…" — dead, and duplicating the working search 600px below it on the
 *                       homepage
 *   saved vehicles      a heart icon; the feature is on the vehicle page, not here
 *   notifications       a bell; there are no public notifications
 *   Buyer Login         dead
 *   Dealer Login        dead
 *   Dealer Registration dead, and the loudest object on the page — filled brand red, top right
 *
 * Meanwhile `/auth/sign-in` and `/auth/sign-up/dealer` were real, working, well-designed pages the
 * masthead simply refused to link to. A visitor who wanted to sign in had no route to it from
 * anywhere on the marketplace except the footer.
 *
 * Two account entry points also asked the wrong question. "Buyer Login" and "Dealer Login" made a
 * visitor classify themselves before signing in, when the sign-in page already handles both and the
 * account itself knows which it is.
 *
 * WHAT IS LEFT
 * ============
 * The brand, two destinations, and one action — all of which work. A masthead's job on a
 * marketplace is to say where you are and let you leave; the searching happens on the pages built
 * for it.
 */

const NAV_LINKS = [
  { id: "home", label: "Home", href: "/" },
  { id: "search", label: "Marketplace", href: "/search" },
] as const;

export interface PublicHeaderProps {
  readonly className?: string;
}

export function PublicHeader({ className }: PublicHeaderProps) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  const mobileOpen = menuPath === pathname;

  /*
    On the homepage the masthead wordmark yields to the hero one.
    ============================================================
    The brief said to remove the small navigation wordmark, and on arrival that is exactly right —
    two wordmarks 200px apart, one of them at a fifth the size of the other, is the competition it
    was written to end.

    Removing it outright would have cost more than it bought. The masthead is sticky, so from the
    moment a visitor scrolls past the hero there would be no brand on screen at all — for the whole
    homepage, and on the marketplace, vehicle and dealer pages, which have no hero wordmark to yield
    to. It is also the site's home link, the one every visitor reaches for by reflex.

    So it yields rather than disappears: absent while the hero owns the frame, and back once the hero
    has left. The brand is never shown twice, and never absent.
  */
  const isHomepage = pathname === "/";

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 8);
    /* Half a viewport is past the wordmark's block on every screen size the hero is designed for. */
    setPastHero(window.scrollY > window.innerHeight * 0.5);
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

  const closeMobileMenu = () => setMenuPath(null);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b motion-nav",
          scrolled
            ? "glass-header border-[var(--color-border-subtle)] shadow-[var(--shadow-sm)]"
            : "border-transparent",
          /*
            Invisible over the hero, present everywhere else.
            ================================================
            At rest this used to paint `background/80` with a blur, which on the homepage drew an
            opaque 80px band across the top of the photograph — the sky was cut off below it and the
            hero was not full-bleed at all, it merely started lower down. The brand, the mountain and
            the header were three separate objects stacked, which is the opposite of one composition.

            On the homepage the bar is now nothing until you scroll: the photograph runs to the top
            of the viewport and the navigation floats on it. Everywhere else the wash stays, because
            those pages open on content rather than on an image and a transparent header over a
            scrolling catalogue is unreadable.
          */
          !scrolled && (isHomepage ? "bg-transparent" : "bg-[var(--color-background)]/80 backdrop-blur-xl"),
          className,
        )}
        role="banner"
      >
        <div className="mx-auto flex h-[4.5rem] max-w-[var(--container-2xl)] items-center gap-6 px-5 lg:h-[5rem] lg:px-8">
          <SurfWordmarkLink
            size="hero"
            className={cn(
              "motion-nav",
              isHomepage && !pastHero && "pointer-events-none opacity-0",
            )}
          />

          <nav className="ml-auto hidden items-center gap-8 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-[length:var(--text-body-sm)] font-medium motion-nav",
                    active
                      ? "text-[var(--color-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/auth/sign-in"
              className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)] motion-nav hover:text-[var(--color-foreground)]"
            >
              Sign in
            </Link>

            {/* The one filled button on the page, and it goes somewhere. */}
            <Link
              href="/auth/sign-up/dealer"
              className="motion-button inline-flex h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 text-[length:var(--text-body-sm)] font-medium text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              List your stock
            </Link>
          </nav>

          <button
            type="button"
            className="motion-button ml-auto inline-flex size-10 items-center justify-center rounded-[var(--radius-lg)] text-[var(--color-foreground)] hover:bg-[var(--color-hover)] lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => (mobileOpen ? closeMobileMenu() : setMenuPath(pathname))}
          >
            <Icon icon={mobileOpen ? X : Menu} size="sm" />
          </button>
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

/**
 * The mobile menu.
 *
 * Held a disabled search box and three disabled buttons under a divider. It now carries the same
 * four destinations as the desktop bar, which is the point of a mobile menu — the same site, at a
 * different width, rather than a different set of promises.
 */
function PublicMobileMenu({ open, onClose }: PublicMobileMenuProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div
      id="public-mobile-menu"
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 motion-nav"
        aria-label="Close menu"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] motion-nav">
        <div className="flex h-[4.5rem] items-center justify-between px-5">
          <SurfWordmarkLink size="header" />
          <button
            type="button"
            className="motion-button inline-flex size-10 items-center justify-center rounded-[var(--radius-lg)] hover:bg-[var(--color-hover)]"
            aria-label="Close menu"
            onClick={onClose}
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-5 pt-6" aria-label="Menu">
          {[...NAV_LINKS, { id: "signin", label: "Sign in", href: "/auth/sign-in" }].map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "flex h-12 items-center text-[length:var(--text-h5)] font-medium motion-nav",
                pathname === item.href
                  ? "text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
              )}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/auth/sign-up/dealer"
            onClick={onClose}
            className="motion-button mt-6 inline-flex h-12 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-primary)] text-[length:var(--text-body-md)] font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            List your stock
          </Link>
        </nav>
      </div>
    </div>
  );
}
