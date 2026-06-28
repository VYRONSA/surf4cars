import { DeveloperShellLayout } from "@/components/layout";

export default function DeveloperLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DeveloperShellLayout>{children}</DeveloperShellLayout>;
}
