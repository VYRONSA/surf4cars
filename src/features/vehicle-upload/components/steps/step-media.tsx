"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { ChevronDown, ChevronUp, Image as ImageIcon, Smartphone, Star, Trash2, Upload } from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import type { UploadMediaItem } from "@/features/vehicle-upload/types/upload.types";
import { cn } from "@/utils";

function createMediaItem(file: File, isPrimary: boolean): UploadMediaItem {
  return {
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: "photo",
    name: file.name,
    previewUrl: URL.createObjectURL(file),
    isPrimary,
    uploadProgress: 12,
    angleTag: "other",
  };
}

export function StepMedia() {
  const { data, setMedia, markStepComplete } = useUploadWizard();
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (files: FileList) => {
      const incoming = Array.from(files).map((file) => createMediaItem(file, false));
      setMedia((currentMedia) => {
        const hasPrimary = currentMedia.some((item) => item.isPrimary);
        const nextIncoming = incoming.map((item, index) => ({
          ...item,
          isPrimary: !hasPrimary && currentMedia.length === 0 && index === 0,
        }));
        return [...currentMedia, ...nextIncoming];
      });

      for (const item of incoming) {
        window.setTimeout(() => {
          setMedia(
            (currentMedia) => currentMedia.map((current) =>
              current.id === item.id
                ? { ...current, uploadProgress: 45 }
                : current,
            ),
          );
        }, 220);

        window.setTimeout(() => {
          setMedia(
            (currentMedia) => currentMedia.map((current) =>
              current.id === item.id
                ? { ...current, uploadProgress: 100 }
                : current,
            ),
          );
        }, 650);
      }
    },
    [setMedia],
  );

  const setPrimary = useCallback(
    (id: string) => {
      setMedia((currentMedia) => currentMedia.map((m) => ({ ...m, isPrimary: m.id === id })));
    },
    [setMedia],
  );

  const removeItem = useCallback(
    (id: string) => {
      setMedia((currentMedia) => {
        const next = currentMedia.filter((m) => m.id !== id);
        if (next.length > 0 && !next.some((m) => m.isPrimary)) {
          const first = next[0]!;
          return [{ ...first, isPrimary: true }, ...next.slice(1)];
        }
        return next;
      });
    },
    [setMedia],
  );

  const moveItem = useCallback(
    (id: string, direction: -1 | 1) => {
      setMedia((currentMedia) => {
        const index = currentMedia.findIndex((m) => m.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= currentMedia.length) return currentMedia;
        const next = [...currentMedia];
        const current = next[index];
        const swap = next[target];
        if (!current || !swap) return currentMedia;
        next[index] = swap;
        next[target] = current;
        return next;
      });
    },
    [setMedia],
  );

  function validate() {
    if (data.media.filter((item) => item.kind === "photo").length === 0) {
      setValidationError("Upload at least one vehicle photo to continue.");
      return false;
    }

    setValidationError(null);
    markStepComplete();
    return true;
  }

  const photoCount = data.media.filter((m) => m.kind === "photo").length;

  return (
    <UploadStepLayout stepId="media">
      <div
        className={cn(
          uploadPolish.uploadZone,
          dragOver ? uploadPolish.uploadZoneActive : uploadPolish.uploadZoneIdle,
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        aria-label="Add photographs. Drag them in, or press to choose from this device."
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            photoInputRef.current?.click();
          }
        }}
      >
        <div className="flex size-16 items-center justify-center rounded-[var(--radius-2xl)] bg-[var(--color-primary-muted)]">
          <Icon icon={Upload} size="lg" tone="primary" aria-hidden />
        </div>
        <div>
          <p className="text-[length:var(--text-body-lg)] font-semibold">Drop your photographs here</p>
          <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            JPG or PNG · Drag to reorder · The first photograph is the one buyers see in search
          </p>
        </div>
        <Button type="button" variant="primary" size="lg" onClick={() => photoInputRef.current?.click()}>
          Choose photographs
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => mobileInputRef.current?.click()}>
            <Icon icon={Smartphone} size="xs" aria-hidden />
            Send from a phone
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
            <Icon icon={ImageIcon} size="xs" aria-hidden />
            Take a photograph
          </Button>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && void addFiles(e.target.files)}
        />
        <input
          ref={mobileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && void addFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => e.target.files && void addFiles(e.target.files)}
        />
      </div>

      {data.media.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/30 px-6 py-10 text-center">
          <Icon icon={ImageIcon} size="lg" tone="muted" aria-hidden />
          <p className="mt-3 text-[length:var(--text-body-md)] font-medium">No photos yet</p>
          <p className="mt-1 max-w-sm text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Listings with professional photos receive up to 2.7× more enquiries. Start with exterior, interior, and engine bay.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            {photoCount} photo{photoCount !== 1 ? "s" : ""} uploaded
            {photoCount < 10 && " · Add more for a higher listing score"}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2" aria-label="Uploaded media">
            {data.media.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  "group flex gap-4 rounded-[var(--radius-xl)] border p-4 transition-all duration-300",
                  item.isPrimary
                    ? "border-[var(--color-primary)]/50 bg-[var(--color-primary-muted)]/25 shadow-[var(--shadow-sm)]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 hover:border-[var(--color-border)] hover:shadow-[var(--shadow-sm)]",
                )}
              >
                <div className="relative size-24 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] shadow-inner">
                  <Image src={item.previewUrl} alt={item.name} fill className="object-cover" unoptimized />
                  {item.isPrimary && (
                    <span className="absolute left-1.5 top-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-2 py-0.5 text-[length:var(--text-caption)] font-semibold text-white shadow-sm">
                      Hero
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[length:var(--text-body-sm)] font-medium">{item.name}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)]">
                    <div
                      className="h-full rounded-[var(--radius-pill)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] transition-[width] duration-500"
                      style={{ width: `${item.uploadProgress}%` }}
                      role="progressbar"
                      aria-valuenow={item.uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {!item.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimary(item.id)}
                        className="inline-flex items-center gap-1 rounded-[var(--radius-md)] px-2 py-1 text-[length:var(--text-caption)] font-medium text-[var(--color-primary-text)] motion-hover hover:bg-[var(--color-hover)]"
                      >
                        <Icon icon={Star} size="xs" aria-hidden />
                        Set as hero
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, -1)}
                      disabled={index === 0}
                      className="rounded-[var(--radius-md)] p-1.5 motion-hover hover:bg-[var(--color-hover)] disabled:opacity-40"
                      aria-label="Move photo up"
                    >
                      <Icon icon={ChevronUp} size="xs" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, 1)}
                      disabled={index === data.media.length - 1}
                      className="rounded-[var(--radius-md)] p-1.5 motion-hover hover:bg-[var(--color-hover)] disabled:opacity-40"
                      aria-label="Move photo down"
                    >
                      <Icon icon={ChevronDown} size="xs" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="inline-flex items-center gap-1 rounded-[var(--radius-md)] px-2 py-1 text-[length:var(--text-caption)] font-medium text-[var(--color-danger)] motion-hover hover:bg-[var(--color-hover)]"
                    >
                      <Icon icon={Trash2} size="xs" aria-hidden />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
          <p className="text-[length:var(--text-body-sm)] font-semibold">Video Walkthroughs</p>
          <p className="mt-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Coming Soon</p>
        </article>
        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
          <p className="text-[length:var(--text-body-sm)] font-semibold">360 Spin Sets</p>
          <p className="mt-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Coming Soon</p>
        </article>
        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
          <p className="text-[length:var(--text-body-sm)] font-semibold">Bulk Media Quality Review</p>
          <p className="mt-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Coming Soon</p>
        </article>
      </div>

      <UploadNavigation onContinue={validate} validationError={validationError} continueLabel="Continue to Licence Disc" />
    </UploadStepLayout>
  );
}
