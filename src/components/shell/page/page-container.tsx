import type { ReactNode } from "react";

import { cn } from "@/utils";

export type PageVariant =
  | "full-width"
  | "contained"
  | "dashboard"
  | "workspace"
  | "marketing"
  | "analytics"
  | "authentication";

const variantClasses: Record<PageVariant, string> = {
  "full-width": "w-full max-w-none px-0",
  contained: "mx-auto w-full max-w-[var(--container-xl)] px-4 lg:px-6",
  dashboard: "mx-auto w-full max-w-[var(--container-2xl)] px-4 py-6 lg:px-8 lg:py-8",
  workspace: "mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8",
  marketing: "mx-auto w-full max-w-[var(--container-xl)] px-4 py-10 lg:px-6 lg:py-16",
  analytics: "mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-8",
  authentication: "mx-auto flex w-full max-w-md flex-col px-4 py-12",
};

export interface PageContainerProps {
  readonly variant?: PageVariant;
  readonly children: ReactNode;
  readonly className?: string;
}

export function PageContainer({
  variant = "dashboard",
  children,
  className,
}: PageContainerProps) {
  return (
    <div className={cn("flex-1", variantClasses[variant], className)}>
      {children}
    </div>
  );
}

export interface PageHeaderProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly breadcrumbs?: ReactNode;
  readonly className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6 lg:mb-8", className)}>
      {breadcrumbs && (
        <div className="mb-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {breadcrumbs}
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h2)]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] lg:text-[length:var(--text-body-md)]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function PageSection({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <section className={cn("mb-8 last:mb-0", className)}>{children}</section>;
}
