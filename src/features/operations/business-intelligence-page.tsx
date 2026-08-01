import { BusinessIntelligenceWorkspace } from "@/features/operations/components/business-intelligence-workspace";
import { type BusinessIntelligenceSectionId } from "@/features/operations/config/business-intelligence-sections";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import {
  businessIntelligenceTimestampLabel,
  getBusinessIntelligenceWorkspaceData,
} from "@/features/operations/server/business-intelligence.service";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";

interface BusinessIntelligencePageProps {
  readonly sectionId?: BusinessIntelligenceSectionId;
}

export async function BusinessIntelligencePage({ sectionId = "overview" }: BusinessIntelligencePageProps) {
  const data = await getBusinessIntelligenceWorkspaceData(sectionId);
  const generatedLabel = businessIntelligenceTimestampLabel(data);

  const store = await readPlatformStore();
  const dealershipId = store.dealerships[0]?.id;

  if (dealershipId) {
    await logOperationsAuditEvent({
      dealershipId,
      eventName: "operations.business-intelligence.view",
      source: "operations-business-intelligence",
      payload: {
        sectionId,
      },
    }).catch(() => undefined);
  }

  return <BusinessIntelligenceWorkspace data={data} sectionId={sectionId} generatedLabel={generatedLabel} />;
}