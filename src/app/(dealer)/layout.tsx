import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { DealerShellLayout } from "@/components/layout";
import { ACTIVE_DEALERSHIP_COOKIE } from "@/features/authentication/constants";
import { listDealerMemberships } from "@/features/authentication/server/dealer-membership";
import {
  resolveAuthenticatedUserId,
  resolvePortalAccess,
  resolvePortalRedirect,
} from "@/features/authentication/server/portal-access";
import { DealerWorkspaceSetup } from "@/features/dealer-command-centre/components/dealer-workspace-setup";

export default async function DealerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const returnTo = headerStore.get("x-surf-return-to") ?? "/dealer";
  const access = await resolvePortalAccess("dealer");
  if (!access.allowed) {
    redirect(resolvePortalRedirect("dealer", access.reason, returnTo));
  }

  /*
    Which dealership, resolved from the account rather than assumed from a cookie.
    =============================================================================
    The portal used to read the active dealership from a cookie written once during onboarding, and
    nothing ever derived it from the signed-in user. Sign in on a second device, clear cookies, or
    accept a staff invitation and every screen rendered empty above the instruction "Select an active
    dealership" — with no selector anywhere to follow it.

    The membership has been in `dealership_staff_memberships.user_id` since SFC-102. Nothing read it.

    The cookie still wins when it is present: switching dealership is the dealer's choice, and this
    must not drag them back to their first membership on every navigation.
  */
  const cookieStore = await cookies();
  const activeDealershipId = cookieStore.get(ACTIVE_DEALERSHIP_COOKIE)?.value?.trim();

  if (!activeDealershipId) {
    const userId = await resolveAuthenticatedUserId();
    const memberships = userId ? await listDealerMemberships(userId) : [];
    return (
      <DealerShellLayout>
        <DealerWorkspaceSetup memberships={memberships} />
      </DealerShellLayout>
    );
  }

  return <DealerShellLayout>{children}</DealerShellLayout>;
}
