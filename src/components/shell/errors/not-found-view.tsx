import Link from "next/link";

import { ErrorView } from "./error-view";

/**
 * The 404 body, shared by every not-found boundary that sits on a customer-facing route.
 *
 * WHY THIS IS A COMPONENT AND NOT JUST `app/not-found.tsx`
 * =======================================================
 * Next renders the *nearest* not-found boundary, and the chrome around it comes from that boundary's
 * own layout. One file at the root therefore cannot be right for both cases: on an unmatched URL it
 * renders with nothing above it, and on a `notFound()` inside a route group it renders inside that
 * group's shell. Give the root file a shell and the second case gets two headers; leave it bare and
 * the first case gets none — which is what shipped, and it was the more common of the two.
 *
 * So the body lives here and each boundary supplies its own surroundings.
 */
export function MarketplaceNotFound() {
  return (
    <ErrorView
      type="404"
      action={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/search"
            className="motion-button inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-5 text-[length:var(--text-body-sm)] font-medium hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]"
          >
            Browse the marketplace
          </Link>
          <Link
            href="/"
            className="motion-button inline-flex min-h-11 items-center rounded-[var(--radius-pill)] px-5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            Home
          </Link>
        </div>
      }
    />
  );
}
