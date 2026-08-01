"use client";

import { useState } from "react";

import { ImagePicker } from "@/components/ui/form";
import { FormField } from "@/components/ui/form";
import { Text } from "@/components/ui/typography";
import { BrandingPreviewCard } from "@/features/dealer-onboarding/components/branding-preview-card";
import { OnboardingNavigation } from "@/features/dealer-onboarding/components/onboarding-navigation";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { validateBranding } from "@/features/dealer-onboarding/utils/onboarding-validators";
import { cn } from "@/utils";

function readFilePreview(
  file: File,
  onSuccess: (preview: string, name: string) => void,
  onError?: () => void,
) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      onSuccess(reader.result, file.name);
      return;
    }

    onError?.();
  };
  reader.onerror = () => onError?.();
  reader.readAsDataURL(file);
}

export function StepBranding() {
  const { data, updateBranding, clearError } = useOnboarding();
  const { branding } = data;
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate() {
    const result = validateBranding(data);
    setValidationError(result.valid ? null : (result.message ?? "Please complete this step."));
    return result.valid;
  }

  function update(values: Parameters<typeof updateBranding>[0]) {
    clearError();
    setValidationError(null);
    updateBranding(values);
  }

  return (
    <div className={cn(onboardingStyles.widePanel, "animate-slide-up-sfc")}>
      <header>
        <Text variant="h3" as="h2">
          Define your brand
        </Text>
        <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
          Upload your logo and colours. Preview updates live as you make changes.
        </Text>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <ImagePicker
            label={branding.logoFileName ? "Replace logo" : "Upload logo"}
            description="PNG or SVG recommended"
            preview={
              branding.logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logoPreview}
                  alt="Logo preview"
                  className="aspect-square max-h-32 w-full object-contain p-4"
                />
              ) : undefined
            }
            onFilesSelected={(files) => {
              const file = files[0];
              if (file) {
                readFilePreview(
                  file,
                  (preview, name) => {
                    update({ logoPreview: preview, logoFileName: name });
                  },
                  () => {
                    setValidationError("Logo upload was interrupted. Please retry.");
                    update({ logoPreview: null, logoFileName: null });
                  },
                );
              }
            }}
          />

          <ImagePicker
            label={branding.coverFileName ? "Replace cover image" : "Upload cover image"}
            description="Wide format recommended"
            preview={
              branding.coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.coverPreview}
                  alt="Cover preview"
                  className="aspect-[21/9] w-full object-cover"
                />
              ) : undefined
            }
            onFilesSelected={(files) => {
              const file = files[0];
              if (file) {
                readFilePreview(
                  file,
                  (preview, name) => {
                    update({ coverPreview: preview, coverFileName: name });
                  },
                  () => {
                    setValidationError("Cover image upload was interrupted. Please retry.");
                    update({ coverPreview: null, coverFileName: null });
                  },
                );
              }
            }}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              id="primary-color"
              label="Primary Brand Colour"
              value={branding.primaryColor}
              onChange={(value) => update({ primaryColor: value })}
            />
            <ColorField
              id="secondary-color"
              label="Secondary Brand Colour"
              value={branding.secondaryColor}
              onChange={(value) => update({ secondaryColor: value })}
            />
          </div>
        </div>

        <div className="lg:pt-4">
          <Text variant="label" tone="muted" className="mb-4 block uppercase tracking-[var(--tracking-wide)]">
            Live Preview
          </Text>
          <BrandingPreviewCard />
        </div>
      </div>

      {validationError && (
        <Text variant="body-sm" tone="danger" className="mt-4" role="alert">
          {validationError}
        </Text>
      )}

      <div className="mt-10">
        <OnboardingNavigation onContinue={validate} />
      </div>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <FormField label={label} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-12 cursor-pointer rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-transparent p-1"
          aria-label={label}
        />
        <span className="font-mono text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {value.toUpperCase()}
        </span>
      </div>
    </FormField>
  );
}
