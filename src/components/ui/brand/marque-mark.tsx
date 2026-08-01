import Image from "next/image";

import { MARQUE_OPTICAL, type MarqueIdentity } from "@/services/presentation";
import { cn } from "@/utils";

/**
 * One manufacturer, rendered at whatever fidelity we legitimately have.
 *
 * The strip should read like the dashboard of a luxury car: small, understated, and coherent despite the
 * marks originating from a dozen different design departments. Coherence here is a presentation problem,
 * not an artwork problem — so this normalises the frame and leaves every supplied asset untouched.
 *
 *   optical height   one fixed box for every marque. Images are `object-contain`, never `fill`, so a wide
 *                    wordmark and a square roundel share vertical space without either being stretched.
 *                    Distorting a manufacturer's mark to fit a grid is both ugly and a licence breach.
 *   visual weight    matched with opacity rather than scale. A dense mark and an airy one settle to the
 *                    same presence, and nothing is redrawn to get there.
 *   baseline         the box is centred, so marks with different bounding-box proportions sit on one
 *                    optical line instead of each landing wherever its own artwork happens to.
 *   hover            identical across all four tiers. A logo and a typographic treatment must not behave
 *                    differently, or the strip stops feeling like one control surface.
 *
 * The four tiers are resolved upstream by `resolveMarqueIdentity`. This component only renders them.
 */

export interface MarqueMarkProps {
  readonly identity: MarqueIdentity;
  readonly className?: string;
}

export function MarqueMark({ identity, className }: MarqueMarkProps) {
  const shared = cn(
    "inline-flex items-center justify-center",
    MARQUE_OPTICAL.boxHeightClass,
    MARQUE_OPTICAL.restOpacity,
    MARQUE_OPTICAL.hoverOpacity,
    "transition-opacity motion-hover",
    className,
  );

  /*
    A mark on a light plate.
    ========================
    Brand colours are chosen for print and for light backgrounds: Volvo is #003057, Ford #00274E,
    Peugeot #000000. On a dark page those are invisible, and the only ways out are recolouring the mark —
    which brand guidelines forbid — or giving it a surface it was designed for.

    So each mark sits on a small light plate. The colour stays exactly as the manufacturer publishes it,
    every mark becomes legible regardless of its hue, and the row gains the badge-like quality of marques
    on a dashboard. The plate is a presentation decision; the artwork is still untouched.
  */
  if (identity.src) {
    return (
      <span
        className={cn(
          shared,
          /* Plate padding scales with the box: at 40px a 3px inset reads as no plate at all, and the mark
             ends up touching the corner radius. */
          "rounded-[var(--radius-md)] bg-[#f4f5f7] px-2.5 py-1.5",
          /* Plates are opaque, so the shared resting opacity would grey them. Brightness reads as
             recessive here without dulling the brand colour itself. */
          "opacity-100 brightness-[0.94] group-hover:brightness-100",
        )}
      >
        <Image
          src={identity.src}
          alt={identity.name}
          width={96}
          height={16}
          /*
            Rendered in the manufacturer's own colours, unmodified.
            ======================================================
            `h-full w-auto object-contain` is the whole normalisation: the height is ours, the aspect
            ratio and every pixel of colour remain the manufacturer's.

            An earlier version forced `brightness-0 invert` to flatten marks to white for a monochrome
            strip. That was the wrong instinct legally as well as visually — recolouring a mark is the
            single thing almost every brand guideline prohibits, whereas reproducing one unaltered is the
            compliant form. Colour also does the recognition work: a BMW roundel is blue and white before
            it is anything else, and stripped of that it is just a circle.

            Do not reintroduce a colour filter here.
          */
          className="h-full w-auto object-contain"
        />
      </span>
    );
  }

  /*
    Typographic tiers. Both render the name; the difference is whether we are matching the marque's own
    published style or using the strip's default. `leading-none` keeps the glyph box the same height as
    the image box above, which is what puts every tier on one baseline.
  */
  return (
    <span
      className={cn(
        shared,
        "whitespace-nowrap leading-none",
        identity.typography
          ? cn(
              identity.typography.weight,
              identity.typography.tracking,
              identity.typography.uppercase && "uppercase",
            )
          : "font-semibold uppercase tracking-[0.1em]",
      )}
    >
      {identity.name}
    </span>
  );
}
