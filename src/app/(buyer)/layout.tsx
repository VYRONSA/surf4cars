import { BuyerShellLayout } from "@/components/layout";

export default function BuyerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <BuyerShellLayout>{children}</BuyerShellLayout>;
}
