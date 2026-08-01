"use client";

import Image from "next/image";

import {
  galleryCategoryLabel,
  useVehicleGallery,
} from "@/features/vehicle/components/vehicle-gallery-context";
import { cn } from "@/utils";

/**
 * The rest of the photographs.
 *
 * Full-bleed and scrolled horizontally, so the second, third and fourth frames are shown at a size
 * worth looking at rather than indexed at 96×64. A buyer deciding on a car looks at the interior and
 * the wheels; those were the images this page used to render smallest.
 *
 * It sits after the description rather than under the hero, which is the one structural thing the
 * story order changes: photograph, name, price, a paragraph about the car, and *then* the gallery —
 * so a buyer is told what they are looking at before being handed more of it.
 */
export interface VehicleDetailGalleryStripProps {
  readonly title: string;
  readonly className?: string;
}

export function VehicleDetailGalleryStrip({ title, className }: VehicleDetailGalleryStripProps) {
  const { images, open } = useVehicleGallery();

  /* The lead photograph is the hero. Repeating it here would open the gallery on a picture the
     buyer has just scrolled past. */
  const rest = images.slice(1);
  if (rest.length === 0) return null;

  return (
    <div
      className={cn(
        /*
          Full-bleed, and rendered outside the two-column grid rather than inside it.

          Two earlier attempts are worth recording because both looked plausible. Leaving the strip in
          the content column clipped the fourth photograph at the column edge — the interface winning
          a fight with the vehicle. Breaking out with `left-1/2 w-screen -translate-x-1/2` then put it
          underneath the sticky purchase rail, and mispositioned it besides: that idiom assumes the
          element sits in a container centred in the viewport, and the left column of an asymmetric
          grid is not. It measured 50% of an 880px column against 50% of a 1440px viewport and landed
          228px off the left edge.

          So the page composes it as its own band between the description and the grid. No arithmetic,
          nothing to overlap, and the strip is genuinely the width of the screen.

          Left padding lines the first frame up with the text above it; there is deliberately none on
          the right, so the strip runs off the edge and reads as continuing.
        */
        "flex gap-3 overflow-x-auto pb-2 pl-5 lg:gap-4 lg:pl-8",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role="list"
      aria-label={`${title} photographs`}
    >
      {rest.map((image, index) => {
        const label = galleryCategoryLabel(image);

        return (
          <button
            key={image.id}
            type="button"
            role="listitem"
            onClick={() => open(index + 1)}
            aria-label={
              label ? `Open ${label.toLowerCase()} photograph` : `Open photograph ${index + 2}`
            }
            className={cn(
              "group relative h-44 w-64 shrink-0 overflow-hidden rounded-[var(--radius-lg)] sm:h-52 sm:w-80 lg:h-60 lg:w-[22rem]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
            )}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 256px, 352px"
              className="object-cover transition-transform duration-[var(--duration-slower)] ease-[var(--ease-premium)] group-hover:scale-[1.05]"
              style={{ objectPosition: image.objectPosition ?? "center" }}
            />
            {label && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-8 text-left text-[length:var(--text-caption)] font-medium text-white">
                {label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
