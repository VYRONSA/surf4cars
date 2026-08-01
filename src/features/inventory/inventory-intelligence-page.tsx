"use client";

import { PageContainer } from "@/components/shell/page/page-container";
import { InventoryIntelligencePlatform } from "@/features/inventory/components/inventory-intelligence-platform";
import { inventoryPolish } from "@/features/inventory/config/inventory-shared";

export function InventoryIntelligencePage() {
  return (
    <PageContainer variant="analytics">
      <div className={inventoryPolish.page}>
        <InventoryIntelligencePlatform />
      </div>
    </PageContainer>
  );
}
