import type { Metadata } from "next";

import { EditorialConsolePage } from "@/features/editorial/editorial-console-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editorial console",
  robots: { index: false, follow: false },
};

/**
 * Reachable only through the `/operations` gate in `src/proxy.ts`, which requires the
 * `operations:view` permission. That gate is the authorisation for every write this page performs —
 * see the note in `src/services/editorial/editorial.write.ts`.
 */
export default function OperationsEditorialRoute() {
  return <EditorialConsolePage />;
}
