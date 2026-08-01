import { OperationsShellLayout } from "@/components/layout";
import { resolvePortalAccess } from "@/features/authentication/server/portal-access";
import { redirect } from "next/navigation";

export default async function OperationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const access = await resolvePortalAccess("operations");
  if (!access.allowed) {
    redirect("/unauthorized");
  }

  return <OperationsShellLayout>{children}</OperationsShellLayout>;
}
