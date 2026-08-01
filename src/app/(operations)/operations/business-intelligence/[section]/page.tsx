import { notFound } from "next/navigation";

import { getBusinessIntelligenceSectionBySlug } from "@/features/operations/config/business-intelligence-sections";
import { BusinessIntelligencePage } from "@/features/operations/business-intelligence-page";

interface BusinessIntelligenceSectionRouteProps {
  readonly params: Promise<{ section: string }>;
}

export default async function BusinessIntelligenceSectionRoute({ params }: BusinessIntelligenceSectionRouteProps) {
  const { section } = await params;
  const sectionMatch = getBusinessIntelligenceSectionBySlug(section);

  if (!sectionMatch || sectionMatch.id === "overview") {
    notFound();
  }

  return <BusinessIntelligencePage sectionId={sectionMatch.id} />;
}
