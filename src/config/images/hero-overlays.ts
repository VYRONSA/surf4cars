/**
 * Premium hero overlay gradients — deep charcoal, cinematic, never washed-out.
 * Opacity range: ~25–40% at strongest points; transparent mid-tones preserve image detail.
 */

/** Deep charcoal used in hero gradients (matches luxury automotive UI). */
export const HERO_OVERLAY_CHARCOAL = "24,24,27" as const;

export const HERO_OVERLAY_GRADIENTS = {
  /**
   * Full-viewport heroes with centred text (homepage, search).
   * Vignette at top/bottom; centre stays vivid.
   */
  cinematic: `bg-[linear-gradient(180deg,rgba(${HERO_OVERLAY_CHARCOAL},0.38)_0%,rgba(${HERO_OVERLAY_CHARCOAL},0.1)_30%,transparent_55%,transparent_70%,rgba(${HERO_OVERLAY_CHARCOAL},0.36)_100%)]`,

  /**
   * Full-width section backgrounds with heading + content.
   */
  section: `bg-[linear-gradient(180deg,rgba(${HERO_OVERLAY_CHARCOAL},0.36)_0%,rgba(${HERO_OVERLAY_CHARCOAL},0.08)_25%,transparent_45%,transparent_65%,rgba(${HERO_OVERLAY_CHARCOAL},0.32)_100%)]`,

  /**
   * Contained panels with UI over the image (AI cards, feature blocks).
   */
  contained: `bg-[linear-gradient(180deg,rgba(${HERO_OVERLAY_CHARCOAL},0.3)_0%,transparent_40%,rgba(${HERO_OVERLAY_CHARCOAL},0.28)_100%)]`,

  /**
   * Lighter section overlay — background image remains visible behind glass cards.
   */
  sectionLight: `bg-[linear-gradient(180deg,rgba(${HERO_OVERLAY_CHARCOAL},0.22)_0%,rgba(${HERO_OVERLAY_CHARCOAL},0.05)_22%,transparent_50%,transparent_72%,rgba(${HERO_OVERLAY_CHARCOAL},0.2)_100%)]`,

  /** Bottom-weighted fade for seamless section transitions. */
  bottomFade: `bg-[linear-gradient(180deg,transparent_0%,transparent_55%,rgba(${HERO_OVERLAY_CHARCOAL},0.34)_100%)]`,
} as const;

export type HeroOverlayVariant = keyof typeof HERO_OVERLAY_GRADIENTS;

/** @deprecated Use HERO_OVERLAY_GRADIENTS with overlayVariant instead. */
export const HERO_TEXT_OVERLAY_CLASS = HERO_OVERLAY_GRADIENTS.cinematic;

/** Default focal points for premium automotive photography. */
export const HERO_OBJECT_POSITION = {
  center: "object-center",
  heroSubject: "object-[center_35%]",
  landscape: "object-[center_40%]",
  wide: "object-center",
} as const;

export type HeroObjectPosition = keyof typeof HERO_OBJECT_POSITION;
