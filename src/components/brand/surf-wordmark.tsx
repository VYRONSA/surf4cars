import Link from "next/link";

import { cn } from "@/utils";

/**
 * The SURF4CARS wordmark — the platform's primary brand identifier.
 *
 * Set in type, not shipped as an image. The treatment this replaces was a 220px raster with the
 * wordmark and two taglines burned into the pixels; it could not scale, could not be recoloured, went
 * soft on dense displays, and carried copy that no longer matched the product. Type solves all of
 * that, and a wordmark is one of the few brand assets where type is genuinely the right medium.
 *
 * SURF · 4 · CARS, with the performance red on the "4" and nowhere else. One accent, one focal point.
 *
 * The icon mark is retained as a secondary supporting device — see `SurfLogo`. This is what identifies
 * the brand; that decorates it.
 *
 * Interaction lives in `.brand-wordmark` in src/styles/tokens/utilities.css, so hover and reduced-motion
 * behaviour is defined once rather than per consumer.
 */

const SIZE_CLASS = {
  /**
   * The homepage hero. The brand as the opening frame of the composition, not as navigation.
   *
   * Roughly four times the masthead size, with the tracking opened up. A wordmark set this large
   * needs *more* letter-spacing, not less: at 7rem the default kerning closes the counters and
   * "SURF4CARS" reads as one dense block rather than as a name. The extra tracking is what makes it
   * feel like a marque rather than a heading.
   *
   * Sized in `clamp` rather than at breakpoints so it scales with the viewport continuously — the
   * hero photograph does, and a wordmark that steps while the image behind it glides looks pasted on.
   */
  display: "text-[clamp(2.75rem,7.5vw,7rem)] tracking-[0.06em] sm:tracking-[0.08em]",
  /** Public site header. */
  hero: "text-[1.5rem] sm:text-[1.75rem] lg:text-[2rem]",
  /** Application shells, where navigation has to win the space back. */
  header: "text-[1.25rem] lg:text-[1.375rem]",
  footer: "text-[1.375rem]",
  compact: "text-[1rem]",
} as const;

export type SurfWordmarkSize = keyof typeof SIZE_CLASS;

export interface SurfWordmarkProps {
  readonly size?: SurfWordmarkSize;
  readonly className?: string;
}

export function SurfWordmark({ size = "header", className }: SurfWordmarkProps) {
  return (
    <span className={cn("brand-wordmark", SIZE_CLASS[size], className)}>
      {/*
        One accessible name for the whole mark, and the pieces hidden from the accessibility tree.
        Read literally, three spans announce as "SURF 4 CARS" with pauses, and screen readers pronounce
        the numeral — "surf four cars" is not the brand's name.
      */}
      <span className="sr-only">SURF4CARS</span>
      <span aria-hidden className="brand-wordmark__word">
        SURF
      </span>
      <span aria-hidden className="brand-wordmark__accent">
        4
      </span>
      <span aria-hidden className="brand-wordmark__word">
        CARS
      </span>
    </span>
  );
}

export interface SurfWordmarkLinkProps extends SurfWordmarkProps {
  readonly href?: string;
  readonly ariaLabel?: string;
}

/** The wordmark as the route home — the behaviour every visitor already expects of a masthead. */
export function SurfWordmarkLink({
  href = "/",
  ariaLabel = "SURF4CARS — home",
  size,
  className,
}: SurfWordmarkLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex shrink-0 rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
    >
      <SurfWordmark size={size} className={className} />
    </Link>
  );
}
