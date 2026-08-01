"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Icon } from "@/components/ui/icons";
import { ChevronLeft, ChevronRight, X } from "@/components/ui/icons/registry";
import type { VehicleGalleryImage } from "@/features/vehicle/types/vehicle.types";

/**
 * One lightbox, opened from anywhere on the page.
 *
 * The hero and the filmstrip used to be one component because they shared this state. The story
 * order the page now follows puts a paragraph between them — photograph, name, price, then the
 * writing, and only then the rest of the gallery — so they had to come apart, and the state had to
 * go somewhere both could reach.
 *
 * A context rather than two independent lightboxes: two would each hold their own index, so opening
 * the fourth photograph from the strip and pressing the left arrow twice would land somewhere the
 * hero's copy had never heard of.
 */

const CATEGORY_LABELS: Record<NonNullable<VehicleGalleryImage["category"]>, string> = {
  exterior: "Exterior",
  interior: "Interior",
  wheels: "Wheels",
  engine: "Engine",
  boot: "Boot",
  dashboard: "Dashboard",
  "rear-seats": "Rear seats",
};

/**
 * The caption, or none.
 *
 * An uncategorised frame gets no caption rather than a guessed one. This used to default to
 * "Exterior", which captioned interiors, dashboards and engine bays as exteriors on every gallery on
 * the platform — a label is a claim, and a wrong one sitting on top of a photograph is worse than no
 * label at all, because the photograph is right there contradicting it.
 */
export const galleryCategoryLabel = (image: VehicleGalleryImage): string | undefined =>
  image.category ? CATEGORY_LABELS[image.category] : undefined;

interface VehicleGalleryContextValue {
  readonly images: readonly VehicleGalleryImage[];
  readonly open: (index: number) => void;
}

const VehicleGalleryContext = createContext<VehicleGalleryContextValue | null>(null);

export function useVehicleGallery(): VehicleGalleryContextValue {
  const context = useContext(VehicleGalleryContext);
  if (!context) {
    throw new Error("useVehicleGallery must be used within VehicleGalleryProvider");
  }
  return context;
}

export interface VehicleGalleryProviderProps {
  readonly images: readonly VehicleGalleryImage[];
  readonly title: string;
  readonly children: ReactNode;
}

export function VehicleGalleryProvider({ images, title, children }: VehicleGalleryProviderProps) {
  const [index, setIndex] = useState<number | null>(null);
  const total = images.length;

  const open = useCallback((next: number) => setIndex(next), []);
  const close = useCallback(() => setIndex(null), []);
  const goNext = useCallback(
    () => setIndex((i) => (i === null ? null : (i + 1) % total)),
    [total],
  );
  const goPrev = useCallback(
    () => setIndex((i) => (i === null ? null : (i - 1 + total) % total)),
    [total],
  );

  useEffect(() => {
    if (index === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, goNext, goPrev]);

  const value = useMemo(() => ({ images, open }), [images, open]);
  const active = index === null ? undefined : images[index];

  return (
    <VehicleGalleryContext.Provider value={value}>
      {children}

      {active && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/96 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} gallery`}
        >
          <div className="flex items-center justify-between px-5 py-4 lg:px-8">
            <p className="text-[length:var(--text-body-sm)] text-white/70">
              {[galleryCategoryLabel(active), `${(index ?? 0) + 1} of ${total}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <button
              type="button"
              aria-label="Close gallery"
              onClick={close}
              className="motion-button inline-flex size-10 items-center justify-center rounded-[var(--radius-lg)] text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Icon icon={X} aria-hidden className="size-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-8">
            <div className="relative size-full">
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="100vw"
                priority
                className="object-contain"
              />
            </div>

            {total > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photograph"
                  onClick={goPrev}
                  className="motion-button absolute left-4 inline-flex size-12 items-center justify-center rounded-[var(--radius-pill)] border border-white/20 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Icon icon={ChevronLeft} aria-hidden className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next photograph"
                  onClick={goNext}
                  className="motion-button absolute right-4 inline-flex size-12 items-center justify-center rounded-[var(--radius-pill)] border border-white/20 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Icon icon={ChevronRight} aria-hidden className="size-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </VehicleGalleryContext.Provider>
  );
}
