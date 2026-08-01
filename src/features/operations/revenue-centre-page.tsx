import { RevenueCentreWorkspace } from "@/features/operations/components/revenue-centre-workspace";
import { type RevenueCentreSectionId } from "@/features/operations/config/revenue-centre-sections";
import { getRevenueCentreWorkspaceData, revenueTimestampLabel } from "@/features/operations/server/revenue-centre.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";

interface RevenueCentrePageProps {
  readonly sectionId?: RevenueCentreSectionId;
}

export async function RevenueCentrePage({ sectionId = "overview" }: RevenueCentrePageProps) {
  const data = await getRevenueCentreWorkspaceData(sectionId);
  const generatedLabel = revenueTimestampLabel(data);

  const store = await readPlatformStore();
  const dealershipId = store.dealerships[0]?.id;

  if (dealershipId) {
    await logOperationsAuditEvent({
      dealershipId,
      eventName: "operations.revenue-centre.view",
      source: "operations-revenue-centre",
      payload: {
        sectionId,
      },
    }).catch(() => undefined);
  }

  return <RevenueCentreWorkspace data={data} generatedLabel={generatedLabel} />;
}
