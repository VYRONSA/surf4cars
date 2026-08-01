import type { ReactNode } from "react";

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
}

/**
 * Error copy, written for a customer rather than for a log.
 *
 * The `code` field is gone with the text that needed it. It printed "403", "NETWORK", "MAINTENANCE"
 * and "OFFLINE" above the heading in small caps — HTTP status codes and internal enum names, shown
 * to somebody who has just been stopped from doing something. A status code helps an engineer read a
 * trace; on a page it only tells a customer that the site is talking to itself.
 *
 * "Access denied" went with it. It is the vocabulary of a security system, and the situation it
 * usually describes is far more ordinary: somebody followed a link into a part of the platform their
 * account does not open.
 */
export const ERROR_CONFIG: Record<ErrorType, ErrorConfig> = {
  "404": {
    title: "That page has moved on.",
    description: "The link may be old, or the vehicle may have sold. The marketplace is still here.",
  },
  "500": {
    title: "Something broke on our side.",
    description: "This is us, not you. Try again in a moment.",
  },
  network: {
    title: "We could not reach the marketplace.",
    description: "Check your connection and try again.",
  },
  permission: {
    title: "This part of SURF4CARS is not open to your account.",
    description: "Dealer and operations areas need the right sign-in. Everything a buyer needs is on the marketplace.",
  },
  maintenance: {
    title: "Back shortly.",
    description: "We are making changes to the platform. Nothing has been lost.",
  },
  offline: {
    title: "You are offline.",
    description: "The marketplace will be here when the connection is.",
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
      /* Left-aligned, in the page's own container. It was centred, in a 50vh block, under a
         separate copy of the logo — which on a public route sat directly beneath the site header's
         wordmark, showing the brand twice in 200px, the second time as the legacy raster asset. */
      className={cn("mx-auto w-full max-w-[var(--container-2xl)] px-5 py-24 lg:px-8 lg:py-32", className)}
      role="alert"
    >
      <h1 className="max-w-2xl text-balance text-[length:var(--text-h2)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
        {title ?? config.title}
      </h1>
      <p className="mt-4 max-w-xl text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
        {description ?? config.description}
      </p>
      {/* No disabled fallback. A greyed-out "Return home" on an error page is a dead end offering a
          way out and refusing it. Callers pass a real action; without one there is simply none. */}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
