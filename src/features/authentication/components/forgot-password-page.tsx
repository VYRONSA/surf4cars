"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { AuthShell, AuthShellLink } from "@/features/authentication/components/auth-shell";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type AuthPortal = "dealer" | "buyer";

function normalizePortal(input: string | null): AuthPortal {
  return input === "buyer" ? "buyer" : "dealer";
}

export function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const portal = useMemo(() => normalizePortal(searchParams.get("portal")), [searchParams]);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(false);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setSent(true);
        return;
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003";
      const redirectTo = `${appUrl}/auth/reset-password?portal=${portal}`;
      const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (result.error) {
        if (process.env.NODE_ENV !== "production") {
          setSent(true);
          return;
        }
        throw result.error;
      }

      setSent(true);
    } catch (submitError) {
      const message = submitError instanceof Error
        ? submitError.message
        : "Unable to request password reset right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account"
      heading="Forgot your password?"
      description="Enter your account email and we will send a reset link."
    >

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="forgot-email" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Email
            </label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}

          {sent ? (
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-success)]" role="status">
              If this account exists, a reset link has been sent.
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            Send reset link
          </Button>
        </form>

        <div className="mt-5 text-[length:var(--text-caption)]">
          <AuthShellLink href={`/auth/sign-in?portal=${portal}`}>Back to sign in</AuthShellLink>
        </div>
    </AuthShell>
  );
}
