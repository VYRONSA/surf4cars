"use client";

import { ErrorView } from "@/components/shell";

export default function GlobalError({
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <ErrorView
      type="500"
      action={
        <button
          type="button"
          onClick={reset}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-2 text-[length:var(--text-body-sm)] font-medium motion-hover hover:bg-[var(--color-hover)]"
        >
          Try again
        </button>
      }
    />
  );
}
