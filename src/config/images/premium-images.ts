/**
 * SURF FOR CARS — Premium Image Library
 * Official production visual assets. Import paths from here — do not duplicate.
 *
 * Each path below asks the curated media library first and falls back to the legacy asset while a
 * category is still awaiting Founder review. Approving a candidate on the creative review board is
 * therefore all it takes to change what the site looks like — no code change follows an approval.
 * See docs/experience-bible/10-creative-direction.md.
 */

import { resolvePremiumImage } from "@/config/media";

/** Shown for a category that has been neither curated nor given its own legacy asset. */
const CATEGORY_PLACEHOLDER = "/images/categories/category-suv-hero.webp";

const curated = (id: string, fallback: string): string => resolvePremiumImage(id, fallback) ?? fallback;

/**
 * A slot with no honest stand-in.
 *
 * Lifestyle, Cape Town and showroom interiors have no equivalent anywhere in the repository, and the
 * nearest thing to each would be a lie — a European motor-show floor is not a Cape Town showroom, and
 * a press photograph of a car is not a photograph of somebody's life. Null until reviewed, so the
 * caller renders nothing rather than something wrong.
 */
const curatedOrNone = (id: string): string | null => resolvePremiumImage(id);

/**
 * The best frame of the right kind of car that this repository actually owns, standing in until a
 * category has been through review.
 *
 * Be clear about what these are. The demonstration library is Wikimedia-sourced documentary
 * photography, not commissioned brand photography — most of it is motor-show stands, car parks and
 * street snaps, and it includes frames no marketplace should ever publish. Each choice below was
 * made by looking at all 52 usable frames on a contact sheet and taking the least compromised one:
 * a single vehicle, clean light, no crowd, no signage, no burned-in press text.
 *
 * They hold the section up. They do not clear the Founder's bar — "would Porsche use this?" — and
 * they are not meant to. That is what the creative review board is for, and no path through the
 * free-licence pool reaches Porsche-grade photography. Replacing these is a purchasing decision.
 *
 * Every frame named below is at least 3:2. That is not incidental: the category tiles are 3:2, and
 * `object-cover` on a source *narrower* than its container crops the left and right — which cuts the
 * nose and tail off the car. Wider is safe, because the crop then only takes sky and tarmac. A shot
 * added here at 4:3 will silently slice the vehicle, so check the aspect before changing one.
 */
const libraryCar = (slug: string, view = "front"): string =>
  `/images/vehicles/library/${slug}/${view}.webp`;

export const PREMIUM_IMAGES = {
  hero: {
    /**
     * Cape Town at blue hour — Twelve Apostles, the coastal road, and the vehicle's own tail-light
     * signature as the brightest element in frame. This is the composition the Experience Bible
     * specifies for night photography (docs/experience-bible/03-photography.md §3).
     *
     * It replaces surf4cars-premium-hero-v3.webp, which had the legacy blue wordmark and two
     * taglines burned into the pixels. Baked-in text cannot scale, translate, or meet contrast
     * requirements, and it was the single strongest reason the homepage still read as the old
     * product. The old asset is retained on disk but must not be used as a hero.
     */
    homepage: curated("hero", "/images/hero/hero-homepage-main.webp"),
  },
  sections: {
    dealerGrowth: "/images/sections/dealer-growth-main.webp",
    aiIntelligence: "/images/sections/ai-intelligence-main.webp",
    vehicleSearch: "/images/sections/vehicle-search-bg.webp",
    featuredCollections: "/images/sections/featured-collections-bg.webp",
    /**
     * The full-bleed plate behind the buyer editorial section. Its brief is judged on quiet area
     * rather than subject — the copy holds the left third, so the frame has to stay low-contrast
     * there without a scrim heavy enough to turn the photograph to mud.
     */
    whyBuyers: curated("editorial-buyers", "/images/sections/vehicle-search-bg.webp"),
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
    profile: curated("dealer-cover", "/images/dealers/dealer-profile-hero.webp"),
    join: "/images/dealers/join-dealer-hero.webp",
  },
  ai: {
    valuation: "/images/ai/ai-vehicle-valuation-hero.webp",
    inspection: "/images/ai/vehicle-inspection-hero.webp",
  },
  /**
   * One curated frame per body style. Each is its own brief on the creative review board, and each
   * falls back to a real car of that kind until the brief has been decided — so the band is never
   * illustrated by the same photograph twice, and approving a candidate is the whole of the change.
   *
   * `commercial` has no brief yet on purpose: panel vans are not part of the premium story the
   * marketplace leads with. The id resolves through the library anyway, so adding a brief later is
   * the only step needed to bring it into review.
   */
  categories: {
    default: curated("suv", CATEGORY_PLACEHOLDER),
    /** Fortuner, 1.70 — white, open light, no stand and no crowd. The cleanest SUV in the library. */
    suv: curated("suv", libraryCar("toyota-fortuner")),
    /** Swift, 1.76 — a small car photographed as a car, rather than parked against a hedge. */
    hatchback: curated("hatchback", libraryCar("suzuki-swift")),
    /** 320i, 1.66 — restrained, evening light, correct shape for the category. */
    sedan: curated("sedan", libraryCar("bmw-320i")),
    /** Ranger, 1.50 — crossing a river with forest behind it. The only genuinely on-brief frame in
        the library: utility and adventure in one shot, which is exactly the bakkie brief. */
    bakkie: curated("bakkie", libraryCar("ford-ranger")),
    /** F-Pace, 1.81 — the most composed premium marque frame available. */
    luxury: curated("luxury", libraryCar("jaguar-f-pace")),
    /** No electric vehicle exists in the library at all, so this category cannot be illustrated
        honestly until it is reviewed. The placeholder is 1.78 and crops safely. */
    ev: curated("ev", CATEGORY_PLACEHOLDER),
    /** A silver racer mid-corner on a circuit, 1.50. Filed under the C-Class in the library, but the
        frame is a race car on a track — motion and circuit, which is the performance brief. */
    performance: curated("performance", libraryCar("mercedes-benz-c-class")),
    /** V-Class, 1.62 — the library holds exactly one people carrier. */
    mpv: curated("mpv", libraryCar("mercedes-benz-v-class")),
    convertible: curated("convertible", CATEGORY_PLACEHOLDER),
    /** Caddy, 1.50 — a working van on a street, which is the whole of the commercial promise. */
    commercial: curated("commercial", libraryCar("volkswagen-caddy")),
  },
  /** Photographic plate for promotional banners. SURF typography is composed over it. */
  promotions: {
    banner: curated("promo-banner", "/images/sections/featured-collections-bg.webp"),
  },
  /**
   * Slots introduced by PCP-005B that the repository cannot stand in for. Each is null until its
   * brief has been through review; every consumer must handle that.
   */
  identity: {
    lifestyle: curatedOrNone("lifestyle"),
    capeTown: curatedOrNone("cape-town"),
    showroom: curatedOrNone("showroom"),
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
