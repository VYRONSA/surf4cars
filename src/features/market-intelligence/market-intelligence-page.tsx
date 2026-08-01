"use client";

import { PageContainer } from "@/components/shell/page/page-container";
import { MarketIntelligencePlatform } from "@/features/market-intelligence/components/market-intelligence-platform";

export function MarketIntelligencePage() {
  return (
    <PageContainer variant="analytics">
      <div className="space-y-6">
        <header className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
          <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
            SURF Intelligence
          </p>
          <h1 className="mt-1 text-[length:var(--text-h3)] font-semibold">Market Intelligence Engine</h1>
          <p className="mt-2 max-w-3xl text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Dealer-facing market analysis workspace built on reusable service contracts. Live data modules surface explicit pending states until marketplace and external feeds are connected.
          </p>
        </header>
        <MarketIntelligencePlatform />
      </div>
    </PageContainer>
  );
}
