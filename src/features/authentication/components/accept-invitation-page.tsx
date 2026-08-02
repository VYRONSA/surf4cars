"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { AuthShell, AuthShellLink } from "@/features/authentication/components/auth-shell";

/**
 * Accepting a staff invitation.
 *
 * WHY THIS DOES NOT ACCEPT AUTOMATICALLY ON LOAD
 * ==============================================
 * The link is a bearer credential. Opening it is not the same as agreeing to join — a link can be
 * opened by a mail scanner, a preview fetcher, or the wrong person on a shared machine, and any of
 * those would silently bind an account to a dealership. So the token is held and the person has to
 * say yes, with the dealership named in front of them.
 *
 * The failure this screen has to handle well is the common one: the recipient is signed in as
 * somebody else, or not signed in at all. The server refuses, and the message says which address the
 * invitation was sent to, because "unauthorised" would leave them with nothing to do next.
 */
export function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"ready" | "working" | "accepted">("ready");
  const [error, setError] = useState<string | null>(null);

  /* Derived from the URL, not copied into state. The token is whatever the link says it is, and
     mirroring it into state only creates a second version that can disagree. */
  const token = useMemo(() => {
    const value = searchParams.get("token");
    return value && value.trim() ? value.trim() : null;
  }, [searchParams]);

  const accept = useCallback(async () => {
    if (!token) return;
    setState("working");
    setError(null);
    try {
      const response = await fetch("/api/v1/dealer/invitations/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "This invitation could not be accepted.");
      setState("accepted");
      /* Straight to the dashboard rather than a confirmation nobody reads. The membership is live. */
      setTimeout(() => router.push("/dealer/dashboard"), 1200);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This invitation could not be accepted.");
      setState("ready");
    }
  }, [token, router]);

  return (
    <AuthShell
      eyebrow="Invitation"
      heading="Join your dealership on SURF4CARS"
      description="You have been invited to work on a dealership's stock and enquiries."
    >
      {!token ? (
        <Text className="mt-6" role="alert">
          This invitation link is incomplete. Ask whoever invited you to send it again — links expire
          after 14 days and can only be used once.
        </Text>
      ) : null}

      {error ? (
        <Text className="mt-6" role="alert">
          {error}
        </Text>
      ) : null}

      {state === "accepted" ? (
        <Text className="mt-6" role="status">
          You are in. Taking you to your dashboard…
        </Text>
      ) : null}

      {token && state !== "accepted" ? (
        <div className="mt-6 space-y-4">
          <Text className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Sign in with the address the invitation was sent to, then accept. If you are signed in as
            somebody else, this will tell you which address to use.
          </Text>
          <Button type="button" onClick={() => void accept()} disabled={state === "working"}>
            {state === "working" ? "Joining…" : "Accept invitation"}
          </Button>
        </div>
      ) : null}

      <div className="mt-5 text-[length:var(--text-caption)]">
        <AuthShellLink href="/auth/sign-in?portal=dealer">Sign in first</AuthShellLink>
      </div>
    </AuthShell>
  );
}
