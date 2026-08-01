import { MarketplaceControlWorkspace } from "@/features/operations/components/marketplace-control-workspace";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import { getMarketplaceControlWorkspaceData } from "@/features/operations/server/marketplace-control.service";
import type { MarketplaceControlSectionId } from "@/features/operations/config/marketplace-control-sections";

export interface MarketplaceControlPageProps {
  readonly sectionId: MarketplaceControlSectionId;
}

export async function MarketplaceControlPage({ sectionId }: MarketplaceControlPageProps) {
  const data = await getMarketplaceControlWorkspaceData(sectionId);
  const primaryDealershipId = data.approvalQueue[0]?.dealershipId;

  if (primaryDealershipId) {
    await logOperationsAuditEvent({
      dealershipId: primaryDealershipId,
      eventName: "operations.marketplace-control.view",
      source: "operations-centre",
      payload: {
        sectionId,
        generatedAt: data.generatedAt,
        queueSize: data.approvalQueue.length,
      },
    }).catch(() => undefined);
  }

  return <MarketplaceControlWorkspace data={data} sectionId={sectionId} />;
}
