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
  /**
   * The homepage arrival lockup — the brand owning the top-left quadrant.
   *
   * WHY THIS IS SO MUCH LARGER THAN A MASTHEAD
   * ==========================================
   * Because it is not a masthead. At 26px the mark was doing the job of website navigation and read
   * as exactly that: a logo in a corner, scanned past on the way to the search box. The concept puts
   * it at roughly four times that width, which sounds excessive until you look at what a marque does
   * on a Porsche or Aston Martin landing page — it *is* the first frame, and everything else is
   * arranged beneath it.
   *
   * Sized in `clamp` against the viewport rather than at breakpoints, because the photograph behind
   * it scales continuously. A mark that steps while the image glides looks pasted on.
   *
   * The upper bound matters as much as the lower one: past about 5.5rem the wordmark starts
   * colliding with the navigation on a 1280px screen, and the lockup has to hold its own column.
   */
  display: {
    wordmark: "text-[clamp(2.25rem,5.2vw,5.25rem)]",
    locality: "text-[clamp(0.62rem,1.28vw,1.32rem)] tracking-[0.44em]",
    gap: "gap-[0.06em]",
  },
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
      viewBox="0 0 240 24"
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
        A car in profile, not an arc.
        =============================
        The first version was a symmetric lens — legible at masthead size and, once the mark went to
        display scale, obviously just a curved line. The concept's device reads as a *vehicle*: the
        mass sits left of centre where a cabin would be, and the tail runs long and thin to the right
        the way a fastback does.

        So the white path now rises quickly from a fine point at the nose, carries its weight through
        the roofline at about a third of the width, and tapers across the remaining two-thirds. That
        asymmetry is the whole difference between "swoosh" and "car".
      */}
      <path
        d="M2 20.5C34 8.5 74 1.8 118 1.8C160 1.8 202 6.2 238 14.8C204 10.4 166 8.2 124 8.2C82 8.2 40 12.6 2 20.5Z"
        className="fill-[var(--color-foreground)]"
      />
      {/*
        The waistline, beneath and shorter — the second, faster line. It starts after the nose and
        stops before the tail, so the two never run parallel; two parallel strokes read as an
        underline rather than as motion.
      */}
      <path
        d="M30 22.8C66 15.2 104 11.4 142 11.4C170 11.4 198 13.2 222 16.4C198 14.6 172 13.8 142 13.8C106 13.8 68 17.4 30 22.8Z"
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
