import { BackNavigationBar } from "@/components/navigation/back-navigation-bar";

/**
 * The design-system reference is the one route that belongs to no route group, so it inherits only
 * the root layout — and was the one page with no way back. It has its own section navigation and no
 * portal shell by design, so it takes the Back control on its own rather than a shell it does not
 * want.
 */
export default function DesignSystemLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <BackNavigationBar />
      {children}
    </>
  );
}
