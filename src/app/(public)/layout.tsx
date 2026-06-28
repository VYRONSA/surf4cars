import { PublicShellLayout } from "@/components/layout";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PublicShellLayout>{children}</PublicShellLayout>;
}
