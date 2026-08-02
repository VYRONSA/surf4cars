/**
 * The canonical URL slug.
 *
 * Extracted from `vehicle-engine/vehicle-record.mapper` so that anything needing to *link* to a record can
 * do so without importing the vehicle domain. That mapper pulls in domain constants and the premium image
 * catalogue, which made it unusable from the quality engine's pure core and from plain Node scripts.
 *
 * There must be exactly one of these. A second copy is how a report ends up linking to pages that do not
 * exist — the Founder-facing data quality report shipped 76 dealer links that all 404'd for precisely that
 * class of reason.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Marketplace slug for a vehicle listing.
 *
 * The descriptive part alone is not unique, so a truncated id keeps it readable while making it a genuine
 * one-to-one key. Anything linking to a listing must call this rather than assemble its own — the Quality
 * Centre's first build did assemble its own and produced URLs that all 404'd.
 *
 * THE DISCRIMINATOR WAS EIGHT CHARACTERS, AND EIGHT WAS NOT ENOUGH
 * ===============================================================
 * This function's own note used to give `s1-veh-0141` → `s1-veh-0` as an illustration of the truncation,
 * without following the consequence: 191 of the 229 published vehicles carry ids of exactly that shape, so
 * every one of them truncated to the same eight characters. Measured before the fix: **29 colliding slugs,
 * 34 vehicles shadowed**.
 *
 * A shadowed listing is not merely unreachable. The detail route resolves by slug and takes the first
 * match, so a buyer clicking the fourth Hilux was shown the first one — a different price, a different
 * odometer, a different car — with no indication anything had gone wrong.
 *
 * Twelve characters removes every collision in the current corpus and keeps UUID-style ids distinct too.
 * Re-measure if the id scheme changes; the cost of being wrong here is silent and it is paid by the buyer.
 */
export function buildVehicleSlug(descriptor: string, vehicleId: string): string {
  const base = slugify(descriptor);
  const discriminator = slugify(vehicleId).slice(0, 12);
  if (!base) return discriminator || vehicleId;
  return discriminator ? `${base}-${discriminator}` : base;
}
