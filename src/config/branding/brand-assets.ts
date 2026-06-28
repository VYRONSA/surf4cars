/**
 * SURF FOR CARS — Official brand assets.
 * Single source of truth for production branding.
 */

export const BRAND_LOGO = {
  src: "/images/branding/logo-main.webp",
  alt: "SURF FOR CARS",
  width: 1536,
  height: 1024,
} as const;

/** @deprecated Use BRAND_LOGO.src — legacy PNG asset. */
export const LEGACY_BRAND_LOGO_SRC = "/images/branding/logo.png" as const;

/**
 * Display heights (px) — width scales automatically via aspect ratio.
 * Desktop header: 42–48px · Mobile header: 34–38px
 */
export const BRAND_LOGO_HEIGHT = {
  headerMobile: 36,
  headerTablet: 40,
  headerDesktop: 46,
  footer: 40,
  shell: 36,
  onboarding: 40,
  loading: 48,
} as const;

export const BRAND_NAME = "SURF FOR CARS" as const;
