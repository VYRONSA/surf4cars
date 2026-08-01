import type { SearchQueryState } from "@/features/search/utils/search-query";

/**
 * The catalogue headline.
 *
 * A search results page needs to say what a buyer is looking at, and "Search Vehicles" — the SEO
 * title — is not that sentence. It is written for a results snippet, where the subject has to be
 * restated because the reader has not arrived yet. On the page itself the reader has arrived, so the
 * heading names the collection ("Diesel double cabs", "Toyota in Western Cape") and the count sits
 * underneath as a caption.
 *
 * Kept separate from `resolveSearchSeoMetadata` deliberately: they read the same `SearchQueryState`
 * but answer different questions, and folding the two together would mean every future change to a
 * page heading reasoning about how it looks in Google. Neither derives its facts independently —
 * both take the parsed state as given, which is the part that must not fork.
 */

/** Adjectives that read naturally in front of a body type: "Diesel double cabs". */
function describePrefix(state: SearchQueryState): string | undefined {
  const parts = [state.fuel, state.transmission].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

/**
 * Pluralise a body type without touching its case.
 *
 * It used to lowercase first, so the heading for `?bodyType=SUV` read "Suvs" — the sentence-casing
 * step below then capitalised the S and left the rest. Body types are dealer-entered values and some
 * of them are acronyms; whatever case a value arrives in is the case it should keep.
 */
function pluralise(bodyType: string): string {
  const trimmed = bodyType.trim();
  const lower = trimmed.toLowerCase();
  if (lower.endsWith("s")) return trimmed;
  if (lower.endsWith("ch") || lower.endsWith("sh") || lower.endsWith("x")) return `${trimmed}es`;
  return `${trimmed}s`;
}

export interface SearchHeading {
  readonly heading: string;
  readonly subheading?: string;
  /**
   * Whether the heading names something the buyer asked for.
   *
   * The empty state says the subject back — "Nothing matching Diesel SUVs today" — which only reads
   * correctly when there *is* a subject. Without this flag the unfiltered case produces "Nothing
   * matching Every vehicle today", which is both nonsense and, if the marketplace really were empty,
   * the wrong thing to say.
   */
  readonly isFiltered: boolean;
}

export function buildSearchHeading(state: SearchQueryState): SearchHeading {
  /* A free-text query is the buyer's own words. Echoing them back is the only honest heading —
     anything composed would claim to have understood more than the search actually did. */
  if (state.query) {
    return {
      heading: `“${state.query}”`,
      subheading: "Vehicles matching your search, newest listings first.",
      isFiltered: true,
    };
  }

  const marque = [state.make, state.model].filter(Boolean).join(" ");
  const prefix = describePrefix(state);
  const body = state.bodyType ? pluralise(state.bodyType) : undefined;
  const place = state.province ?? state.city;

  const subject = [prefix, marque, body].filter(Boolean).join(" ").trim();

  if (!subject && !place) {
    return {
      heading: "Every vehicle",
      subheading:
        "The full marketplace — every listing from every registered dealership on SURF4CARS.",
      isFiltered: false,
    };
  }

  const heading = [subject || "Vehicles", place ? `in ${place}` : null]
    .filter(Boolean)
    .join(" ");

  /* Only the first character is touched. A heading composed from database values arrives in whatever
     case the dealer typed, and "diesel Toyota Hilux double cabs" is not a headline — but anything
     stronger would flatten "SUV" and "GT-Line" on the way past. */
  return {
    heading: heading.charAt(0).toUpperCase() + heading.slice(1),
    subheading: "Every listing published by a registered dealership.",
    isFiltered: true,
  };
}
