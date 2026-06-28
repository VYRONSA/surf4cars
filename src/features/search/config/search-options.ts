export interface QuickFilterDefinition {
  readonly id: string;
  readonly label: string;
}

export const QUICK_FILTERS: readonly QuickFilterDefinition[] = [
  { id: "recently-added", label: "Recently Added" },
  { id: "price-reduced", label: "Price Reduced" },
  { id: "luxury", label: "Luxury" },
  { id: "electric", label: "Electric" },
  { id: "suv", label: "SUV" },
  { id: "bakkie", label: "Bakkie" },
  { id: "family", label: "Family" },
  { id: "commercial", label: "Commercial" },
  { id: "performance", label: "Performance" },
  { id: "popular", label: "Popular" },
] as const;

export interface ExampleSearchQuery {
  readonly id: string;
  readonly query: string;
}

export const EXAMPLE_SEARCH_QUERIES: readonly ExampleSearchQuery[] = [
  { id: "family-suv", query: "I need a reliable family SUV." },
  { id: "double-cab", query: "Show me double cabs under R500 000." },
  { id: "hatchback", query: "I need a fuel efficient hatchback." },
  { id: "first-car", query: "Best first car." },
] as const;

export const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "newest", label: "Newest First" },
  { id: "mileage", label: "Lowest Mileage" },
  { id: "distance", label: "Nearest" },
] as const;

export type SearchViewMode = "grid" | "list" | "map";
export type SearchMode = "intelligent" | "classic";
