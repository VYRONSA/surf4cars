"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { resolveSafeAuthRedirectPath, setClientAuthUserType, syncClientSessionState } from "@/features/authentication";

export function BuyerSignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => resolveSafeAuthRedirectPath(searchParams.get("redirect"), "/buyer/intelligence"),
    [searchParams],
  );

  const [fullName, setFullName] = useState("");
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
      if (!supabase) {
        setClientAuthUserType("buyer");
        router.replace(redirectTo);
        return;
      }

      const signUp = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: "buyer",
          },
        },
      });

      if (signUp.error) {
        throw signUp.error;
      }

      if (!signUp.data.session || !signUp.data.session.user.email_confirmed_at) {
        if (process.env.NODE_ENV !== "production") {
          setClientAuthUserType("buyer");
          router.replace(redirectTo);
          return;
        }

        setError("Check your inbox to verify your email, then sign in to continue.");
        return;
      }

      syncClientSessionState({
        accessToken: signUp.data.session.access_token,
        userType: "buyer",
      });
      router.replace(redirectTo);
    } catch (submitError) {
      const message = submitError instanceof Error
        ? submitError.message
        : "Unable to sign up right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Buyers"
      heading="Create your buyer account"
      /* Was "Sign in to save vehicles… and access your buyer workspace" — the wrong verb on a
         page that creates an account, and "workspace" is what we call it internally. */
      description="Save the cars you like, follow their prices, and keep your enquiries together."
    >

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="buyer-full-name" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Full name
            </label>
            <Input
              id="buyer-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="buyer-email" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Email
            </label>
            <Input
              id="buyer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="buyer-password" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Password
            </label>
            <Input
              id="buyer-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>

          {error ? (
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            Create account
          </Button>
        </form>
    </AuthShell>
  );
}
