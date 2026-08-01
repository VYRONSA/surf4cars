import type { Metadata } from "next";

import { resolveSearchSeoMetadata } from "@/features/search/config";
import { SearchPage } from "@/features/search";
import { parseSearchState } from "@/features/search/utils/search-query";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> | undefined;

export async function generateMetadata({ searchParams }: { readonly searchParams?: SearchParamsInput }): Promise<Metadata> {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const searchState = parseSearchState(resolvedSearchParams);
  const seo = resolveSearchSeoMetadata({
    make: searchState.make,
    model: searchState.model,
    province: searchState.province,
    bodyType: searchState.bodyType,
    fuel: searchState.fuel,
  });

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonicalPath,
    },
    robots: {
      index: seo.indexable,
      follow: seo.indexable,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
    },
  };
}

export default async function VehicleSearchPage({ searchParams }: { readonly searchParams?: SearchParamsInput }) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  return <SearchPage searchParams={resolvedSearchParams} />;
}
