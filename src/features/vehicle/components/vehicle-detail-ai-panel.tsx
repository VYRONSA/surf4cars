"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Bot, ChevronDown, ChevronUp, Sparkles } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleAiInsight } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

export interface VehicleDetailAiPanelProps {
  readonly insights: readonly VehicleAiInsight[];
  readonly className?: string;
}

export function VehicleDetailAiPanel({ insights, className }: VehicleDetailAiPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const panelContent = (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-secondary-muted)] text-[var(--color-secondary)]">
            <Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />
          </span>
          <div>
            <Text variant="label" tone="primary">
              SURF AI Insights
            </Text>
            <Text variant="caption" tone="muted">
              Intelligent analysis · UI preview
            </Text>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse insights" : "Expand insights"}
          className="hidden lg:inline-flex"
          onClick={() => setExpanded((e) => !e)}
        >
          <Icon icon={expanded ? ChevronDown : ChevronUp} size="sm" aria-hidden />
        </Button>
      </div>

      {expanded && (
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]/60 bg-[var(--color-surface)]/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <Text variant="caption" tone="muted">
                  {insight.label}
                </Text>
                {insight.score != null && (
                  <span className="text-[length:var(--text-caption)] font-medium text-[var(--color-primary)]">
                    {insight.score}%
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "mt-1 text-[length:var(--text-body-sm)] font-medium leading-[var(--leading-snug)]",
                  insight.tone === "positive" && "text-[var(--color-success)]",
                  insight.tone === "accent" && "text-[var(--color-accent)]",
                  (!insight.tone || insight.tone === "neutral") && "text-[var(--color-foreground)]",
                )}
              >
                {insight.value}
              </p>
              {insight.score != null && (
                <Progress value={insight.score} className="mt-2 h-1" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-muted)]/50 p-3">
        <div className="flex items-start gap-2">
          <Icon icon={Bot} size="sm" tone="primary" aria-hidden />
          <Text variant="body-sm" tone="muted" className="leading-[var(--leading-relaxed)]">
            Ask SURF AI about this vehicle — market value, running costs, and suitability. Coming soon.
          </Text>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden lg:block",
          "fixed bottom-28 right-6 z-30 w-[min(100vw-3rem,340px)]",
          vehiclePolish.glassPanel,
          "p-5 shadow-[var(--shadow-floating)]",
          className,
        )}
        aria-label="SURF AI insights"
      >
        {panelContent}
      </aside>

      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="vehicle-ai-panel-mobile"
          onClick={() => setMobileOpen((o) => !o)}
          className={cn(
            "fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-[var(--radius-pill)]",
            "border border-[var(--color-secondary)]/25 bg-[var(--color-secondary-muted)] px-4 py-3",
            "text-[length:var(--text-body-sm)] font-medium text-[var(--color-secondary)] shadow-[var(--shadow-md)]",
            "motion-button backdrop-blur-md",
          )}
        >
          <Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />
          SURF AI
        </button>

        {mobileOpen && (
          <div
            id="vehicle-ai-panel-mobile"
            className={cn(
              "fixed inset-x-4 bottom-36 z-30 max-h-[50vh] overflow-y-auto",
              vehiclePolish.glassPanel,
              "p-5 shadow-[var(--shadow-floating)]",
            )}
          >
            {panelContent}
          </div>
        )}
      </div>
    </>
  );
}
