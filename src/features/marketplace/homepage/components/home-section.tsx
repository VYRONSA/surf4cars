import type { ReactNode } from "react";

import { Text } from "@/components/ui/typography";
import { homePolish } from "@/features/marketplace/homepage/components/home-shared";
import { cn } from "@/utils";

export interface HomeSectionProps {
  readonly id?: string;
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly backgroundSlot?: ReactNode;
  readonly className?: string;
  readonly headerClassName?: string;
  readonly align?: "left" | "center";
  readonly compact?: boolean;
}

export function HomeSection({
  id,
  eyebrow,
  title,
  description,
  children,
  backgroundSlot,
  className,
  headerClassName,
  align = "left",
  compact = false,
}: HomeSectionProps) {
  return (
    <section
      id={id}
      className={cn(homePolish.section, compact && "py-12 lg:py-16", className)}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      {backgroundSlot}

      <div className="relative mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <header
          className={cn(
            homePolish.sectionHeader,
            align === "center" && homePolish.sectionHeaderCenter,
            headerClassName,
          )}
        >
          {eyebrow && (
            <Text variant="overline" tone="primary" className="mb-2.5 block">
              {eyebrow}
            </Text>
          )}
          <Text
            id={id ? `${id}-heading` : undefined}
            variant="h2"
            as="h2"
            className="text-balance tracking-[var(--tracking-heading)]"
          >
            {title}
          </Text>
          {description && (
            <Text
              variant="body-lg"
              tone="muted"
              className={cn(
                "mt-4 max-w-2xl text-pretty leading-[var(--leading-relaxed)]",
                align === "center" && "mx-auto",
              )}
            >
              {description}
            </Text>
          )}
        </header>
        {children}
      </div>
    </section>
  );
}
