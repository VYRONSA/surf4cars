import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { PageContainer, PageHeader } from "@/components/shell/page/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVE_DEALERSHIP_COOKIE } from "@/features/authentication/constants";

export const metadata: Metadata = {
  title: "Dealer Settings | SURF FOR CARS",
  description: "Manage dealership access, profile entry points, and account handoff links.",
};

const settingSections = [
  {
    title: "Dealership profile",
    description: "Update the public profile, branding, and contact details used across the dealer portal.",
    href: "/dealer/profile",
    action: "Open profile",
  },
  {
    title: "Team access",
    description: "Review staff memberships, roles, and branch assignments.",
    href: "/dealer/team",
    action: "Manage team",
  },
  {
    title: "Branch coverage",
    description: "Keep branch contact details and operating hours aligned with the live dealership record.",
    href: "/dealer/branches",
    action: "Manage branches",
  },
  {
    title: "Inventory workspace",
    description: "Jump back into stock, publishing, and market intelligence without resetting context.",
    href: "/dealer/inventory",
    action: "Open inventory",
  },
  {
    title: "New listing flow",
    description: "Resume the AI listing builder, draft recovery, and publish workflow.",
    href: "/dealer/inventory/new",
    action: "Create listing",
  },
  {
    title: "Market intelligence",
    description: "Review pricing guidance, demand signals, and live inventory performance.",
    href: "/dealer/market",
    action: "Open market view",
  },
] as const;

export default async function DealerSettingsRoutePage() {
  const cookieStore = await cookies();
  const initialDealershipId = cookieStore.get(ACTIVE_DEALERSHIP_COOKIE)?.value ?? null;

  return (
    <PageContainer variant="dashboard">
      <PageHeader
        title="Dealer Settings"
        description="Use this area to move between the core dealer management surfaces without resetting the live dealership context."
      />

      <div className="mb-6 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/60 px-4 py-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {initialDealershipId ? (
          <>
            Active dealership: <span className="font-medium text-[var(--color-foreground)]">{initialDealershipId}</span>
          </>
        ) : (
          "No active dealership context detected. Open a dealership first to sync settings and session state."
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {settingSections.map((section) => (
          <Card key={section.href} variant="elevated" padding="lg">
            <CardHeader className="pb-2">
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={section.href}
                className="inline-flex items-center text-[length:var(--text-body-sm)] font-medium text-[var(--color-primary-text)] hover:underline"
              >
                {section.action}
              </Link>
            </CardContent>
          </Card>
        ))}

        <Card variant="elevated" padding="lg" className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Logout and session recovery</CardTitle>
            <CardDescription>
              Sign out from the app header when you need to switch accounts. The dealer shell will restore the active dealership after refresh as long as the browser session remains intact.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dealer/dashboard"
              className="inline-flex items-center text-[length:var(--text-body-sm)] font-medium text-[var(--color-primary-text)] hover:underline"
            >
              Return to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}