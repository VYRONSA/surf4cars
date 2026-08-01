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
 * one-to-one key. The truncation is the part worth knowing about: `s1-veh-0141` becomes `s1-veh-0`, so a
 * slug cannot be rebuilt by concatenating the title and the full id. Anything linking to a listing must call
 * this rather than assemble its own — the Quality Centre's first build did assemble its own and produced
 * URLs that all 404'd.
 */
export function buildVehicleSlug(descriptor: string, vehicleId: string): string {
  const base = slugify(descriptor);
  const discriminator = slugify(vehicleId).slice(0, 8);
  if (!base) return discriminator || vehicleId;
  return discriminator ? `${base}-${discriminator}` : base;
}
