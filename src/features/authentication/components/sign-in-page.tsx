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

export function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const portal = useMemo(
    () => normalizePortal(searchParams.get("portal")),
    [searchParams],
  );
  const fallbackPath = useMemo(() => resolveFallbackPath(portal), [portal]);
  const redirectTo = useMemo(
    () => resolvePreferredClientAuthRedirectPath(portal, searchParams.get("redirect"), fallbackPath),
    [fallbackPath, portal, searchParams],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const fallbackUserType = resolveFallbackUserType(portal);

      if (!supabase) {
        setClientAuthUserType(fallbackUserType);
        router.replace(redirectTo);
        return;
      }

      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (signIn.error) {
        if (process.env.NODE_ENV !== "production") {
          setClientAuthUserType(fallbackUserType);
          router.replace(redirectTo);
          return;
        }
        throw signIn.error;
      }

      if (!signIn.data.session) {
        throw new Error("Unable to start a session. Please try again.");
      }

      const resolvedUserType = resolveUserTypeFromSupabaseSession(signIn.data.session) ?? fallbackUserType;
      syncClientSessionState({
        accessToken: signIn.data.session.access_token,
        userType: resolvedUserType,
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
        : "Unable to sign in right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const heading = portal === "buyer" ? "Buyer sign in" : "Dealer sign in";

  return (
    <AuthShell
      /* Not "Authentication". That was the name of the system function, printed above the heading on
         a customer-facing page — the clearest possible tell that a screen was built by engineers. */
      eyebrow={portal === "buyer" ? "Buyers" : "Dealers"}
      heading={heading}
      description="Continue with your SURF4CARS account."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AuthShellLink href={`/auth/forgot-password?portal=${portal}`}>
            Forgot your password?
          </AuthShellLink>
          <AuthShellLink href={portal === "buyer" ? "/auth/sign-up/buyer" : "/auth/sign-up/dealer"}>
            Create an account
          </AuthShellLink>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="auth-email"
            className="mb-1.5 block text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]"
          >
            Email
          </label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1.5 block text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]"
          >
            Password
          </label>
          <Input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? (
          <p className="text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={isSubmitting} aria-busy={isSubmitting} className="w-full">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
