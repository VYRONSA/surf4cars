/**
 * SURF FOR CARS — Public Search Field Definitions
 * Framework only — no search logic connected.
 */

export type SearchFieldType =
  | "natural-language"
  | "make"
  | "model"
  | "year"
  | "province"
  | "city"
  | "fuel"
  | "transmission"
  | "body-type"
  | "price"
  | "mileage";

export interface SearchFieldDefinition {
  readonly id: SearchFieldType;
  readonly label: string;
  readonly placeholder: string;
  readonly group: "primary" | "location" | "specs" | "advanced";
}

export const PUBLIC_SEARCH_FIELDS: readonly SearchFieldDefinition[] = [
  {
    id: "natural-language",
    label: "Search",
    placeholder: "Describe what you're looking for…",
    group: "primary",
  },
  {
    id: "make",
    label: "Make",
    placeholder: "Any make",
    group: "primary",
  },
  {
    id: "model",
    label: "Model",
    placeholder: "Any model",
    group: "primary",
  },
  {
    id: "year",
    label: "Year",
    placeholder: "Any year",
    group: "primary",
  },
  {
    id: "province",
    label: "Province",
    placeholder: "Any province",
    group: "location",
  },
  {
    id: "city",
    label: "City",
    placeholder: "Any city",
    group: "location",
  },
  {
    id: "fuel",
    label: "Fuel",
    placeholder: "Any fuel type",
    group: "specs",
  },
  {
    id: "transmission",
    label: "Transmission",
    placeholder: "Any transmission",
    group: "specs",
  },
  {
    id: "body-type",
    label: "Body Type",
    placeholder: "Any body type",
    group: "specs",
  },
  {
    id: "price",
    label: "Price",
    placeholder: "Any price",
    group: "advanced",
  },
  {
    id: "mileage",
    label: "Mileage",
    placeholder: "Any mileage",
    group: "advanced",
  },
] as const;

export const PUBLIC_SEARCH_FIELD_GROUPS = {
  primary: PUBLIC_SEARCH_FIELDS.filter((f) => f.group === "primary"),
  location: PUBLIC_SEARCH_FIELDS.filter((f) => f.group === "location"),
  specs: PUBLIC_SEARCH_FIELDS.filter((f) => f.group === "specs"),
  advanced: PUBLIC_SEARCH_FIELDS.filter((f) => f.group === "advanced"),
} as const;
