import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  buildVehicleBreadcrumbStructuredData,
  buildVehicleStructuredData,
  resolveVehicleNotFoundSeo,
  resolveVehicleSeoMetadata,
  VehicleDetailPage,
} from "@/features/vehicle";
import { loadMarketInsight } from "@/features/vehicle/server/market-insight";
import { loadVehicleIntelligence } from "@/features/vehicle/server/vehicle-intelligence";
import { loadVehicleEquipment } from "@/services/equipment";
import { getVehicleEngine } from "@/services/vehicle-engine";

interface VehicleDetailRouteProps {
  readonly params: Promise<{ slug: string }>;
}

/**
 * Listing availability changes the moment a dealer publishes, unpublishes, archives or deletes.
 * Prerendering this route served unpublished stock from cache — including a soft-404 body cached
 * under a 200 — so marketplace detail pages resolve per request instead.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: VehicleDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleEngine().getVehicleDetailBySlug(slug);

  if (!vehicle) {
    const notFoundSeo = resolveVehicleNotFoundSeo();
    return {
      title: notFoundSeo.title,
      description: notFoundSeo.description,
      alternates: { canonical: notFoundSeo.canonicalPath },
      robots: { index: false, follow: false },
    };
  }

  const seo = resolveVehicleSeoMetadata(vehicle);

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonicalPath },
    robots: { index: seo.indexable, follow: seo.indexable },
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
      url: seo.canonicalPath,
      siteName: "SURF FOR CARS",
      ...(seo.imageUrl
        ? { images: [{ url: seo.imageUrl, alt: vehicle.title }] }
        : {}),
    },
    twitter: {
      card: seo.imageUrl ? "summary_large_image" : "summary",
      title: seo.title,
      description: seo.description,
      ...(seo.imageUrl ? { images: [seo.imageUrl] } : {}),
    },
  };
}

export default async function VehicleDetailRoute({ params }: VehicleDetailRouteProps) {
  const { slug } = await params;
  const vehicle = await getVehicleEngine().getVehicleDetailBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  /**
   * Computed against live comparable stock, and returning null rather than guessing when fewer than four
   * comparable vehicles exist. Awaited here rather than streamed because the module sits above the fold on
   * a short page and a late-arriving price comparison would shift the layout under the reader.
   */
  /* Both are enhancements: each degrades to an honest empty state rather than failing the page. */
  const [marketInsight, equipment] = await Promise.all([
    loadMarketInsight(vehicle),
    loadVehicleEquipment(vehicle.id),
  ]);

  /* Intelligence needs the equipment count, so it runs after rather than beside. One extra pass over
     an already-cached corpus; the alternative is threading the count through a second read path. */
  const intelligence = await loadVehicleIntelligence({
    id: vehicle.id,
    priceNumeric: vehicle.priceNumeric,
    equipmentCount: equipment.length,
  });

  return (
    <>
      <script
        type="application/ld+json"
        data-testid="vehicle-structured-data"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildVehicleStructuredData(vehicle)) }}
      />
      <script
        type="application/ld+json"
        data-testid="vehicle-breadcrumb-structured-data"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildVehicleBreadcrumbStructuredData(vehicle)) }}
      />
      <VehicleDetailPage
        vehicle={vehicle}
        marketInsight={marketInsight}
        equipment={equipment}
        intelligence={intelligence}
      />
    </>
  );
}
