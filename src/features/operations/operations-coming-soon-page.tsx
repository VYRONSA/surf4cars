import { OperationsComingSoonPanel } from "@/features/operations/components/operations-coming-soon-panel";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";

interface OperationsComingSoonPageProps {
  readonly moduleName: string;
  readonly moduleDescription: string;
}

export async function OperationsComingSoonPage({
  moduleName,
  moduleDescription,
}: OperationsComingSoonPageProps) {
  const store = await readPlatformStore();
  const primaryDealershipId = store.dealerships[0]?.id;

  if (primaryDealershipId) {
    await logOperationsAuditEvent(
      {
        dealershipId: primaryDealershipId,
        eventName: "operations.module.view",
        source: "operations-centre",
        payload: { moduleName },
      },
    ).catch(() => undefined);
  }

  return (
    <section className="space-y-6 py-1">
      <div>
        <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          SURF Operations Centre
        </p>
        <h1 className="mt-2 text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)]">
          {moduleName}
        </h1>
      </div>
      <OperationsComingSoonPanel title={`${moduleName} is coming soon`} description={moduleDescription} />
    </section>
  );
}
