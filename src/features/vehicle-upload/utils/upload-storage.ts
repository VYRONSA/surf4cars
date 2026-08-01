import type { UploadContextSnapshot } from "@/features/vehicle-upload/types/upload.types";

const STORAGE_KEY = "surf4cars:vehicle-upload-draft";

function parseSnapshot(raw: string | null): UploadContextSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UploadContextSnapshot;
  } catch {
    return null;
  }
}

export function loadUploadDraft(): UploadContextSnapshot | null {
  if (typeof window === "undefined") return null;
  return parseSnapshot(localStorage.getItem(STORAGE_KEY));
}

export function saveUploadDraft(snapshot: UploadContextSnapshot): { readonly saved: boolean; readonly existing: UploadContextSnapshot | null } {
  if (typeof window === "undefined") return { saved: false, existing: null };

  const existing = loadUploadDraft();
  if (existing && existing.revision > snapshot.revision) {
    return { saved: false, existing };
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return { saved: true, existing };
  } catch {
    // Storage full or unavailable — fail silently for showcase
    return { saved: false, existing };
  }
}

export function clearUploadDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function readUploadDraftFromStorageEvent(event: StorageEvent): UploadContextSnapshot | null {
  if (event.key !== STORAGE_KEY) return null;
  return parseSnapshot(event.newValue);
}

export function getUploadDraftStorageKey(): string {
  return STORAGE_KEY;
}
