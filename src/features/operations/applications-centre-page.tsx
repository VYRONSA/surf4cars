import { ApplicationsCentreWorkspace } from "@/features/operations/components/applications-centre-workspace";
import { getApplicationsCentreWorkspaceData } from "@/features/operations/server/applications-centre.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";

export async function ApplicationsCentrePage() {
  const data = await getApplicationsCentreWorkspaceData();
  const primaryDealershipId = data.queue[0]?.dealer?.id;

  if (primaryDealershipId) {
    await logOperationsAuditEvent(
      {
        dealershipId: primaryDealershipId,
        eventName: "operations.applications-centre.view",
        source: "operations-centre",
        payload: {
          generatedAt: data.generatedAt,
          queueSize: data.queue.length,
        },
      },
    ).catch(() => undefined);
  }

  return <ApplicationsCentreWorkspace initialData={data} />;
}
