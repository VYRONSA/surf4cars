import type { ReactNode } from "react";

import { BackNavigationBar } from "@/components/navigation/back-navigation-bar";
import { PublicExperienceLayout } from "@/components/public/layout/public-layout";
import { AppShell } from "@/components/shell/app-shell/app-shell";
import type { ShellPortal } from "@/components/shell/context";
import { PageContainer } from "@/components/shell/page/page-container";

export interface SurfOsLayoutProps {
  readonly portal: ShellPortal;
  readonly showSidebar?: boolean;
  readonly pageVariant?: "full-width" | "contained" | "dashboard" | "workspace" | "marketing" | "analytics";
  readonly children: ReactNode;
}

export function SurfOsLayout({
  portal,
  showSidebar,
  pageVariant = "dashboard",
  children,
}: SurfOsLayoutProps) {
  return (
    <AppShell portal={portal} showSidebar={showSidebar}>
      {/* Every portal screen gets a Back control from the shell, so no page can ship without one. */}
      <BackNavigationBar />
      <PageContainer variant={pageVariant}>{children}</PageContainer>
    </AppShell>
  );
}

export function PublicShellLayout({ children }: { readonly children: ReactNode }) {
  return <PublicExperienceLayout>{children}</PublicExperienceLayout>;
}

export function BuyerShellLayout({ children }: { readonly children: ReactNode }) {
  return <SurfOsLayout portal="buyer">{children}</SurfOsLayout>;
}

export function DealerShellLayout({ children }: { readonly children: ReactNode }) {
  return <SurfOsLayout portal="dealer">{children}</SurfOsLayout>;
}

export function AdminShellLayout({ children }: { readonly children: ReactNode }) {
  return <SurfOsLayout portal="admin">{children}</SurfOsLayout>;
}

export function DeveloperShellLayout({ children }: { readonly children: ReactNode }) {
  return <SurfOsLayout portal="developer">{children}</SurfOsLayout>;
}

export function OperationsShellLayout({ children }: { readonly children: ReactNode }) {
  return <SurfOsLayout portal="operations" pageVariant="analytics">{children}</SurfOsLayout>;
}
