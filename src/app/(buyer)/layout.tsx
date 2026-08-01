import { BuyerShellLayout } from "@/components/layout";
import { resolvePortalAccess, resolvePortalRedirect } from "@/features/authentication/server/portal-access";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function BuyerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const returnTo = headerStore.get("x-surf-return-to") ?? "/buyer";
  const access = await resolvePortalAccess("buyer");
  if (!access.allowed) {
    redirect(resolvePortalRedirect("buyer", access.reason, returnTo));
  }

  return <BuyerShellLayout>{children}</BuyerShellLayout>;
}
