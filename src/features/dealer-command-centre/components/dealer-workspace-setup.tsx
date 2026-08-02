"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { setClientActiveDealershipContext } from "@/features/authentication";
import type { DealerMembership } from "@/features/authentication/server/dealer-membership";

/**
 * Establishing which dealership a signed-in dealer is working in.
 *
 * WHAT THIS REPLACES
 * ==================
 * "Select an active dealership to load live dashboard data." — rendered on an otherwise empty
 * dashboard, with no selector anywhere on the page, above six cards each reporting that the
 * dealership had no vehicles. The inventory screen's version of the same problem was a text input
 * labelled **Dealership ID** with the placeholder `dealership-…`, asking a motor dealer to type a
 * database key.
 *
 * The cause was that the active dealership lived only in a cookie written once during onboarding.
 * Nothing derived it from the account, so signing in on a second device, clearing cookies, or being
 * invited as staff all produced the same dead portal.
 *
 * THREE STATES, ALL HONEST
 * ========================
 *   one membership     bind to it and get out of the way — no dealer should have to choose from a
 *                      list of one
 *   several            a real choice, named, because a group with separate entities is ordinary here
 *   none               say so plainly and point at the two ways it gets fixed. This is the state an
 *                      invited colleague lands in, and the old portal told them nothing at all
 *
 * The write happens on the client because a Server Component cannot set cookies, and the context is
 * read from `localStorage` by the rest of the portal — see `setClientActiveDealershipContext`.
 */

export interface DealerWorkspaceSetupProps {
  readonly memberships: readonly DealerMembership[];
}

export function DealerWorkspaceSetup({ memberships }: DealerWorkspaceSetupProps) {
  const router = useRouter();
  const bound = useRef(false);

  const single = memberships.length === 1 ? memberships[0] : null;

  /* One dealership: bind and refresh. The dealer never sees this screen.

     A ref rather than state — writing the cookie is a side effect on an external system, and there
     is no rendered output that depends on whether it has happened. Using state here would schedule
     a render whose only purpose is to remember something the DOM already reflects. */
  useEffect(() => {
    if (!single || bound.current) return;
    bound.current = true;
    setClientActiveDealershipContext({
      dealershipId: single.dealershipId,
      branchId: single.branchId,
    });
    router.refresh();
  }, [single, router]);

  if (single) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center px-6">
        <p className="text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          Opening {single.dealershipName || "your dealership"}…
        </p>
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60svh] max-w-xl flex-col justify-center px-6">
        <h1 className="text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
          Your account is not linked to a dealership yet
        </h1>
        <p className="mt-4 text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
          SURF4CARS could not find an active staff membership for this sign-in, so there is no
          inventory, no leads and no dashboard to show you. That is a link between your account and a
          dealership, not a problem with either one.
        </p>
        <ul className="mt-6 space-y-3 text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          <li className="flex gap-3">
            <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-[var(--color-muted)]" />
            <span>
              If a colleague invited you, ask them to check the invitation was accepted under{" "}
              <span className="text-[var(--color-foreground)]">Team Management</span>.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-[var(--color-muted)]" />
            <span>
              If you are registering a dealership yourself, complete{" "}
              <a
                href="/auth/sign-up/dealer"
                className="text-[var(--color-foreground)] underline decoration-[var(--color-border-strong)] underline-offset-4 hover:decoration-[var(--color-primary)]"
              >
                dealership registration
              </a>
              .
            </span>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60svh] max-w-xl flex-col justify-center px-6">
      <h1 className="text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
        Which dealership are you working in?
      </h1>
      <p className="mt-3 text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
        Your account has access to {memberships.length}. You can switch at any time.
      </p>

      <ul className="mt-8 space-y-2">
        {memberships.map((membership) => (
          <li key={`${membership.dealershipId}-${membership.branchId ?? "all"}`}>
            <button
              type="button"
              onClick={() => {
                setClientActiveDealershipContext({
                  dealershipId: membership.dealershipId,
                  branchId: membership.branchId,
                });
                router.refresh();
              }}
              className="motion-card w-full rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] px-5 py-4 text-left hover:border-[var(--color-border)] hover:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              <span className="block text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)]">
                {membership.dealershipName || "Unnamed dealership"}
              </span>
              {membership.role && (
                <span className="mt-0.5 block text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {membership.role}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
