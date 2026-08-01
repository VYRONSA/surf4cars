import { notFound } from "next/navigation";

import { DealerIntelligencePage } from "@/features/operations/dealer-intelligence-page";
import { getDealerIntelligenceSectionBySlug } from "@/features/operations/config/dealer-intelligence-sections";

interface OperationsDealerIntelligenceSectionRouteProps {
  readonly params: Promise<{ readonly section: string }>;
}

export default async function OperationsDealerIntelligenceSectionRoute({
  params,
}: OperationsDealerIntelligenceSectionRouteProps) {
  const { section } = await params;
  const resolvedSection = getDealerIntelligenceSectionBySlug(section);

  if (!resolvedSection || resolvedSection.id === "overview") {
    notFound();
  }

  return <DealerIntelligencePage sectionId={resolvedSection.id} />;
}
