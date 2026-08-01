import type { VehicleStatus } from "@/domain/vehicle/constants/vehicle-status.constants";
import type { DealerVerificationStatus } from "./dealer-verification.types";

export interface VehicleDealerData {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly dealershipSlug: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly stockNumber: string;
  readonly purchasePriceCents?: number;
  readonly sellingPriceCents: number;
  readonly costCents?: number;
  readonly profitCents?: number;
  readonly status: VehicleStatus;
  readonly dateAdded: string;
  readonly dateSold?: string;
  readonly location: string;
  readonly province: string;
  readonly dealerNotes?: string;
  /*
    Everything below was a hardcoded literal until PCP-032.
    ======================================================
    `verified: true`, `rating: 4.8`, `reviewCount: 24`, `responseTime: "within 15 minutes"` and
    `yearsInBusiness: 8` were set identically for all 128 dealerships, and `phone`/`whatsapp` fell
    back to the string "+27" — which every dealership on the platform hit, because not one of them
    has a telephone number on record.

    The nullability is the fix. A `string` phone field forces the mapper to invent one; a
    `string | null` lets it say there isn't one, and forces every consumer to decide what to show
    when there is nothing — which is the decision that was being made silently and wrongly.
  */
  readonly verificationStatus: DealerVerificationStatus;
  /** Mean review score. Null until a review exists — there is no reviews table yet. */
  readonly rating: number | null;
  /** Count of real reviews. Zero is a fact; it is not the same as unknown. */
  readonly reviewCount: number;
  /** Measured median first response. Null until enquiry response times are recorded. */
  readonly responseTime: string | null;
  /** Derived from a trading-since date. Null until one is captured at onboarding. */
  readonly yearsInBusiness: number | null;
  /** Counted from live published stock — real, and the one figure here that always was. */
  readonly vehiclesInStock: number;
  readonly phone: string | null;
  readonly whatsapp: string | null;
  readonly logoInitials: string;
}
