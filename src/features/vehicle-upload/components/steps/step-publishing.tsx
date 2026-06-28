"use client";

import { DatePicker, Radio, Toggle } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import {
  ExternalLink,
  Mail,
  Megaphone,
  Share2,
  Sparkles,
  Store,
} from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { cn } from "@/utils";

const SOCIAL_CHANNELS = [
  { key: "googleAds" as const, label: "Google Ads", icon: Megaphone },
  { key: "facebook" as const, label: "Facebook", icon: Share2 },
  { key: "instagram" as const, label: "Instagram", icon: Share2 },
  { key: "whatsapp" as const, label: "WhatsApp", icon: Share2 },
  { key: "tiktok" as const, label: "TikTok", icon: Share2 },
  { key: "email" as const, label: "Email", icon: Mail },
];

export function StepPublishing() {
  const { data, updatePublishing, markStepComplete } = useUploadWizard();
  const { publishing } = data;

  function validate() {
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="publishing">
      <div className="space-y-8">
        <fieldset className="space-y-3">
          <legend className="text-[length:var(--text-body-sm)] font-semibold">Publish mode</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { value: "draft", label: "Save as Draft", desc: "Finish later" },
                { value: "publish-now", label: "Publish Now", desc: "Go live immediately" },
                { value: "schedule", label: "Schedule", desc: "Pick a date" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cn(
                  "cursor-pointer rounded-[var(--radius-xl)] border p-4 motion-hover",
                  publishing.mode === option.value
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary-muted)]/30"
                    : "border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)]",
                )}
              >
                <Radio
                  name="publish-mode"
                  checked={publishing.mode === option.value}
                  onChange={() => updatePublishing({ mode: option.value })}
                  label={
                    <span>
                      <span className="block font-medium">{option.label}</span>
                      <span className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                        {option.desc}
                      </span>
                    </span>
                  }
                />
              </label>
            ))}
          </div>
          {publishing.mode === "schedule" && (
            <DatePicker
              label="Scheduled date"
              value={publishing.scheduledDate}
              onChange={(e) => updatePublishing({ scheduledDate: e.target.value })}
            />
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-[length:var(--text-body-sm)] font-semibold">Channels</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={cn(uploadPolish.glassCard, "flex items-center justify-between p-4")}>
              <div className="flex items-center gap-3">
                <Icon icon={ExternalLink} size="sm" tone="primary" aria-hidden />
                <span className="text-[length:var(--text-body-sm)] font-medium">Marketplace</span>
              </div>
              <Toggle
                id="marketplace"
                checked={publishing.marketplace}
                onChange={(e) => updatePublishing({ marketplace: e.target.checked })}
              />
            </div>
            <div className={cn(uploadPolish.glassCard, "flex items-center justify-between p-4")}>
              <div className="flex items-center gap-3">
                <Icon icon={Store} size="sm" tone="primary" aria-hidden />
                <span className="text-[length:var(--text-body-sm)] font-medium">Dealer Website</span>
              </div>
              <Toggle
                id="dealer-website"
                checked={publishing.dealerWebsite}
                onChange={(e) => updatePublishing({ dealerWebsite: e.target.checked })}
              />
            </div>
            <div className={cn(uploadPolish.glassCard, "flex items-center justify-between p-4 sm:col-span-2")}>
              <div className="flex items-center gap-3">
                <Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />
                <span className="text-[length:var(--text-body-sm)] font-medium">Featured Listing</span>
              </div>
              <Toggle
                id="featured"
                checked={publishing.featuredListing}
                onChange={(e) => updatePublishing({ featuredListing: e.target.checked })}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-[length:var(--text-body-sm)] font-semibold">
            Social publishing <span className="font-normal text-[var(--color-muted-foreground)]">(coming soon)</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SOCIAL_CHANNELS.map(({ key, label, icon }) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/30 px-4 py-3 opacity-60"
              >
                <div className="flex items-center gap-2">
                  <Icon icon={icon} size="sm" tone="muted" aria-hidden />
                  <span className="text-[length:var(--text-body-sm)]">{label}</span>
                </div>
                <Toggle id={key} checked={publishing[key]} disabled onChange={() => undefined} />
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <UploadNavigation onContinue={validate} continueLabel="Review Listing" />
    </UploadStepLayout>
  );
}
