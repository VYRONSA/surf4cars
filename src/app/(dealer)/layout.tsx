import { DealerShellLayout } from "@/components/layout";
import { resolvePortalAccess, resolvePortalRedirect } from "@/features/authentication/server/portal-access";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DealerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const returnTo = headerStore.get("x-surf-return-to") ?? "/dealer";
  const access = await resolvePortalAccess("dealer");
  if (!access.allowed) {
    redirect(resolvePortalRedirect("dealer", access.reason, returnTo));
  }

  return <DealerShellLayout>{children}</DealerShellLayout>;
}
