"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { PageContainer, PageHeader } from "@/components/shell/page/page-container";
import { Text } from "@/components/ui/typography";

/**
 * "That dealership is mine."
 *
 * WHAT THIS SCREEN IS FOR
 * =======================
 * SURF4CARS holds records for dealerships that never created them — they were seeded, or built from
 * a listing feed, or set up by us during onboarding conversations. Until this existed there was no
 * route from "my business is on your site" to "I control my business on your site", and PCP-036
 * measured the consequence: 128 dealerships, none reachable by the people who own them.
 *
 * WHY IT PROMISES A REVIEW RATHER THAN ACCESS
 * ===========================================
 * Approving this instantly would hand any caller another business's inventory, its leads, and the
 * names and telephone numbers of buyers who enquired. So the honest thing to put on the button is
 * what actually happens: a person at SURF4CARS reads this and checks it. Telling a dealer principal
 * they will be in "immediately" and then making them wait two days is worse than saying two days.
 */

interface ClaimRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly dealershipName: string | null;
  readonly status: string;
  readonly decisionNote: string | null;
  readonly createdAt: string;
}

export function ClaimDealershipPage({ dealershipId }: { readonly dealershipId?: string }) {
  const [claims, setClaims] = useState<readonly ClaimRecord[]>([]);
  const [form, setForm] = useState({
    dealershipId: dealershipId ?? "",
    claimantName: "",
    claimantRole: "",
    evidenceNote: "",
  });
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/v1/dealer/ownership/claims");
    if (!response.ok) return [] as ClaimRecord[];
    const payload = await response.json();
    return (payload.claims ?? []) as ClaimRecord[];
  }, []);

  useEffect(() => {
    let cancelled = false;

    void load()
      .then((next) => {
        if (!cancelled) setClaims(next);
      })
      /* Not being able to list past claims must never block making a new one — that would turn a
         read failure into an inability to reach the dealership at all. */
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [load]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/dealer/ownership/claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "That claim could not be submitted.");
      setSubmitted(true);
      setClaims(await load());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That claim could not be submitted.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Claim your dealership"
        description="If your dealership is already on SURF4CARS and you cannot sign in to it, tell us who you are and we will hand it over."
      />

      {error ? (
        <Card className="mt-6 border-[var(--color-danger)]">
          <CardContent>
            <Text role="alert">{error}</Text>
          </CardContent>
        </Card>
      ) : null}

      {claims.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {claims.map((claim) => (
                <div key={claim.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                  <Text className="font-medium">{claim.dealershipName ?? claim.dealershipId}</Text>
                  <Text className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                    {claim.status === "pending"
                      ? "We are checking this. We will email you when it is done."
                      : claim.status === "approved"
                        ? "Approved — this dealership is yours. Sign in and it will be there."
                        : claim.status === "rejected"
                          ? `Not approved. ${claim.decisionNote ?? ""}`
                          : "Withdrawn."}
                  </Text>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {submitted ? (
        <Card className="mt-6">
          <CardContent>
            <Text role="status">
              Thank you — we have your claim. A person here checks each one against the business it
              names, so this is not instant. We will email you either way.
            </Text>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tell us about your dealership</CardTitle>
            <CardDescription>
              A person here reads every claim and checks it against the business. We will email you
              either way.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <label htmlFor="claim-dealership">
                  <Text>Which dealership?</Text>
                </label>
                <Input
                  id="claim-dealership"
                  value={form.dealershipId}
                  onChange={(event) => setForm((current) => ({ ...current, dealershipId: event.target.value }))}
                  required
                />
                <Text className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                  Paste the address of your dealership page on SURF4CARS, or its name.
                </Text>
              </div>

              <div>
                <label htmlFor="claim-name">
                  <Text>Your name</Text>
                </label>
                <Input
                  id="claim-name"
                  value={form.claimantName}
                  onChange={(event) => setForm((current) => ({ ...current, claimantName: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label htmlFor="claim-role">
                  <Text>Your role at the dealership</Text>
                </label>
                <Input
                  id="claim-role"
                  value={form.claimantRole}
                  onChange={(event) => setForm((current) => ({ ...current, claimantRole: event.target.value }))}
                  placeholder="Dealer Principal, Sales Manager…"
                />
              </div>

              <div>
                <label htmlFor="claim-evidence">
                  <Text>Anything that helps us confirm it is you</Text>
                </label>
                <textarea
                  id="claim-evidence"
                  value={form.evidenceNote}
                  onChange={(event) => setForm((current) => ({ ...current, evidenceNote: event.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                  placeholder="Your dealer licence number, your company registration number, or a number we can call and reach you on."
                />
              </div>

              <Button type="submit" disabled={isBusy}>
                {isBusy ? "Sending…" : "Send my claim"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
