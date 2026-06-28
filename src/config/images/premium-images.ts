/**
 * SURF FOR CARS — Premium Image Library
 * Official production visual assets. Import paths from here — do not duplicate.
 */

export const PREMIUM_IMAGES = {
  hero: {
    homepage: "/images/hero/hero-homepage-main.webp",
  },
  sections: {
    dealerGrowth: "/images/sections/dealer-growth-main.webp",
    aiIntelligence: "/images/sections/ai-intelligence-main.webp",
    vehicleSearch: "/images/sections/vehicle-search-bg.webp",
    featuredCollections: "/images/sections/featured-collections-bg.webp",
  },
  dashboard: {
    dealerDashboard: "/images/dashboard/dealer-dashboard-hero.webp",
    inventory: "/images/dashboard/inventory-management-hero.webp",
    aiMarketingStudio: "/images/dashboard/ai-marketing-studio-hero.webp",
    leads: "/images/dashboard/lead-intelligence-hero.webp",
    finance: "/images/dashboard/finance-profit-intelligence-hero.webp",
  },
  vehicles: {
    details: "/images/vehicles/vehicle-details-hero.webp",
  },
  dealers: {
    profile: "/images/dealers/dealer-profile-hero.webp",
    join: "/images/dealers/join-dealer-hero.webp",
  },
  ai: {
    valuation: "/images/ai/ai-vehicle-valuation-hero.webp",
    inspection: "/images/ai/vehicle-inspection-hero.webp",
  },
  categories: {
    /** Default category hero until category-specific assets are added. */
    default: "/images/categories/category-suv-hero.webp",
    suv: "/images/categories/category-suv-hero.webp",
  },
  search: {
    advanced: "/images/search/advanced-search-hero.webp",
  },
  guides: {
    buying: "/images/guides/buying-guides-hero.webp",
  },
  news: {
    reviews: "/images/news/news-reviews-hero.webp",
  },
  support: {
    contact: "/images/support/contact-support-hero.webp",
  },
} as const;

export type PremiumImagePath =
  (typeof PREMIUM_IMAGES)[keyof typeof PREMIUM_IMAGES] extends infer Group
    ? Group extends Record<string, string>
      ? Group[keyof Group]
      : never
    : never;

/** Responsive `sizes` hints for common hero layouts. */
export const PREMIUM_IMAGE_SIZES = {
  fullWidth: "100vw",
  sectionHalf: "(max-width: 768px) 100vw, 50vw",
  sectionWide: "(max-width: 1024px) 100vw, 1280px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
} as const;
