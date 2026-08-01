import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DealerProfilePage, loadDealerProfile } from "@/features/dealer-profile";

interface DealerProfileRouteProps {
  readonly params: Promise<{ slug: string }>;
}

/**
 * Stock counts and availability change whenever a dealer publishes or sells, and this page leads with a
 * live count. Rendered per request for the same reason the vehicle detail route is.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: DealerProfileRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const dealer = await loadDealerProfile(slug);

  if (!dealer) {
    return {
      title: "Dealership not found",
      robots: { index: false, follow: false },
    };
  }

  const location = [dealer.contact.city, dealer.contact.province].filter(Boolean).join(", ");

  return {
    title: `${dealer.name}${location ? ` — ${location}` : ""}`,
    /* Describes only what the record establishes: who they are, where, and how much stock is live. */
    description: `${dealer.name} on SURF4CARS${location ? `, ${location}` : ""}. ${
      dealer.vehiclesInStock
    } ${dealer.vehiclesInStock === 1 ? "vehicle" : "vehicles"} currently available.`,
    alternates: { canonical: `/dealers/${dealer.slug}` },
  };
}

export default async function DealerProfileRoute({ params }: DealerProfileRouteProps) {
  const { slug } = await params;
  const dealer = await loadDealerProfile(slug);

  if (!dealer) {
    notFound();
  }

  return <DealerProfilePage dealer={dealer} />;
}
