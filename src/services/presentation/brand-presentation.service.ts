import { resolveMarqueIdentity, type MarqueIdentity } from "./marque-identity.service";

/**
 * SURF FOR CARS — marque presentation.
 *
 * Which manufacturers the platform offers as navigation, and in what order.
 *
 * This lived inside the homepage's brand rail component, which meant any other surface wanting a marque
 * list — the marketplace's filters, a future brand landing page, the dealer microsite — would have had to
 * import a homepage component or reinvent the ordering. Neither is acceptable under one platform standard.
 */

export interface BrandPresentation {
  readonly name: string;
  /** Live count of marketplace-visible stock for this marque. */
  readonly count: number;
  /**
   * How this marque should be represented — licensed logo, supplied wordmark, the marque's own published
   * typographic style, or the strip default. Resolved per marque, best available wins.
   *
   * See `marque-identity.service.ts`. Deliberately not a nullable `logoSrc`: manufacturers do not all
   * publish the same asset type, and a boolean "logo or not" forces every brand without an SVG into the
   * same undifferentiated fallback.
   */
  readonly identity: MarqueIdentity;
}

/**
 * Presentation order, when stock allows it.
 *
 * Not alphabetical and not purely by volume — this is the order the South African market reads in, premium
 * marques first, then the volume brands that actually move. Sorting by stock depth alone would open the
 * rail on whichever marque the dealer network happens to be long on this week.
 */
const MARQUE_ORDER = [
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Porsche",
  "Volvo",
  "Jaguar",
  "Lexus",
  "Toyota",
  "Volkswagen",
  "Ford",
  "Hyundai",
  "Kia",
  "Nissan",
  "Isuzu",
  "Mazda",
  "Suzuki",
  "Peugeot",
  "Renault",
  "Mitsubishi",
  "Honda",
  "Mahindra",
] as const;

const rank = (name: string): number => {
  const index = MARQUE_ORDER.indexOf(name as (typeof MARQUE_ORDER)[number]);
  return index === -1 ? MARQUE_ORDER.length : index;
};

export interface SelectBrandsOptions {
  readonly limit?: number;
  /**
   * Marques with fewer vehicles than this are not offered.
   *
   * A marque tile is a promise of somewhere worth going. One car behind a manufacturer's name is a
   * technically true, practically empty destination, and the buyer who clicks it learns the platform is
   * thin — which is exactly the impression a marque wall is there to prevent.
   */
  readonly minimumStock?: number;
  /**
   * Restrict the list to marques we can show as actual artwork.
   *
   * A marque *wall* and a marque *list* are different things. A filter list is text by nature, and setting
   * "Mercedes-Benz" in the marque's own typographic style there is correct. A wall of logos is not: nine
   * coloured marks with three orphan words between them reads as three missing images, not as three brands.
   * The words draw attention to the gap rather than filling it.
   *
   * So the wall takes only tiers 1 and 2 — licensed logos and manufacturer-supplied wordmarks. Marques
   * without artwork are not hidden from the platform; they are reached through the rail's "All" link and
   * are fully present in search. The moment artwork lands for one of them it appears here automatically,
   * because this filters on what `resolveMarqueIdentity` returns rather than on a separate list to maintain.
   */
  readonly artworkOnly?: boolean;
}

/** Ranks live stock into a marque list: known marques in market order, then anything else by depth. */
export function selectBrands(
  countsByMake: Readonly<Record<string, number>>,
  { limit = 12, minimumStock = 2, artworkOnly = false }: SelectBrandsOptions = {},
): readonly BrandPresentation[] {
  return Object.entries(countsByMake)
    .filter(([, count]) => count >= minimumStock)
    .map(([name, count]) => ({ name, count, identity: resolveMarqueIdentity(name) }))
    .filter(({ identity }) => !artworkOnly || identity.src !== null)
    .sort((a, b) => rank(a.name) - rank(b.name) || b.count - a.count)
    .slice(0, limit);
}
