import type { OnboardingContextSnapshot } from "@/features/dealer-onboarding/types/onboarding.types";

const STORAGE_KEY = "surf4cars:dealer-onboarding-draft";
const COMPACT_PREVIEW_DATA_URL = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

function compactPreview(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= COMPACT_PREVIEW_DATA_URL.length) return value;
  return COMPACT_PREVIEW_DATA_URL;
}

function compactSnapshot(snapshot: OnboardingContextSnapshot): OnboardingContextSnapshot {
  return {
    ...snapshot,
    data: {
      ...snapshot.data,
      branding: {
        ...snapshot.data.branding,
        logoPreview: compactPreview(snapshot.data.branding.logoPreview),
        coverPreview: compactPreview(snapshot.data.branding.coverPreview),
      },
    },
  };
}

function parseSnapshot(raw: string | null): OnboardingContextSnapshot | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingContextSnapshot>;
    if (
      typeof parsed.currentStepIndex !== "number"
      || typeof parsed.revision !== "number"
      || typeof parsed.data !== "object"
      || parsed.data === null
    ) {
      return null;
    }

    return parsed as OnboardingContextSnapshot;
  } catch {
    return null;
  }
}

export function loadOnboardingDraft(): OnboardingContextSnapshot | null {
  if (typeof window === "undefined") return null;
  return parseSnapshot(localStorage.getItem(STORAGE_KEY));
}

export function saveOnboardingDraft(snapshot: OnboardingContextSnapshot): { readonly saved: boolean; readonly existing: OnboardingContextSnapshot | null } {
  if (typeof window === "undefined") return { saved: false, existing: null };

  const existing = loadOnboardingDraft();
  if (existing && existing.revision > snapshot.revision) {
    return { saved: false, existing };
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return { saved: true, existing };
  } catch {
    // Retry once with compact previews to avoid losing step progression due storage quota.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compactSnapshot(snapshot)));
      return { saved: true, existing };
    } catch {
      // Storage unavailable.
      return { saved: false, existing };
    }
  }
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function readOnboardingDraftFromStorageEvent(event: StorageEvent): OnboardingContextSnapshot | null {
  if (event.key !== STORAGE_KEY) return null;
  return parseSnapshot(event.newValue);
}

export function getOnboardingDraftStorageKey(): string {
  return STORAGE_KEY;
}
