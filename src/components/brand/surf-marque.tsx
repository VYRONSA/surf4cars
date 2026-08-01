import { cn } from "@/utils";

/**
 * The SURF4CARS marque — swoosh, wordmark, locality line.
 *
 * WHAT WAS WRONG WITH THE WORDMARK ALONE
 * ======================================
 * It was the brand name set in a bold sans and nothing else. Correct, legible, and indistinguishable
 * from a heading — which is exactly what a visitor read it as. A marque is not a word in a typeface;
 * it is a *lockup*, and the parts that make it read as a badge rather than as text are the ones that
 * were missing: a device above the name, a rule beneath it, a locality line, and a surface.
 *
 * THE SWOOSH
 * ==========
 * Drawn, not photographed, and drawn as one gesture: the roofline of a car seen in profile, opening
 * from a fine point at the left into a full stroke at the right, with the performance red trailing
 * beneath it as the second, faster line. Two strokes because one reads as an underline and three
 * read as a logo from 2004.
 *
 * It is an SVG rather than an image so it inherits colour, stays sharp at any size, and costs no
 * request. `vector-effect` is deliberately absent — the stroke *should* scale with the mark.
 *
 * THE SURFACE
 * ===========
 * Brushed metal, which on a screen means a gradient across the glyphs that is bright at the top,
 * dips through a soft shadow at the optical centre, and lifts again at the base — the way light
 * behaves on a horizontal brushed panel. That is the whole trick, and the restraint is the point:
 *
 *   no glow          the brief forbids it, and a glowing wordmark reads as a game logo
 *   no bevel         a 3D bevel is the single fastest way to look like 1998 clip art
 *   no cheap gradient  a two-stop grey ramp is not metal, it is a fade
 *
 * The one true highlight is a narrow band a little above centre. Real chrome has exactly one, and
 * putting a second anywhere destroys the illusion instantly.
 *
 * OPTICAL SPACING
 * ===============
 * `letter-spacing` alone is not kerning. At display size the pairs that break "SURF4CARS" are the
 * round-to-flat joins, so the numeral carries its own tighter margins and the R→F and S→_ pairs are
 * nudged by hand. Set uniformly, "SURF" reads a full step looser than "CARS" because U and R leave
 * more air than A and R do — which is why the mark looked slightly broken without ever looking
 * obviously wrong.
 */

const SIZE = {
  /** The homepage hero lockup, top-left of the frame in the reference composition. */
  hero: {
    wordmark: "text-[clamp(1.75rem,2.6vw,2.5rem)]",
    locality: "text-[clamp(0.5rem,0.62vw,0.6rem)] tracking-[0.46em]",
    gap: "gap-[0.08em]",
  },
  /** Interior page mastheads, where navigation has to win the space back. */
  header: {
    wordmark: "text-[1.5rem] lg:text-[1.625rem]",
    locality: "text-[0.44rem] tracking-[0.42em]",
    gap: "gap-[0.05em]",
  },
  footer: {
    wordmark: "text-[1.5rem]",
    locality: "text-[0.48rem] tracking-[0.44em]",
    gap: "gap-[0.06em]",
  },
} as const;

export type SurfMarqueSize = keyof typeof SIZE;

export interface SurfMarqueProps {
  readonly size?: SurfMarqueSize;
  /** Hides the "SOUTH AFRICA" line where the lockup has to sit in a tight bar. */
  readonly showLocality?: boolean;
  readonly className?: string;
}

function Swoosh({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 240 16"
      fill="none"
      aria-hidden
      focusable="false"
      /* `w-0 min-w-full`: an SVG with an intrinsic aspect ratio contributes an intrinsic *width* to a
         shrink-to-fit flex container, so the swoosh was setting the lockup's width and then filling
         it — a device wider than the name it belongs to. Zero-width removes it from that calculation;
         the min-width stretches it to whatever the wordmark decided. */
      className={cn("h-auto w-0 min-w-full", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      {/*
        The roofline. One path, filled rather than stroked, so it can taper — a stroke of even width
        reads as a swipe, and a car's profile is not an even width anywhere along it.
      */}
      <path
        d="M3 14.3C52 3.7 108 0.3 152 0.3C193 0.3 222 4 237 10.3C214 6.3 180 4.3 146 4.3C104 4.3 50 7.7 3 14.3Z"
        className="fill-[var(--color-foreground)]"
      />
      {/* The performance line, trailing beneath and shorter — a second gesture, not a mirror. */}
      <path
        d="M46 15.6C88 9.7 130 7 166 7C192 7 212 8.3 228 10.7C209 9 189 8.3 166 8.3C132 8.3 90 11 46 15.6Z"
        className="fill-[var(--color-primary)]"
      />
    </svg>
  );
}

export function SurfMarque({ size = "hero", showLocality = true, className }: SurfMarqueProps) {
  const scale = SIZE[size];

  return (
    /* `items-stretch` rather than `items-center`: the swoosh sizes to the lockup's width, which is set
       by the wordmark. Centring would collapse it to its own intrinsic width instead. */
    <span className={cn("surf-marque inline-flex flex-col items-stretch", scale.gap, className)}>
      {/* One accessible name for the whole lockup. Three spans announce as "SURF 4 CARS" with pauses,
          and a screen reader says "surf four cars", which is not the brand's name. */}
      <span className="sr-only">SURF4CARS</span>

      <Swoosh className="surf-marque__swoosh" />

      <span
        aria-hidden
        className={cn(
          "surf-marque__word inline-flex items-baseline font-[750] leading-[0.9]",
          scale.wordmark,
        )}
      >
        <span className="surf-marque__metal tracking-[0.012em]">SURF</span>
        {/* The numeral carries its own margins: it is narrower than the letters either side and
            inherits their tracking as a gap that reads as a space in the middle of the name. */}
        <span className="surf-marque__accent mx-[-0.012em]">4</span>
        <span className="surf-marque__metal tracking-[0.006em] ml-[0.02em]">CARS</span>
      </span>

      {showLocality && (
        <span
          aria-hidden
          className={cn(
            "surf-marque__locality block text-center font-medium uppercase text-[var(--color-foreground)]/70",
            scale.locality,
          )}
        >
          South&nbsp;Africa
        </span>
      )}
    </span>
  );
}
