import type { Metadata } from "next";

import { ImportWizard } from "@/features/dealer-migration/components/import-wizard";

export const metadata: Metadata = {
  title: "Add your stock",
  description: "Bring your vehicles across from a spreadsheet or another site.",
  robots: { index: false, follow: false },
};

export default function DealerInventoryImportRoute() {
  return <ImportWizard />;
}
