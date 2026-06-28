import Image from "next/image";

import { HERO_OBJECT_POSITION, type HeroObjectPosition } from "@/config/images";
import { cn } from "@/utils";

export interface HeroImageProps {
  readonly src: string;
  readonly alt: string;
  readonly priority?: boolean;
  readonly sizes?: string;
  readonly objectPosition?: HeroObjectPosition;
  readonly className?: string;
  readonly imageClassName?: string;
}

/**
 * Contained hero image for cards and split layouts (non full-bleed backgrounds).
 */
export function HeroImage({
  src,
  alt,
  priority = false,
  sizes = "100vw",
  objectPosition = "heroSubject",
  className,
  imageClassName,
}: HeroImageProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
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
    </div>
  );
}
