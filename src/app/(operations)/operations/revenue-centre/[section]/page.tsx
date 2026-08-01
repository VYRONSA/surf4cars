import { notFound } from "next/navigation";

import { getRevenueCentreSectionBySlug } from "@/features/operations/config/revenue-centre-sections";
import { RevenueCentrePage } from "@/features/operations/revenue-centre-page";

interface RevenueCentreSectionPageProps {
  readonly params: Promise<{ section: string }>;
}

export default async function RevenueCentreSectionPage({ params }: RevenueCentreSectionPageProps) {
  const { section } = await params;
  const sectionMatch = getRevenueCentreSectionBySlug(section);

  if (!sectionMatch || sectionMatch.id === "overview") {
    notFound();
  }

  return <RevenueCentrePage sectionId={sectionMatch.id} />;
}
