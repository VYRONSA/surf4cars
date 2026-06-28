import type { ReactNode } from "react";

import { SurfLogoLink } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

export type ErrorType =
  | "404"
  | "500"
  | "network"
  | "permission"
  | "maintenance"
  | "offline";

export interface ErrorConfig {
  readonly title: string;
  readonly description: string;
  readonly code?: string;
}

export const ERROR_CONFIG: Record<ErrorType, ErrorConfig> = {
  "404": {
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved.",
    code: "404",
  },
  "500": {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again later.",
    code: "500",
  },
  network: {
    title: "Network error",
    description: "Unable to connect. Check your internet connection and try again.",
    code: "NETWORK",
  },
  permission: {
    title: "Access denied",
    description: "You don't have permission to view this page.",
    code: "403",
  },
  maintenance: {
    title: "Under maintenance",
    description: "SURF FOR CARS is temporarily unavailable while we perform upgrades.",
    code: "MAINTENANCE",
  },
  offline: {
    title: "You're offline",
    description: "Reconnect to the internet to continue using SURF FOR CARS.",
    code: "OFFLINE",
  },
};

export interface ErrorViewProps {
  readonly type: ErrorType;
  readonly title?: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function ErrorView({
  type,
  title,
  description,
  action,
  className,
}: ErrorViewProps) {
  const config = ERROR_CONFIG[type];

  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center",
        className,
      )}
      role="alert"
    >
      <SurfLogoLink variant="compact" className="mb-8" />
      {config.code && (
        <p className="mb-2 text-[length:var(--text-overline)] font-medium uppercase tracking-[var(--tracking-overline)] text-[var(--color-muted-foreground)]">
          {config.code}
        </p>
      )}
      <h1 className="text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)]">
        {title ?? config.title}
      </h1>
      <p className="mt-2 max-w-md text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
        {description ?? config.description}
      </p>
      {action ?? (
        <div className="mt-6">
          <Button variant="outline" disabled>
            Return home
          </Button>
        </div>
      )}
    </div>
  );
}
