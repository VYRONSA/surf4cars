/**
 * SURF FOR CARS — marque identity.
 *
 * How a manufacturer is represented on screen, resolved per marque rather than per strip.
 *
 * The framing that matters: this is not a placeholder waiting for logos. Manufacturers do not all publish
 * the same asset type, and several never will — some licence an SVG mark, some supply only a monochrome
 * wordmark, some publish typographic guidelines and nothing else. A component that assumes every brand
 * arrives as an SVG would be permanently half-empty. Four tiers, best available wins:
 *
 *   1. logo         a licensed SVG mark. The roundel, the star, the rings.
 *   2. wordmark     a manufacturer-supplied monochrome wordmark image.
 *   3. typographic  the name set to match the marque's own published typographic style — weight, tracking
 *                   and case, in our typeface. Not their logo, and not their licensed typeface: an
 *                   approximation of house style, which is why it sits below a supplied wordmark.
 *   4. fallback     the name in the strip's default treatment.
 *
 * Tier 3 is the one worth being careful about. Setting "MERCEDES-BENZ" in light weight at wide tracking
 * because that is how Mercedes sets its own name is fair use of a name. Reproducing their letterforms
 * would not be, and neither would claiming this *is* their wordmark. It is a respectful approximation and
 * is labelled as one in the type.
 *
 * Only marques whose published style is genuinely distinctive get a tier 3 entry. Inventing a house style
 * for twenty manufacturers so the table looks complete would be exactly the kind of confident fabrication
 * the platform refuses everywhere else.
 */

export type MarqueAssetKind = "logo" | "wordmark" | "typographic" | "fallback";

/** Typographic treatment approximating a marque's published house style. */
export interface MarqueTypography {
  /** Tailwind font-weight class. */
  readonly weight: string;
  /** Tailwind tracking class. */
  readonly tracking: string;
  readonly uppercase: boolean;
}

export interface MarqueIdentity {
  readonly name: string;
  readonly slug: string;
  readonly kind: MarqueAssetKind;
  /** Set for `logo` and `wordmark`. Rendered inside a fixed optical box, never stretched. */
  readonly src: string | null;
  /** Set for `typographic`. */
  readonly typography: MarqueTypography | null;
}

const marqueSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Marks installed in the premium media library.
 *
 * Written by `scripts/media/generate-marque-logos.mjs` from `simple-icons` (CC0-1.0), each at the
 * manufacturer's own official brand colour and otherwise unmodified. CC0 covers the artwork file; the
 * trademarks remain the manufacturers'. Showing them is nominative use — SURF4CARS lists these
 * manufacturers' vehicles for sale, which is the same basis every classifieds site relies on.
 *
 * To replace one with artwork a manufacturer supplies directly, overwrite the file at the same path. The
 * slug stays listed and nothing else changes.
 */
const LICENSED_LOGOS: ReadonlySet<string> = new Set([
  "bmw",
  "audi",
  "porsche",
  "volvo",
  "toyota",
  "volkswagen",
  "ford",
  "hyundai",
  "kia",
  "nissan",
  "mazda",
  "suzuki",
  "peugeot",
  "renault",
  "mitsubishi",
  "honda",
  "mahindra",
]);

/**
 * Manufacturer-supplied monochrome wordmark images.
 *
 * Separate from logos because they are a separate permission and a separate asset — a brand that will not
 * licence its roundel will often supply a wordmark, and that is a materially better representation than
 * our approximation of their type.
 */
const SUPPLIED_WORDMARKS: ReadonlySet<string> = new Set([]);

/**
 * Published house styles, approximated.
 *
 * Each entry reflects how the manufacturer sets its own name in its published brand guidelines: BMW tight
 * and bold, Mercedes-Benz light and widely spaced, Audi extended and light, Jaguar and Lexus airy. Marques
 * without a distinctive published style are deliberately absent — they take the default rather than a
 * guess.
 */
const HOUSE_STYLES: Readonly<Record<string, MarqueTypography>> = {
  bmw: { weight: "font-bold", tracking: "tracking-[0.06em]", uppercase: true },
  "mercedes-benz": { weight: "font-light", tracking: "tracking-[0.28em]", uppercase: true },
  audi: { weight: "font-light", tracking: "tracking-[0.22em]", uppercase: true },
  porsche: { weight: "font-bold", tracking: "tracking-[0.14em]", uppercase: true },
  volvo: { weight: "font-normal", tracking: "tracking-[0.24em]", uppercase: true },
  jaguar: { weight: "font-light", tracking: "tracking-[0.32em]", uppercase: true },
  lexus: { weight: "font-light", tracking: "tracking-[0.30em]", uppercase: true },
  volkswagen: { weight: "font-semibold", tracking: "tracking-[0.04em]", uppercase: true },
  toyota: { weight: "font-medium", tracking: "tracking-[0.16em]", uppercase: true },
  hyundai: { weight: "font-normal", tracking: "tracking-[0.20em]", uppercase: true },
  kia: { weight: "font-semibold", tracking: "tracking-[0.18em]", uppercase: true },
  nissan: { weight: "font-normal", tracking: "tracking-[0.18em]", uppercase: true },
};

/** The best representation available for a marque, and what kind it is. */
export function resolveMarqueIdentity(name: string): MarqueIdentity {
  const slug = marqueSlug(name);
  const base = { name, slug } as const;

  if (LICENSED_LOGOS.has(slug)) {
    return { ...base, kind: "logo", src: `/media/premium/manufacturers/${slug}.svg`, typography: null };
  }

  if (SUPPLIED_WORDMARKS.has(slug)) {
    return {
      ...base,
      kind: "wordmark",
      src: `/media/premium/manufacturers/${slug}-wordmark.svg`,
      typography: null,
    };
  }

  const house = HOUSE_STYLES[slug];
  if (house) {
    return { ...base, kind: "typographic", src: null, typography: house };
  }

  return { ...base, kind: "fallback", src: null, typography: null };
}

/**
 * Optical normalisation constants.
 *
 * A logo wall looks scraped when its marks disagree about height and weight, and the instinct — scaling
 * each asset until it "looks right" — distorts artwork the manufacturer specified. So presentation is
 * normalised and the artwork is not:
 *
 *   height   every mark renders inside the same fixed box, contained rather than stretched. A wide
 *            wordmark and a square roundel occupy the same vertical space and neither is deformed.
 *   weight   optical weight is matched with opacity, not with scale or stroke. A heavy mark and a light
 *            one settle to the same presence without either being redrawn.
 *   baseline the box is centred, so marks of different proportions share one optical baseline instead of
 *            each sitting wherever its own bounding box lands.
 */
export const MARQUE_OPTICAL = {
  /**
   * Shared cap-height box.
   *
   * 40px rather than 16px. A marque wall only works if the marks are recognisable at a glance, and a
   * roundel at 16px is a smudge — the strip was legible as text and illegible as logos.
   *
   * This is the point where the strip stops being pure navigation and starts carrying brand weight, which
   * is the intent: the marks are now read as badges rather than scanned as a list. It is still one row and
   * still nothing to read, so it does not compete with the featured vehicles below it.
   */
  boxHeightClass: "h-10",
  /** Resting opacity, so a dense mark does not shout over a light one. */
  restOpacity: "opacity-70",
  hoverOpacity: "group-hover:opacity-100",
} as const;
