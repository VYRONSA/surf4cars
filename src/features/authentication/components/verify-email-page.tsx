"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

export function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const portal = useMemo(() => normalizePortal(searchParams.get("portal")), [searchParams]);
  const fallbackPath = useMemo(() => resolveFallbackPath(portal), [portal]);
  const redirectTo = useMemo(
    () => resolvePreferredClientAuthRedirectPath(portal, searchParams.get("redirect"), fallbackPath),
    [fallbackPath, portal, searchParams],
  );

  const [status, setStatus] = useState<"pending" | "verified" | "error">("pending");
  const [message, setMessage] = useState("Checking verification status...");

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const fallbackUserType = resolveFallbackUserType(portal);

        if (!supabase) {
          setClientAuthUserType(fallbackUserType);
          if (isMounted) {
            setStatus("pending");
            setMessage("Email verification is not active in local fallback mode.");
          }
          return;
        }

        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;

        if (!session || !session.user.email_confirmed_at) {
          if (isMounted) {
            setStatus("pending");
            setMessage("Your email is still pending verification. Use the link in your inbox.");
          }
          return;
        }

        const userType = resolveUserTypeFromSupabaseSession(session) ?? fallbackUserType;
        syncClientSessionState({
          accessToken: session.access_token,
          userType,
        });

        if (isMounted) {
          setStatus("verified");
          setMessage("Email verified. Redirecting...");
          window.setTimeout(() => {
            router.replace(redirectTo);
          }, 500);
        }
      } catch (error) {
        if (!isMounted) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to verify email right now.");
      }
    };

    void check();

    return () => {
      isMounted = false;
    };
  }, [portal, redirectTo, router]);

  return (
    <AuthShell
      eyebrow="Account"
      heading="Verify your email"
      footer={
        status === "verified" ? undefined : (
          <AuthShellLink href={`/auth/sign-in?portal=${portal}`}>Back to sign in</AuthShellLink>
        )
      }
    >
      <p className="text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]" role="status">
        {message}
      </p>
    </AuthShell>
  );
}
