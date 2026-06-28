/**
 * SURF FOR CARS — Search SEO Architecture
 * Framework for future indexable search pages. No content implemented yet.
 */

export interface SearchSeoParams {
  readonly make?: string;
  readonly model?: string;
  readonly province?: string;
  readonly bodyType?: string;
  readonly fuel?: string;
  readonly page?: number;
}

export interface SearchSeoMetadata {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath: string;
  readonly indexable: boolean;
}

const BASE_SEARCH_PATH = "/search";

export function buildSearchCanonicalPath(params?: SearchSeoParams): string {
  if (!params) return BASE_SEARCH_PATH;

  const searchParams = new URLSearchParams();

  if (params.make) searchParams.set("make", params.make);
  if (params.model) searchParams.set("model", params.model);
  if (params.province) searchParams.set("province", params.province);
  if (params.bodyType) searchParams.set("body", params.bodyType);
  if (params.fuel) searchParams.set("fuel", params.fuel);
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));

  const query = searchParams.toString();
  return query ? `${BASE_SEARCH_PATH}?${query}` : BASE_SEARCH_PATH;
}

export function resolveSearchSeoMetadata(params?: SearchSeoParams): SearchSeoMetadata {
  const canonicalPath = buildSearchCanonicalPath(params);
  const hasFilters = Boolean(
    params?.make ?? params?.model ?? params?.province ?? params?.bodyType ?? params?.fuel,
  );

  if (!hasFilters) {
    return {
      title: "Search Vehicles",
      description:
        "Discover your next vehicle with intelligent search — natural language and precision filters built for South Africa.",
      canonicalPath,
      indexable: true,
    };
  }

  const parts = [params?.make, params?.model, params?.province].filter(Boolean);
  const label = parts.length > 0 ? parts.join(" ") : "Vehicles";

  return {
    title: `${label} for Sale`,
    description: `Search ${label.toLowerCase()} across South Africa on SURF FOR CARS.`,
    canonicalPath,
    indexable: true,
  };
}
