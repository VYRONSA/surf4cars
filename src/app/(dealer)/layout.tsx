import { DealerShellLayout } from "@/components/layout";

export default function DealerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DealerShellLayout>{children}</DealerShellLayout>;
}
