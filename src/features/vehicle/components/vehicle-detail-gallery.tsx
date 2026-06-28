"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ZoomIn,
} from "@/components/ui/icons/registry";
import type { VehicleGalleryImage } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

const CATEGORY_LABELS: Record<VehicleGalleryImage["category"], string> = {
  exterior: "Exterior",
  interior: "Interior",
  wheels: "Wheels",
  engine: "Engine",
  boot: "Boot",
  dashboard: "Dashboard",
  "rear-seats": "Rear seats",
};

export interface VehicleDetailGalleryProps {
  readonly images: readonly VehicleGalleryImage[];
  readonly title: string;
  readonly className?: string;
}

export function VehicleDetailGallery({ images, title, className }: VehicleDetailGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const active = images[activeIndex] ?? images[0];
  const total = images.length;

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % total);
    setZoomed(false);
  }, [total]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + total) % total);
    setZoomed(false);
  }, [total]);

  useEffect(() => {
    if (!fullscreen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen, goNext, goPrev]);

  if (!active) return null;

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div
          className={cn(
            "group relative aspect-[16/10] overflow-hidden rounded-[var(--radius-2xl)]",
            "border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]",
            "shadow-[var(--shadow-md)]",
          )}
        >
          <Image
            src={active.src}
            alt={active.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 70vw"
            className={cn(
              "object-cover motion-card transition-transform duration-500",
              zoomed && "scale-150 cursor-zoom-out",
              !zoomed && "cursor-zoom-in",
            )}
            style={{ objectPosition: active.objectPosition ?? "center" }}
            onClick={() => setZoomed((z) => !z)}
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/40 to-transparent"
            aria-hidden
          />

          <div className="absolute left-4 top-4 z-10">
            <span className="rounded-[var(--radius-pill)] border border-white/20 bg-black/45 px-3 py-1 text-[length:var(--text-caption)] font-medium text-white backdrop-blur-md">
              {CATEGORY_LABELS[active.category]}
            </span>
          </div>

          <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 transition-opacity motion-card group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom image"
              className="border border-white/20 bg-black/45 text-white backdrop-blur-md hover:bg-black/60"
              onClick={() => setZoomed((z) => !z)}
            >
              <Icon icon={ZoomIn} size="sm" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open fullscreen gallery"
              className="border border-white/20 bg-black/45 text-white backdrop-blur-md hover:bg-black/60"
              onClick={() => setFullscreen(true)}
            >
              <Icon icon={Maximize2} size="sm" aria-hidden />
            </Button>
          </div>

          {total > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 border border-white/20 bg-black/45 text-white backdrop-blur-md hover:bg-black/60"
                onClick={goPrev}
              >
                <Icon icon={ChevronLeft} size="sm" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 border border-white/20 bg-black/45 text-white backdrop-blur-md hover:bg-black/60"
                onClick={goNext}
              >
                <Icon icon={ChevronRight} size="sm" aria-hidden />
              </Button>
            </>
          )}

          <div className="absolute bottom-4 right-4 z-10 rounded-[var(--radius-pill)] bg-black/45 px-2.5 py-1 text-[length:var(--text-caption)] text-white backdrop-blur-md">
            {activeIndex + 1} / {total}
          </div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Gallery thumbnails"
        >
          {images.map((image, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={image.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`${CATEGORY_LABELS[image.category]} view`}
                onClick={() => {
                  setActiveIndex(index);
                  setZoomed(false);
                }}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border-2 motion-nav sm:h-20 sm:w-28",
                  selected
                    ? "border-[var(--color-primary)] shadow-[var(--shadow-sm)]"
                    : "border-[var(--color-border-subtle)] opacity-80 hover:opacity-100",
                )}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="112px"
                  className="object-cover"
                  style={{ objectPosition: image.objectPosition ?? "center" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} gallery`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[length:var(--text-body-sm)] font-medium text-white">
              {CATEGORY_LABELS[active.category]} · {activeIndex + 1} of {total}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close gallery"
              className="text-white hover:bg-white/10"
              onClick={() => setFullscreen(false)}
            >
              <Icon icon={X} size="sm" aria-hidden />
            </Button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
            <div className="relative aspect-[16/10] w-full max-w-6xl overflow-hidden rounded-[var(--radius-xl)]">
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="100vw"
                className="object-contain"
                style={{ objectPosition: active.objectPosition ?? "center" }}
                priority
              />
            </div>

            {total > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Previous image"
                  className="absolute left-4 text-white hover:bg-white/10"
                  onClick={goPrev}
                >
                  <Icon icon={ChevronLeft} size="md" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Next image"
                  className="absolute right-4 text-white hover:bg-white/10"
                  onClick={goNext}
                >
                  <Icon icon={ChevronRight} size="md" aria-hidden />
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-6">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={CATEGORY_LABELS[image.category]}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-14 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2",
                  index === activeIndex ? "border-white" : "border-white/30 opacity-60",
                )}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  style={{ objectPosition: image.objectPosition ?? "center" }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
