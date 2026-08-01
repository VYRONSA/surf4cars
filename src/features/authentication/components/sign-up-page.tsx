import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { AuthShell, AuthShellLink } from "@/features/authentication/components/auth-shell";

export function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Join"
      heading="Create your account"
      description="Two ways in. Pick the one that describes you."
      footer={<AuthShellLink href="/auth/sign-in">Already have an account? Sign in</AuthShellLink>}
    >
      {/*
        Two choices, as a list rather than as cards.
        ===========================================
        This was a bordered panel containing two more bordered panels, each with its own uppercase
        eyebrow — "BUYER", "DEALER" — restating the heading directly beneath it. Three boxes and two
        redundant labels to ask one question.

        The dealer copy also read "activate your command centre", which is what the product team call
        the dealer dashboard. Nobody registering a dealership has heard the phrase.
      */}
      <ul className="space-y-3">
        {[
          {
            href: "/auth/sign-up/buyer",
            title: "I'm looking for a car",
            detail: "Save vehicles, follow price changes, and keep your enquiries in one place.",
          },
          {
            href: "/auth/sign-up/dealer",
            title: "I sell cars",
            detail: "List your stock, reach buyers across South Africa, and manage it from one desk.",
          },
        ].map((option) => (
          <li key={option.href}>
            <Link
              href={option.href}
              className="motion-card group block rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              <span className="flex items-center justify-between gap-4">
                <span className="text-[length:var(--text-body-lg)] font-medium text-[var(--color-foreground)]">
                  {option.title}
                </span>
                <Icon
                  icon={ArrowRight}
                  aria-hidden
                  className="size-4 shrink-0 text-[var(--color-muted)] transition-transform motion-hover group-hover:translate-x-0.5"
                />
              </span>
              <span className="mt-1.5 block text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
                {option.detail}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AuthShell>
  );
}
