import { notFound } from "next/navigation";

import { DealerManagementPage } from "@/features/operations";
import { getDealerManagementSectionBySlug } from "@/features/operations/config/dealer-management-sections";

interface DealerManagementSectionRouteProps {
  readonly params: Promise<{ readonly section: string }>;
}

export default async function OperationsDealerManagementSectionRoute({
  params,
}: DealerManagementSectionRouteProps) {
  const { section } = await params;
  const resolvedSection = getDealerManagementSectionBySlug(section);

  if (!resolvedSection || resolvedSection.id === "overview") {
    notFound();
  }

  return <DealerManagementPage sectionId={resolvedSection.id} />;
}
