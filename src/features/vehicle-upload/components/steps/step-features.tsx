"use client";

import { useMemo, useState } from "react";

import { Checkbox, SearchInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import * as Icons from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { UPLOAD_FEATURE_OPTIONS } from "@/features/vehicle-upload/config/upload-features";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { cn } from "@/utils";
import type { LucideIcon } from "@/components/ui/icons/registry";

function resolveFeatureIcon(name: string): LucideIcon {
  return (Icons as Record<string, LucideIcon>)[name] ?? Icons.Check;
}

export function StepFeatures() {
  const { data, toggleFeature, markStepComplete } = useUploadWizard();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return UPLOAD_FEATURE_OPTIONS;
    return UPLOAD_FEATURE_OPTIONS.filter(
      (f) => f.label.toLowerCase().includes(q) || f.category.toLowerCase().includes(q),
    );
  }, [query]);

  function validate() {
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="features">
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
        placeholder="Search leather, sunroof, tow bar…"
        aria-label="Search vehicle features"
        className="mb-6 h-12"
      />

      <p className="mb-4 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {data.selectedFeatures.length} feature{data.selectedFeatures.length !== 1 ? "s" : ""} selected
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((feature) => {
          const selected = data.selectedFeatures.includes(feature.id);
          const FeatureIcon = resolveFeatureIcon(feature.icon);

          return (
            <label
              key={feature.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[var(--radius-xl)] border px-4 py-3",
                "motion-hover transition-colors",
                selected
                  ? "border-[var(--color-primary)]/40 bg-[var(--color-primary-muted)]/30"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface)]/40 hover:bg-[var(--color-hover)]",
              )}
            >
              <Checkbox
                checked={selected}
                onChange={() => toggleFeature(feature.id)}
                aria-label={feature.label}
              />
              <Icon icon={FeatureIcon} size="sm" tone={selected ? "primary" : "muted"} aria-hidden />
              <div className="min-w-0 flex-1">
                <span className="text-[length:var(--text-body-sm)] font-medium">{feature.label}</span>
                <span className="ml-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                  {feature.category}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      <UploadNavigation onContinue={validate} />
    </UploadStepLayout>
  );
}
