import { PublicShellLayout } from "@/components/layout";

export default function MarketplaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PublicShellLayout>{children}</PublicShellLayout>;
}
