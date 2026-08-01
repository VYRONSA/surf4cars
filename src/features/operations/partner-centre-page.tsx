import { PartnerCentreWorkspace } from "@/features/operations/components/partner-centre-workspace";
import { type PartnerCentreSectionId } from "@/features/operations/config/partner-centre-sections";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import { getPartnerCentreWorkspaceData, partnerCentreTimestampLabel } from "@/features/operations/server/partner-centre.service";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";

interface PartnerCentrePageProps {
  readonly sectionId?: PartnerCentreSectionId;
}

export async function PartnerCentrePage({ sectionId = "overview" }: PartnerCentrePageProps) {
  const data = await getPartnerCentreWorkspaceData(sectionId);
  const generatedLabel = partnerCentreTimestampLabel(data);

  const store = await readPlatformStore();
  const dealershipId = store.dealerships[0]?.id;

  if (dealershipId) {
    await logOperationsAuditEvent({
      dealershipId,
      eventName: "operations.partner-centre.view",
      source: "operations-partner-centre",
      payload: {
        sectionId,
      },
    }).catch(() => undefined);
  }

  return <PartnerCentreWorkspace data={data} sectionId={sectionId} generatedLabel={generatedLabel} />;
}
