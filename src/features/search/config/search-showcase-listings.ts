import { searchShowcaseListingsSync } from "@/services/vehicle-engine";

export interface ShowcaseVehicleListing {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly price: string;
  readonly year: number;
  readonly mileage: string;
  readonly fuel: string;
  readonly transmission: string;
  readonly dealer: string;
  readonly location: string;
  /** Null until a finance partner supplies a rate — see vehicle-platform.repository.ts. */
  readonly financeEstimate?: string;
  readonly aiMatchScore: number;
  readonly imageSrc: string;
  readonly imagePosition: string;
  /**
   * Body style, marque, model, designation and numeric price — carried for editorial curation rather
   * than for display.
   *
   * `price` above is a formatted string for the card; `priceCents` is the same figure as a number,
   * because merchandising compares vehicles against the marketplace's own price distribution and
   * cannot do arithmetic on "R 1 480 000". Parsing the display string back into a number was the
   * alternative, and a formatting change would have silently broken the ranking.
   */
  readonly bodyType?: string;
  readonly make?: string;
  readonly model?: string;
  readonly variant?: string | null;
  readonly priceCents?: number;
  readonly featured?: boolean;
  readonly reducedPrice?: boolean;
  readonly verified?: boolean;
}

/**
 * Marketplace search listings — projected from the Unified Vehicle Intelligence Engine.
 *
 * Lead photography is curated at projection time by `resolvePrimaryImageUrl`, so an unpresentable frame
 * is never served here — the vehicle keeps its place, the photograph is replaced.
 */
export const SHOWCASE_VEHICLE_LISTINGS: readonly ShowcaseVehicleListing[] = searchShowcaseListingsSync();

export const HOME_SHOWCASE_LISTINGS = SHOWCASE_VEHICLE_LISTINGS.slice(0, 3);
