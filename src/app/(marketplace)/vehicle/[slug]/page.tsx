import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getAllVehicleSlugs,
  getVehicleBySlug,
  resolveVehicleSeoMetadata,
  VehicleDetailPage,
} from "@/features/vehicle";

interface VehicleDetailRouteProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllVehicleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: VehicleDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);

  if (!vehicle) {
    return { title: "Vehicle Not Found" };
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
    },
  };
}

export default async function VehicleDetailRoute({ params }: VehicleDetailRouteProps) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  return <VehicleDetailPage vehicle={vehicle} />;
}
