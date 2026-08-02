"use client";

import { usePathname } from "next/navigation";

import { BackButton } from "./back-button";

/**
 * The Back control, placed once per shell rather than once per page.
 *
 * WHY THIS IS IN THE LAYOUT AND NOT IN 55 PAGES
 * =============================================
 * The requirement is that every screen except the homepage has one. Added page by page, that is 55
 * edits and a permanent obligation on every future page — and the failure is silent, because a
 * missing Back button looks exactly like a page that has one until you need it.
 *
 * Placed in the two shells every route group already composes, it is structurally impossible for a
 * new page to be missing one.
 *
 * The homepage is the only exclusion, and it excludes itself by path rather than by a prop somebody
 * has to remember to pass.
 */
export function BackNavigationBar() {
  const pathname = usePathname();

  /* The homepage is the root of every journey; there is nothing above it to go back to. */
  if (!pathname || pathname === "/") return null;

  return (
    <div className="mx-auto w-full max-w-[var(--container-2xl)] px-4 pt-4 sm:px-6 lg:px-8">
      <BackButton />
    </div>
  );
}
