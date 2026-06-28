"use client";

import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public/footer/public-footer";
import { PublicHeader } from "@/components/public/header/public-header";
import { cn } from "@/utils";

export type PublicPageWidth = "full" | "contained" | "narrow" | "wide";

const widthClasses: Record<PublicPageWidth, string> = {
  full: "w-full max-w-none",
  contained: "mx-auto w-full max-w-[var(--container-xl)] px-4 lg:px-6",
  narrow: "mx-auto w-full max-w-[var(--container-md)] px-4 lg:px-6",
  wide: "mx-auto w-full max-w-[var(--container-2xl)] px-4 lg:px-6",
};

export interface PublicExperienceLayoutProps {
  readonly children: ReactNode;
  readonly showFooter?: boolean;
  readonly className?: string;
}

export function PublicExperienceLayout({
  children,
  showFooter = true,
  className,
}: PublicExperienceLayoutProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-[var(--color-background)]", className)}>
      <PublicHeader />
      <main
        id="main-content"
        className="flex flex-1 flex-col"
        tabIndex={-1}
      >
        {children}
      </main>
      {showFooter && <PublicFooter />}
    </div>
  );
}

export interface PublicPageFrameProps {
  readonly width?: PublicPageWidth;
  readonly children: ReactNode;
  readonly className?: string;
}

export function PublicPageFrame({
  width = "contained",
  children,
  className,
}: PublicPageFrameProps) {
  return (
    <div className={cn("flex-1 py-6 lg:py-10", widthClasses[width], className)}>
      {children}
    </div>
  );
}
