import type { UploadContextSnapshot } from "@/features/vehicle-upload/types/upload.types";

const STORAGE_KEY = "surf4cars:vehicle-upload-draft";

export function loadUploadDraft(): UploadContextSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UploadContextSnapshot;
  } catch {
    return null;
  }
}

export function saveUploadDraft(snapshot: UploadContextSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage full or unavailable — fail silently for showcase
  }
}

export function clearUploadDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
