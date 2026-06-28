export type VehicleCondition = "new" | "used" | "demo" | "certified-pre-owned";

export type DriveType = "fwd" | "rwd" | "awd" | "4wd";

export interface VehicleSpecificationEntry {
  readonly label: string;
  readonly value: string;
}

export interface VehicleSpecGroup {
  readonly id: string;
  readonly title: string;
  readonly specs: readonly VehicleSpecificationEntry[];
}

export interface VehicleFeatureEntry {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

export interface VehicleCore {
  readonly vin: string;
  readonly registration?: string;
  readonly make: string;
  readonly model: string;
  readonly variant: string;
  readonly year: number;
  readonly mileageKm: number;
  readonly mileageDisplay: string;
  readonly transmission: string;
  readonly fuel: string;
  readonly bodyType: string;
  readonly engine: string;
  readonly powerKw?: number;
  readonly powerDisplay?: string;
  readonly torqueNm?: number;
  readonly torqueDisplay?: string;
  readonly colour: string;
  readonly doors?: number;
  readonly seats?: number;
  readonly driveType?: DriveType;
  readonly condition: VehicleCondition;
  readonly title: string;
  readonly subtitle: string;
  readonly description: readonly {
    readonly heading?: string;
    readonly paragraphs: readonly string[];
  }[];
  readonly specifications: readonly VehicleSpecGroup[];
  readonly features: readonly VehicleFeatureEntry[];
  readonly warranty?: string;
  readonly servicePlan?: string;
  readonly roadworthy: boolean;
  readonly financeAvailable: boolean;
  readonly nationwideDelivery: boolean;
  readonly inspectionStatus: "passed" | "pending" | "not-required" | "failed";
}
