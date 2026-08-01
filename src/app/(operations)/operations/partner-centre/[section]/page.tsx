import { notFound } from "next/navigation";

import { getPartnerCentreSectionBySlug } from "@/features/operations/config/partner-centre-sections";
import { PartnerCentrePage } from "@/features/operations/partner-centre-page";

interface PartnerCentreSectionRouteProps {
  readonly params: Promise<{ section: string }>;
}

export default async function PartnerCentreSectionRoute({ params }: PartnerCentreSectionRouteProps) {
  const { section } = await params;
  const sectionMatch = getPartnerCentreSectionBySlug(section);

  if (!sectionMatch || sectionMatch.id === "overview") {
    notFound();
  }

  return <PartnerCentrePage sectionId={sectionMatch.id} />;
}
