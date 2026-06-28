"use client";

import { PageContainer } from "@/components/shell/page/page-container";
import { InventoryAiAlerts } from "@/features/inventory/components/inventory-ai-alerts";
import { InventoryGrid } from "@/features/inventory/components/inventory-grid";
import { InventoryPageHeader } from "@/features/inventory/components/inventory-page-header";
import { InventoryPerformance } from "@/features/inventory/components/inventory-performance";
import { InventoryRecommendedActions } from "@/features/inventory/components/inventory-recommended-actions";
import { InventorySummaryKpis } from "@/features/inventory/components/inventory-summary-kpis";
import { getInventoryShowcase } from "@/features/inventory/config/inventory-showcase-data";
import { inventoryPolish } from "@/features/inventory/config/inventory-shared";

export function InventoryIntelligencePage() {
  const data = getInventoryShowcase();

  return (
    <PageContainer variant="analytics">
      <div className={inventoryPolish.page}>
        <InventoryPageHeader />
        <InventorySummaryKpis kpis={data.kpis} />
        <InventoryAiAlerts alerts={data.alerts} />
        <InventoryGrid vehicles={data.vehicles} />
        <InventoryPerformance charts={data.charts} />
        <InventoryRecommendedActions actions={data.recommendedActions} />
      </div>
    </PageContainer>
  );
}
