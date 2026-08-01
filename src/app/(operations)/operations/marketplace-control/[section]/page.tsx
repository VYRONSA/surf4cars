import { notFound } from "next/navigation";

import { MarketplaceControlPage } from "@/features/operations";
import { getMarketplaceControlSectionBySlug } from "@/features/operations/config/marketplace-control-sections";

interface OperationsMarketplaceControlSectionRouteProps {
  readonly params: Promise<{ readonly section: string }>;
}

export default async function OperationsMarketplaceControlSectionRoute({
  params,
}: OperationsMarketplaceControlSectionRouteProps) {
  const { section } = await params;
  const resolvedSection = getMarketplaceControlSectionBySlug(section);

  if (!resolvedSection || resolvedSection.id === "overview") {
    notFound();
  }

  return <MarketplaceControlPage sectionId={resolvedSection.id} />;
}
