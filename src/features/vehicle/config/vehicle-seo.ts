import { env } from "@/config/env";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";

export interface VehicleSeoMetadata {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath: string;
  readonly indexable: boolean;
  readonly imageUrl?: string;
}

function toAbsoluteUrl(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${env.appUrl.replace(/\/$/, "")}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function resolveVehicleSeoMetadata(vehicle: VehicleDetail): VehicleSeoMetadata {
  return {
    title: `${vehicle.title} for Sale`,
    description: `${vehicle.title} — ${vehicle.price}. ${vehicle.mileage}, ${vehicle.fuel}, ${vehicle.transmission}. ${vehicle.location}. View on SURF FOR CARS.`,
    canonicalPath: `/vehicle/${vehicle.slug}`,
    indexable: true,
    imageUrl: toAbsoluteUrl(vehicle.gallery[0]?.src),
  };
}

/**
 * schema.org Vehicle + Offer payload for the listing detail page. Search engines use this to
 * render vehicle rich results; without it a marketplace listing is indexed as plain prose.
 */
export function buildVehicleStructuredData(vehicle: VehicleDetail): Record<string, unknown> {
  const seo = resolveVehicleSeoMetadata(vehicle);
  const canonicalUrl = toAbsoluteUrl(seo.canonicalPath);

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: vehicle.title,
    description: seo.description,
    url: canonicalUrl,
    vehicleIdentificationNumber: vehicle.vin || undefined,
    sku: vehicle.stockNumber || undefined,
    modelDate: String(vehicle.year),
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuel,
    color: vehicle.colour,
    bodyType: vehicle.bodyType,
    vehicleEngine: vehicle.engine ? { "@type": "EngineSpecification", name: vehicle.engine } : undefined,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: Number(String(vehicle.mileage).replace(/[^0-9]/g, "")) || 0,
      unitCode: "KMT",
    },
    image: seo.imageUrl ? [seo.imageUrl] : undefined,
    offers: {
      "@type": "Offer",
      price: vehicle.priceNumeric,
      priceCurrency: "ZAR",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
      seller: {
        "@type": "AutoDealer",
        name: vehicle.dealer.name,
        telephone: vehicle.dealer.phone,
        address: {
          "@type": "PostalAddress",
          addressLocality: vehicle.location,
          addressRegion: vehicle.province,
          addressCountry: "ZA",
        },
      },
    },
  };
}

/** BreadcrumbList mirroring the on-page breadcrumb trail. */
export function buildVehicleBreadcrumbStructuredData(vehicle: VehicleDetail): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: toAbsoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Search", item: toAbsoluteUrl("/search") },
      { "@type": "ListItem", position: 3, name: vehicle.title, item: toAbsoluteUrl(`/vehicle/${vehicle.slug}`) },
    ],
  };
}

export function resolveVehicleNotFoundSeo(): VehicleSeoMetadata {
  return {
    title: "Vehicle Not Found",
    description: "This vehicle listing is no longer available on SURF FOR CARS.",
    canonicalPath: "/search",
    indexable: false,
  };
}
