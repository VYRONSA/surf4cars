import { AdminShellLayout } from "@/components/layout";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminShellLayout>{children}</AdminShellLayout>;
}
