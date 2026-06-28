import Image from "next/image";

import {
  HERO_OBJECT_POSITION,
  HERO_OVERLAY_GRADIENTS,
  type HeroObjectPosition,
  type HeroOverlayVariant,
} from "@/config/images";
import { cn } from "@/utils";

export interface HeroImageBackgroundProps {
  readonly src: string;
  readonly alt: string;
  readonly priority?: boolean;
  readonly sizes?: string;
  readonly overlay?: boolean;
  readonly overlayVariant?: HeroOverlayVariant;
  readonly overlayClassName?: string;
  readonly objectPosition?: HeroObjectPosition;
  readonly className?: string;
  readonly imageClassName?: string;
}

export function HeroImageBackground({
  src,
  alt,
  priority = false,
  sizes = "100vw",
  overlay = true,
  overlayVariant = "cinematic",
  overlayClassName,
  objectPosition = "heroSubject",
  className,
  imageClassName,
}: HeroImageBackgroundProps) {
  const resolvedOverlay =
    overlayClassName ?? HERO_OVERLAY_GRADIENTS[overlayVariant];

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "object-cover",
          HERO_OBJECT_POSITION[objectPosition],
          imageClassName,
        )}
      />
      {overlay && (
        <div className={cn("absolute inset-0", resolvedOverlay)} aria-hidden />
      )}
    </div>
  );
}
