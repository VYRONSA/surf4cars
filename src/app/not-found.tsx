import Link from "next/link";

import { ErrorView } from "@/components/shell";

/**
 * A 404 here is usually a sold vehicle or an old link, so it offers two ways onward rather than none.
 *
 * `ErrorView` used to supply a *disabled* "Return home" whenever a caller passed no action — and this
 * route passed none. So the most likely error page on the marketplace showed a greyed-out button and
 * no way out of it. The fallback is gone; the action belongs to the page that knows the context.
 */
export default function NotFound() {
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
