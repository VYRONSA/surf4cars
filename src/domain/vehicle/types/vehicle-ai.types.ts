export type VehicleHealthLevel = "excellent" | "good" | "needs-attention" | "critical";

export type VehicleAiRating = "Strong" | "Fair" | "Weak" | "Critical";

export interface VehicleAiScores {
  readonly listingScore: number;
  readonly photoScore: number;
  readonly descriptionScore: number;
  readonly priceScore: number;
  readonly demandScore: number;
  readonly marketPosition: string;
  readonly predictedSaleDays?: number;
  readonly recommendedPriceCents?: number;
  readonly recommendedPriceDisplay?: string;
  readonly recommendedImprovements: readonly string[];
  readonly aiRating: VehicleAiRating;
  readonly health: VehicleHealthLevel;
  readonly aiMatchScore: number;
}

export interface VehicleAiInsightEntry {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly score?: number;
  readonly tone?: "positive" | "neutral" | "accent";
}

export interface VehicleAiData {
  readonly scores: VehicleAiScores;
  readonly insights: readonly VehicleAiInsightEntry[];
  readonly lastAnalysedAt?: string;
}
