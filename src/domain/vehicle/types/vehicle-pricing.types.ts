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
  /*
    Null until a finance partner supplies a rate.
    ============================================
    These carried "from R X p/m", computed as price / 72 * 1.18 — a multiplier that corresponds to
    no interest rate, over a term nobody stated, for a product no lender had agreed to. Nullable so
    the surfaces have to handle absence rather than print whatever arrives.
  */
  readonly financeEstimateDisplay: string | null;
  readonly monthlyRepaymentDisplay: string | null;
  readonly interestRatePercent?: number;
  readonly termMonths?: number;
  readonly depositCents?: number;
  readonly currency: "ZAR";
  readonly priceHistory: readonly VehiclePriceHistoryEntry[];
}
