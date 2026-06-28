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
  readonly financeEstimate: string;
  readonly aiMatchScore: number;
  readonly imageSrc: string;
  readonly imagePosition: string;
  readonly featured?: boolean;
  readonly reducedPrice?: boolean;
  readonly verified?: boolean;
}

/** Marketplace search listings — projected from the Unified Vehicle Intelligence Engine. */
export const SHOWCASE_VEHICLE_LISTINGS: readonly ShowcaseVehicleListing[] = searchShowcaseListingsSync();

export const HOME_SHOWCASE_LISTINGS = SHOWCASE_VEHICLE_LISTINGS.slice(0, 3);
