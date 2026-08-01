"use client";

import { PageContainer } from "@/components/shell/page/page-container";
import { BuyerIntelligencePlatform } from "@/features/buyer-intelligence/components/buyer-intelligence-platform";

export function BuyerIntelligencePage() {
  return (
    <PageContainer variant="analytics">
      <div className="space-y-6">
        <header className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
          <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">SURF Intelligence</p>
          <h1 className="mt-1 text-[length:var(--text-h3)] font-semibold">Buyer Intelligence Platform</h1>
          <p className="mt-2 max-w-3xl text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Intelligent buying assistant architecture integrating SURF Intelligence, Inventory Intelligence, and Market Intelligence with reusable APIs and explicit pending states.
          </p>
        </header>
        <BuyerIntelligencePlatform />
      </div>
    </PageContainer>
  );
}
