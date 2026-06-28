import Image from "next/image";
import Link from "next/link";

import { BRAND_LOGO } from "@/config/branding";
import { cn } from "@/utils";

const LOGO_SIZE_CLASS = {
  header:
    "h-[3.125rem] w-auto max-h-[52px] sm:h-[3.25rem] sm:max-h-[52px] lg:h-[3.35rem] lg:max-h-[54px]",
  footer: "h-11 w-auto max-h-[44px] sm:h-12 sm:max-h-[48px]",
  shell: "h-9 w-auto max-h-[38px] lg:h-[46px] lg:max-h-[48px]",
  onboarding: "h-9 w-auto max-h-[38px] lg:h-10 lg:max-h-[40px]",
  loading: "h-12 w-auto max-h-[48px]",
  compact: "h-8 w-auto max-h-[32px]",
} as const;

export type SurfLogoVariant = keyof typeof LOGO_SIZE_CLASS;

export interface SurfLogoProps {
  readonly variant?: SurfLogoVariant;
  readonly priority?: boolean;
  readonly className?: string;
  readonly imageClassName?: string;
}

export function SurfLogo({
  variant = "header",
  priority = false,
  className,
  imageClassName,
}: SurfLogoProps) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center", className)}>
      <Image
        src={BRAND_LOGO.src}
        alt={BRAND_LOGO.alt}
        width={BRAND_LOGO.width}
        height={BRAND_LOGO.height}
        priority={priority}
        sizes="(max-width: 640px) 160px, 220px"
        className={cn("object-contain object-left", LOGO_SIZE_CLASS[variant], imageClassName)}
      />
    </span>
  );
}

export interface SurfLogoLinkProps extends SurfLogoProps {
  readonly href?: string;
  readonly ariaLabel?: string;
}

export function SurfLogoLink({
  href = "/",
  ariaLabel = "SURF FOR CARS home",
  ...logoProps
}: SurfLogoLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex shrink-0 rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
    >
      <SurfLogo {...logoProps} />
    </Link>
  );
}
