/**
 * How a missing specification is shown.
 *
 * WHY THIS IS A CONSTANT AND NOT A DEFAULT
 * ========================================
 * The platform used to fill gaps at the source: `fuel ?? "Petrol"`, `transmission ?? "Automatic"`,
 * `bodyType ?? "SUV"`. Three published vehicles reached the marketplace with a gearbox and a fuel
 * type they had never been given, and one of them — body type — was also a filter, so a buyer could
 * search "SUV" and be shown a car nobody had ever described as one.
 *
 * The fix is to leave the data empty and decide at the point of display, which is the only place
 * that knows whether "we do not know" is worth a line of its own. That decision now looks the same
 * everywhere because it is made here.
 *
 * "Not specified" rather than "Unknown" or "—": it says who is missing the information without
 * implying the vehicle lacks the feature. A car whose fuel type reads "Unknown" sounds broken; one
 * that reads "Not specified" sounds like a listing that needs finishing, which is exactly what it is.
 */
export const NOT_SPECIFIED = "Not specified";

/** Renders a value, or the standard absence marker. Trims, so a whitespace value counts as absent. */
export function orNotSpecified(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : NOT_SPECIFIED;
}

/** True when a value is worth rendering at all — for places that omit rather than mark. */
export function hasValue(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}
