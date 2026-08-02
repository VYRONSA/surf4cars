"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * "How do I get back?"
 *
 * WHY BROWSER HISTORY ALONE IS NOT ENOUGH
 * =======================================
 * `router.back()` is the right behaviour when there is somewhere to go back to, and it is wrong in
 * the two cases that happen most:
 *
 *   a listing opened from a WhatsApp message, an email or a search result — the tab has no history,
 *     and `back()` either does nothing or leaves the site entirely;
 *   a page reached after a redirect, where the previous entry is the page that redirected and going
 *     back lands the visitor straight back where they were.
 *
 * A control that sometimes does nothing is worse than no control, because the visitor cannot tell
 * which kind of page they are on until they have already pressed it.
 *
 * So this uses history when history exists and a stated destination when it does not, and it works
 * out which by asking the browser rather than guessing. `window.history.length` is unreliable across
 * browsers on its own — a fresh tab is not always 1 — so the test is whether a same-origin referrer
 * exists, which is what actually distinguishes "arrived from our own page" from "arrived cold".
 *
 * THE FALLBACK IS A HIERARCHY, NOT A HOMEPAGE LINK
 * ================================================
 * Sending everyone to `/` is the easy fallback and the wrong one: a dealer who opens a vehicle from
 * an email wants the inventory, not the marketplace homepage. `resolveFallback` walks the path up one
 * meaningful level, which is nearly always what "back" means to the person pressing it.
 */

/** One level up, in the terms a visitor thinks in rather than by trimming a path segment. */
export function resolveFallback(pathname: string): { readonly href: string; readonly label: string } {
  const path = pathname.replace(/\/+$/, "") || "/";

  const rules: readonly { readonly test: RegExp; readonly href: string; readonly label: string }[] = [
    { test: /^\/vehicle\//, href: "/search", label: "Back to search" },
    { test: /^\/dealers\/[^/]+/, href: "/search", label: "Back to search" },
    { test: /^\/dealer\/inventory\/(new|import)/, href: "/dealer/inventory", label: "Back to inventory" },
    { test: /^\/dealer\/inventory\/./, href: "/dealer/inventory", label: "Back to inventory" },
    { test: /^\/dealer\/./, href: "/dealer/dashboard", label: "Back to dashboard" },
    { test: /^\/buyer\/./, href: "/buyer", label: "Back to your account" },
    { test: /^\/operations\/./, href: "/operations", label: "Back to operations" },
    { test: /^\/legal\//, href: "/", label: "Back to home" },
    { test: /^\/auth\//, href: "/", label: "Back to home" },
  ];

  for (const rule of rules) {
    if (rule.test.test(path)) return { href: rule.href, label: rule.label };
  }

  return { href: "/", label: "Back to home" };
}

export interface BackButtonProps {
  /** Overrides the derived destination when a page knows better than the path does. */
  readonly fallbackHref?: string;
  readonly label?: string;
  readonly className?: string;
}

export function BackButton({ fallbackHref, label, className }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  const fallback = resolveFallback(pathname ?? "/");
  const href = fallbackHref ?? fallback.href;
  const text = label ?? fallback.label;

  useEffect(() => {
    /* Read after mount, never during render: `document.referrer` and `window.history` do not exist on
       the server, and a value read during render would differ between the server and client markup.
       Deferred to a microtask so the state change is not synchronous within the effect body, which
       is what turns a one-off read into a cascading render. */
    if (typeof window === "undefined") return undefined;
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const referrer = document.referrer;
        const sameOrigin = Boolean(referrer) && new URL(referrer).origin === window.location.origin;
        setCanGoBack(sameOrigin && window.history.length > 1);
      } catch {
        setCanGoBack(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      /* Modified clicks are the visitor asking for a new tab. Let the browser have them, and let the
         href do its job — which is also why this is an anchor and not a button. */
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (!canGoBack) return;
      event.preventDefault();
      router.back();
    },
    [canGoBack, router],
  );

  return (
    <a
      href={href}
      onClick={onClick}
      data-testid="back-button"
      /* An anchor with a real href, so it is keyboard reachable, announced as a link, opens in a new
         tab on a modified click, and still works before hydration. A <button> would have none of
         those and would be inert on a slow connection. */
      className={
        className ??
        "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
      }
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4 shrink-0"
      >
        <path d="M12.5 15.5 7 10l5.5-5.5" />
      </svg>
      {text}
    </a>
  );
}
