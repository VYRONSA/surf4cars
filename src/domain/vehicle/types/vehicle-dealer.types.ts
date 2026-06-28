import type { VehicleStatus } from "@/domain/vehicle/constants/vehicle-status.constants";

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
  readonly verified: boolean;
  readonly rating: number;
  readonly reviewCount: number;
  readonly responseTime: string;
  readonly yearsInBusiness: number;
  readonly vehiclesInStock: number;
  readonly phone: string;
  readonly whatsapp: string;
  readonly logoInitials: string;
}
