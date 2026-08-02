import { BackNavigationBar } from "@/components/navigation/back-navigation-bar";

/**
 * The auth screens have no shell — they are deliberately bare so nothing competes with the form.
 * They still need a way out: somebody who reaches sign-in from a guarded page and decides not to
 * sign in has, without this, only the browser's own control.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <BackNavigationBar />
      {children}
    </>
  );
}
