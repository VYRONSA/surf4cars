import { PublicShellLayout } from "@/components/layout";
import { MarketplaceNotFound } from "@/components/shell";

/**
 * The 404 for a URL that matched no route at all — an old link from Google, a mistyped address, a
 * shared listing whose slug changed.
 *
 * It carries the public shell explicitly. This file sits above every route group, so nothing else
 * wraps it: without the shell it rendered with no header, no footer, no search and no Back control —
 * two links on an otherwise empty page, on the one screen where the visitor is by definition lost.
 *
 * Route groups that call `notFound()` themselves have their own boundary, so their shell is not
 * duplicated by this one.
 */
export default function NotFound() {
  return (
    <PublicShellLayout>
      <MarketplaceNotFound />
    </PublicShellLayout>
  );
}
