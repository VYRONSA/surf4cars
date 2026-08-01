import { DealerIntelligenceWorkspace } from "@/features/operations/components/dealer-intelligence-workspace";
import { getDealerIntelligenceWorkspaceData } from "@/features/operations/server/dealer-intelligence.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import type { DealerIntelligencePageProps } from "@/features/operations/types/dealer-intelligence.types";

export async function DealerIntelligencePage({ sectionId }: DealerIntelligencePageProps) {
  const data = await getDealerIntelligenceWorkspaceData();
  const primaryDealershipId = data.profiles[0]?.dealershipId;

  if (primaryDealershipId) {
    await logOperationsAuditEvent(
      {
        dealershipId: primaryDealershipId,
        eventName: "operations.dealer-intelligence.view",
        source: "operations-centre",
        payload: {
          sectionId,
          generatedAt: data.generatedAt,
        },
      },
    ).catch(() => undefined);
  }

  return <DealerIntelligenceWorkspace data={data} sectionId={sectionId} />;
}
