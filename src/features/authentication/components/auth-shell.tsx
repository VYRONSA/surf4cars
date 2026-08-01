import Link from "next/link";
import type { ReactNode } from "react";

import { SurfWordmarkLink } from "@/components/brand";
import { Icon } from "@/components/ui/icons";
import { ArrowLeft } from "@/components/ui/icons/registry";
import { HeroImageBackground } from "@/components/ui/media";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { cn } from "@/utils";

/**
 * The frame every authentication page sits in.
 *
 * WHAT WAS WRONG
 * ==============
 * All six auth pages rendered the same bare wrapper — `<main><section>` — inside a route group whose
 * layout returns `children` untouched. The result had no header, no footer, no wordmark and no
 * photography: a grey card floating in a void, with nothing on the page identifying whose site it
 * was except one line of body copy. Somebody arriving from a password-reset email could not have
 * told it was SURF4CARS. It was the least brand-consistent surface on the platform by a distance.
 *
 * THE WIDTH BUG, WHICH LOOKED CORRECT IN CODE
 * ===========================================
 * Every one of them was written `max-w-xl`, which in Tailwind v3 is 36rem — a sensible form column.
 * This project runs Tailwind v4, where `max-w-*` resolves against the `--container-*` theme
 * namespace, and `--container-xl` is 1280px. So the class was silently asking for a *1280px* form,
 * and the email input on the sign-in page was drawn 1200px wide.
 *
 * Nothing about the source looked wrong, which is why it survived. The fix is to state the measure
 * explicitly rather than to reach for a scale whose meaning changed underneath the code: a form
 * column is 27rem because that is a comfortable line length for one, not because a token says so.
 *
 * WHY A SPLIT
 * ===========
 * The photograph is the brand's whole argument, and an authentication page is the one place a
 * marketplace normally forgets it. Keeping it on the left costs nothing — the image is already
 * fetched for the homepage hero — and it turns a utility screen into part of the same publication.
 * Below `lg` it drops away entirely rather than shrinking to a strip; a 390px-wide slice of a
 * landscape photograph reads as a loading artefact.
 */

export interface AuthShellProps {
  /** Sits above the heading, small. Names the journey, never the system function. */
  readonly eyebrow?: string;
  readonly heading: string;
  readonly description?: string;
  readonly children: ReactNode;
  /** Secondary routes — forgot password, create account. Rendered under a rule. */
  readonly footer?: ReactNode;
}

export function AuthShell({ eyebrow, heading, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      {/* The photograph. Decorative here — the page's meaning is entirely in the column beside it. */}
      <div className="relative isolate hidden lg:flex lg:w-[46%] lg:flex-col lg:justify-end xl:w-1/2">
        <HeroImageBackground
          src={PREMIUM_IMAGES.hero.homepage}
          alt=""
          sizes={PREMIUM_IMAGE_SIZES.sectionHalf}
          overlay={false}
          objectPosition="center"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(var(--color-scrim-rgb),0.88)_0%,rgba(var(--color-scrim-rgb),0.35)_45%,transparent_75%)]"
        />
        <p className="relative max-w-md p-10 text-[length:var(--text-h3)] font-semibold leading-[1.15] tracking-[-0.02em] text-white xl:p-14">
          Every vehicle, from a registered dealership.
        </p>
      </div>

      <div className="flex flex-1 flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
        <header className="flex items-center justify-between gap-6">
          <SurfWordmarkLink size="header" />
          {/* An authentication page is a detour, and a detour needs a way back. Without this the
              only exit from a sign-in screen was the browser's back button. */}
          <Link
            href="/"
            className="motion-nav inline-flex items-center gap-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <Icon icon={ArrowLeft} aria-hidden className="size-4" />
            Marketplace
          </Link>
        </header>

        <main className="flex flex-1 items-center py-12">
          {/* 27rem, stated. See the note above on why `max-w-xl` cannot be trusted here. */}
          <div className="w-full max-w-[27rem]">
            {eyebrow && (
              <p className="text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {eyebrow}
              </p>
            )}

            <h1
              className={cn(
                "text-balance text-[length:var(--text-h2)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]",
                eyebrow && "mt-3",
              )}
            >
              {heading}
            </h1>

            {description && (
              <p className="mt-3 text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
                {description}
              </p>
            )}

            {/* No card. The shell already separates this column from the photograph, so a bordered,
                shadowed panel inside it was a box drawn around a box. */}
            <div className="mt-8">{children}</div>

            {footer && (
              <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-5">{footer}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * A secondary route out of an auth page.
 *
 * Was `text-[var(--color-brand-primary)]` — brand red, on every "Forgot password?" and "Create
 * account" link. Red is the colour of the one action a page is asking for, and on a sign-in page
 * that action is signing in. Two red links flanking a red button taught the eye that red means
 * nothing here.
 */
export function AuthShellLink({ href, children }: { readonly href: string; readonly children: ReactNode }) {
  return (
    <Link
      href={href}
      className="motion-nav text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] underline-offset-4 hover:text-[var(--color-foreground)] hover:underline"
    >
      {children}
    </Link>
  );
}
