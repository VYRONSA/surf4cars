"use client";

import { memo, useMemo } from "react";

import { Icon } from "@/components/ui/icons";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
} from "@/components/ui/icons/registry";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { deriveUploadAiInsights } from "@/features/vehicle-upload/utils/upload-ai-insights";
import { cn } from "@/utils";
import type { LucideIcon } from "@/components/ui/icons/registry";

const TONE_CONFIG = {
  info: {
    border: "border-[var(--color-primary)]/20",
    bg: "bg-[var(--color-primary-muted)]/30",
    icon: Lightbulb,
    iconTone: "primary" as const,
    label: "Suggestion",
  },
  warning: {
    border: "border-[var(--color-warning)]/25",
    bg: "bg-[var(--color-warning-muted)]/35",
    icon: AlertTriangle,
    iconTone: "warning" as const,
    label: "Action needed",
  },
  success: {
    border: "border-[var(--color-success)]/25",
    bg: "bg-[var(--color-success-muted)]/35",
    icon: CheckCircle2,
    iconTone: "success" as const,
    label: "Tip",
  },
} as const;

export const UploadAiPanel = memo(function UploadAiPanel() {
  const { data } = useUploadWizard();
  const insights = useMemo(() => deriveUploadAiInsights(data), [data]);

  return (
    <aside
      className={uploadPolish.aiPanel}
      aria-label="SURF Intelligence listing suggestions"
    >
      <div className="mb-4 flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex size-10 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-secondary-muted)] to-[var(--color-primary-muted)]">
          <Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />
        </div>
        <div>
          <p className="text-[length:var(--text-body-md)] font-semibold">SURF Intelligence</p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
            Actionable listing improvements
          </p>
        </div>
      </div>

      <ul className="space-y-3" role="list">
        {insights.map((insight) => {
          const config = TONE_CONFIG[insight.tone];
          const InsightIcon: LucideIcon = config.icon;

          return (
            <li
              key={insight.id}
              className={cn(
                "rounded-[var(--radius-xl)] border p-3.5",
                "transition-shadow duration-300 hover:shadow-[var(--shadow-sm)]",
                config.border,
                config.bg,
              )}
            >
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-raised)]/80">
                  <Icon icon={InsightIcon} size="sm" tone={config.iconTone} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[length:var(--text-caption)] font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
                    {config.label}
                  </p>
                  <p className="mt-1 text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-[var(--color-foreground)]">
                    {insight.message}
                  </p>
                  <p className="mt-2 text-[length:var(--text-caption)] font-medium text-[var(--color-primary)]">
                    → {insight.action}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
});
