"use client";

import { memo } from "react";

import { Icon } from "@/components/ui/icons";
import { AlertTriangle, CheckCircle2, Sparkles } from "@/components/ui/icons/registry";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";

export const UploadAiPanel = memo(function UploadAiPanel() {
  const { data, asyncMessage } = useUploadWizard();

  const suggestions = [
    ...data.intelligenceReview.missingInformation.map((value) => ({
      id: `missing-${value}`,
      tone: "warning" as const,
      message: `Complete ${value.toLowerCase()}.`,
    })),
    ...data.intelligenceReview.suggestedImprovements.map((value) => ({
      id: `suggest-${value}`,
      tone: "info" as const,
      message: value,
    })),
  ];

  return (
    <aside className={uploadPolish.aiPanel} aria-label="SURF Intelligence guidance">
      <div className="mb-4 flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex size-10 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-secondary-muted)] to-[var(--color-primary-muted)]">
          <Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />
        </div>
        <div>
          <p className="text-[length:var(--text-body-md)] font-semibold">SURF Intelligence</p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
            Unified recommendations across listing workflow
          </p>
        </div>
      </div>

      {asyncMessage && (
        <p className="mb-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/40 px-3 py-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          {asyncMessage}
        </p>
      )}

      <ul className="space-y-2" role="list">
        {suggestions.length === 0 ? (
          <li className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/35 px-3 py-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
            Awaiting AI analysis
          </li>
        ) : (
          suggestions.slice(0, 4).map((item) => (
            <li key={item.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/35 px-3 py-2">
              <div className="flex items-start gap-2">
                <Icon icon={item.tone === "warning" ? AlertTriangle : CheckCircle2} size="xs" tone={item.tone === "warning" ? "warning" : "success"} aria-hidden />
                <p className="text-[length:var(--text-caption)] text-[var(--color-foreground)]">{item.message}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
});
