/**
 * SURF FOR CARS — Classic Search Filter Definitions
 * UI framework only — no search logic connected.
 */

export type ClassicFilterId =
  | "make"
  | "model"
  | "variant"
  | "year"
  | "province"
  | "city"
  | "price"
  | "mileage"
  | "fuel"
  | "transmission"
  | "body-type"
  | "colour"
  | "condition"
  | "dealer"
  | "drive-type"
  | "engine-size";

export interface ClassicFilterDefinition {
  readonly id: ClassicFilterId;
  readonly label: string;
  readonly placeholder: string;
  readonly group: "vehicle" | "location" | "pricing" | "specs" | "dealer";
}

export const CLASSIC_SEARCH_FILTERS: readonly ClassicFilterDefinition[] = [
  { id: "make", label: "Make", placeholder: "Any make", group: "vehicle" },
  { id: "model", label: "Model", placeholder: "Any model", group: "vehicle" },
  { id: "variant", label: "Variant", placeholder: "Any variant", group: "vehicle" },
  { id: "year", label: "Year", placeholder: "Any year", group: "vehicle" },
  { id: "province", label: "Province", placeholder: "Any province", group: "location" },
  { id: "city", label: "City", placeholder: "Any city", group: "location" },
  { id: "price", label: "Price", placeholder: "Any price", group: "pricing" },
  { id: "mileage", label: "Mileage", placeholder: "Any mileage", group: "pricing" },
  { id: "fuel", label: "Fuel", placeholder: "Any fuel type", group: "specs" },
  { id: "transmission", label: "Transmission", placeholder: "Any transmission", group: "specs" },
  { id: "body-type", label: "Body Type", placeholder: "Any body type", group: "specs" },
  { id: "colour", label: "Colour", placeholder: "Any colour", group: "specs" },
  { id: "condition", label: "Condition", placeholder: "Any condition", group: "specs" },
  { id: "dealer", label: "Dealer", placeholder: "Any dealer", group: "dealer" },
  { id: "drive-type", label: "Drive Type", placeholder: "Any drive type", group: "specs" },
  { id: "engine-size", label: "Engine Size", placeholder: "Any engine size", group: "specs" },
] as const;

export const CLASSIC_FILTER_GROUPS = {
  vehicle: CLASSIC_SEARCH_FILTERS.filter((f) => f.group === "vehicle"),
  location: CLASSIC_SEARCH_FILTERS.filter((f) => f.group === "location"),
  pricing: CLASSIC_SEARCH_FILTERS.filter((f) => f.group === "pricing"),
  specs: CLASSIC_SEARCH_FILTERS.filter((f) => f.group === "specs"),
  dealer: CLASSIC_SEARCH_FILTERS.filter((f) => f.group === "dealer"),
} as const;
