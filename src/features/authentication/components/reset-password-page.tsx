"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { AuthShell, AuthShellLink } from "@/features/authentication/components/auth-shell";
import {
  resolvePreferredClientAuthRedirectPath,
  resolveUserTypeFromSupabaseSession,
  setClientAuthUserType,
  syncClientSessionState,
} from "@/features/authentication";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type AuthPortal = "dealer" | "buyer";

function normalizePortal(input: string | null): AuthPortal {
  return input === "buyer" ? "buyer" : "dealer";
}

function resolveFallbackPath(portal: AuthPortal): string {
  return portal === "buyer" ? "/buyer/intelligence" : "/dealer/dashboard";
}

function resolveFallbackUserType(portal: AuthPortal) {
  return portal === "buyer" ? "buyer" : "dealer-owner";
}

export function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const portal = useMemo(() => normalizePortal(searchParams.get("portal")), [searchParams]);
  const fallbackPath = useMemo(() => resolveFallbackPath(portal), [portal]);
  const redirectTo = useMemo(
    () => resolvePreferredClientAuthRedirectPath(portal, searchParams.get("redirect"), fallbackPath),
    [fallbackPath, portal, searchParams],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const fallbackUserType = resolveFallbackUserType(portal);

      if (!supabase) {
        setClientAuthUserType(fallbackUserType);
        router.replace(redirectTo);
        return;
      }

      const update = await supabase.auth.updateUser({ password });
      if (update.error) {
        if (process.env.NODE_ENV !== "production") {
          setClientAuthUserType(fallbackUserType);
          router.replace(redirectTo);
          return;
        }
        throw update.error;
      }

      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;

      if (!session) {
        router.replace(`/auth/sign-in?portal=${portal}`);
        return;
      }

      const userType = resolveUserTypeFromSupabaseSession(session) ?? fallbackUserType;
      syncClientSessionState({
        accessToken: session.access_token,
        userType,
      });
      router.replace(redirectTo);
    } catch (submitError) {
      if (process.env.NODE_ENV !== "production") {
        const fallbackUserType = resolveFallbackUserType(portal);
        setClientAuthUserType(fallbackUserType);
        router.replace(redirectTo);
        return;
      }

      const message = submitError instanceof Error
        ? submitError.message
        : "Unable to reset password right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account"
      heading="Set a new password"
      description="Choose a strong password for your account."
    >

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="reset-password" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              New password
            </label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          <div>
            <label htmlFor="reset-password-confirm" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Confirm password
            </label>
            <Input
              id="reset-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          {error ? (
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            Update password
          </Button>
        </form>

        <div className="mt-5 text-[length:var(--text-caption)]">
          <AuthShellLink href={`/auth/sign-in?portal=${portal}`}>Back to sign in</AuthShellLink>
        </div>
    </AuthShell>
  );
}
