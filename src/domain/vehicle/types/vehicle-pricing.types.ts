export interface VehiclePriceHistoryEntry {
  readonly date: string;
  readonly priceCents: number;
  readonly priceDisplay: string;
  readonly reason?: string;
}

export interface VehiclePricingData {
  readonly sellingPriceCents: number;
  readonly sellingPriceDisplay: string;
  readonly previousPriceCents?: number;
  readonly reducedPrice: boolean;
  readonly financeEstimateDisplay: string;
  readonly monthlyRepaymentDisplay: string;
  readonly interestRatePercent?: number;
  readonly termMonths?: number;
  readonly depositCents?: number;
  readonly currency: "ZAR";
  readonly priceHistory: readonly VehiclePriceHistoryEntry[];
}
