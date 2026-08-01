import Link from "next/link";
import type { Metadata } from "next";

import { ErrorView } from "@/components/shell";

export const metadata: Metadata = {
  title: "Access Denied",
  description: "You do not have access to this area.",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <ErrorView
      type="permission"
      action={
        <Link
          href="/"
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-2 text-[length:var(--text-body-sm)] font-medium motion-hover hover:bg-[var(--color-hover)]"
        >
          Return home
        </Link>
      }
    />
  );
}
