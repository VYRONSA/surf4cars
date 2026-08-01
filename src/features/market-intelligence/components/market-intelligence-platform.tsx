"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import {
  getDailyIntelligenceBrief,
  getMarketDashboard,
  runDealerBenchmarking,
  runDemandAnalysis,
  runInventoryAgeingIntelligence,
  runMarketPulse,
  runPricePositionAnalysis,
  runSellingVelocityAnalysis,
  runSupplyAnalysis,
} from "@/features/market-intelligence/services/market-intelligence.api";
import type {
  DailyIntelligenceBriefPayload,
  MarketDashboardPayload,
} from "@/features/market-intelligence/types/market-intelligence.types";
import { getActiveDealershipId } from "@/features/inventory/utils/active-dealership";

const EMPTY_DASHBOARD: MarketDashboardPayload = {
  dealershipId: "",
  generatedAt: "",
  metrics: [],
  feedReadiness: {
    internalAnalytics: "awaiting",
    marketplaceData: "awaiting",
    auctionFeeds: "awaiting",
    thirdPartyValuations: "awaiting",
  },
};

const EMPTY_BRIEF: DailyIntelligenceBriefPayload = {
  dealershipId: "",
  generatedAt: "",
  sections: [],
};

function readinessBadge(value: "connected" | "awaiting"): string {
  return value === "connected" ? "Connected" : "Awaiting live market data.";
}

export function MarketIntelligencePlatform() {
  const [dealershipId, setDealershipId] = useState<string>(() => getActiveDealershipId() ?? "");
  const [dashboard, setDashboard] = useState<MarketDashboardPayload>(EMPTY_DASHBOARD);
  const [brief, setBrief] = useState<DailyIntelligenceBriefPayload>(EMPTY_BRIEF);
  const [serviceStates, setServiceStates] = useState<readonly string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    if (!dealershipId.trim()) {
      setError("Dealership ID is required.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const [dashboardPayload, briefPayload, pricePosition, demand, supply, velocity, ageing, benchmarking, pulse] = await Promise.all([
        getMarketDashboard(dealershipId),
        getDailyIntelligenceBrief(dealershipId),
        runPricePositionAnalysis({ dealershipId }),
        runDemandAnalysis({ dealershipId }),
        runSupplyAnalysis({ dealershipId }),
        runSellingVelocityAnalysis({ dealershipId }),
        runInventoryAgeingIntelligence({ dealershipId }),
        runDealerBenchmarking({ dealershipId }),
        runMarketPulse({ dealershipId }),
      ]);

      setDashboard(dashboardPayload);
      setBrief(briefPayload);
      setServiceStates([
        `Price Position Analysis: ${pricePosition.marketPosition}`,
        `Demand Analysis: ${demand.buyerDemand}`,
        `Supply Analysis: ${supply.supplyTrend}`,
        `Selling Velocity: ${velocity.message}`,
        `Inventory Ageing Intelligence: ${ageing.requiringAttention.length} vehicles above threshold`,
        `Dealer Benchmarking: ${benchmarking.benchmarkSummary}`,
        `Market Pulse: ${pulse.pulse}`,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load market intelligence.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="market-dealership-id" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Dealership ID</label>
            <Input
              id="market-dealership-id"
              value={dealershipId}
              onChange={(event) => setDealershipId(event.target.value)}
              placeholder="dealership-..."
            />
          </div>
          <Button type="button" onClick={() => void loadAll()} disabled={isLoading}>
            {isLoading ? "Loading Market Intelligence..." : "Load Market Intelligence"}
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <article key={metric.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-4">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              {metric.label}
            </p>
            <p className="mt-1 text-[length:var(--text-h4)] font-semibold">{metric.displayValue}</p>
            <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{metric.message}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
        <h2 className="text-[length:var(--text-h5)] font-semibold">Market Feed Readiness</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FeedCard label="Internal analytics" value={readinessBadge(dashboard.feedReadiness.internalAnalytics)} />
          <FeedCard label="Marketplace data" value={readinessBadge(dashboard.feedReadiness.marketplaceData)} />
          <FeedCard label="Auction feeds" value={readinessBadge(dashboard.feedReadiness.auctionFeeds)} />
          <FeedCard label="Third-party valuation providers" value={readinessBadge(dashboard.feedReadiness.thirdPartyValuations)} />
        </div>
      </section>

      <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
        <h2 className="text-[length:var(--text-h5)] font-semibold">Daily Intelligence Brief</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {brief.sections.map((section) => (
            <article key={section.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
              <p className="text-[length:var(--text-body-md)] font-semibold">{section.title}</p>
              <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{section.message}</p>
              {section.items.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-[length:var(--text-body-sm)]">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
        <h2 className="text-[length:var(--text-h5)] font-semibold">Market Intelligence Service Contract Status</h2>
        <ul className="mt-3 space-y-2">
          {serviceStates.map((entry) => (
            <li key={entry} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3 text-[length:var(--text-body-sm)]">
              {entry}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FeedCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
      <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">{label}</p>
      <p className="mt-1 text-[length:var(--text-body-sm)] font-medium">{value}</p>
    </article>
  );
}
