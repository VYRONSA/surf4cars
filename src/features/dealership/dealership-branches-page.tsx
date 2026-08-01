"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form";
import { PageContainer, PageHeader } from "@/components/shell/page/page-container";
import { Text } from "@/components/ui/typography";
import { SA_PROVINCES } from "@/features/dealer-onboarding/config/onboarding-config";
import { getActiveDealershipId } from "@/features/inventory/utils/active-dealership";
import {
  getDealershipBranchesData,
  saveDealershipBranchData,
} from "@/features/dealership/services/dealership-management.api";
import type {
  DealershipBranchRecord,
  UpdateBranchRequest,
} from "@/features/dealership/types/dealership-management.types";

function toDraft(branch: DealershipBranchRecord): UpdateBranchRequest {
  return {
    name: branch.name,
    address: branch.address,
    province: branch.province,
    city: branch.city,
    postalCode: branch.postalCode,
    telephone: branch.telephone,
    whatsapp: branch.whatsapp,
    email: branch.email,
    businessHours: branch.businessHours,
    branchManager: branch.branchManager,
  };
}

export function DealershipBranchesPage({
  initialDealershipId = null,
}: {
  readonly initialDealershipId?: string | null;
}) {
  const [dealershipId, setDealershipId] = useState<string | null>(initialDealershipId);
  const [branches, setBranches] = useState<readonly DealershipBranchRecord[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UpdateBranchRequest | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(initialDealershipId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialDealershipId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextDealershipId = getActiveDealershipId();
      setDealershipId(nextDealershipId);
      setIsLoading(Boolean(nextDealershipId));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialDealershipId]);

  useEffect(() => {
    if (!dealershipId) {
      return;
    }

    let cancelled = false;

    void getDealershipBranchesData(dealershipId)
      .then((next) => {
        if (cancelled) return;
        setBranches(next);
        const first = next[0] ?? null;
        setActiveBranchId(first?.id ?? null);
        setDraft(first ? toDraft(first) : null);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to load branches.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dealershipId]);

  const activeBranch = useMemo(
    () => branches.find((item) => item.id === activeBranchId) ?? null,
    [activeBranchId, branches],
  );

  const hasChanges = useMemo(() => {
    if (!activeBranch || !draft) return false;
    return JSON.stringify(toDraft(activeBranch)) !== JSON.stringify(draft);
  }, [activeBranch, draft]);

  function selectBranch(branchId: string) {
    setActiveBranchId(branchId);
    const selected = branches.find((item) => item.id === branchId);
    setDraft(selected ? toDraft(selected) : null);
    setError(null);
    setSuccess(null);
  }

  function update(values: Partial<UpdateBranchRequest>) {
    setDraft((prev) => (prev ? { ...prev, ...values } : prev));
    setError(null);
    setSuccess(null);
  }

  async function save() {
    if (!dealershipId || !activeBranchId || !draft) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await saveDealershipBranchData(dealershipId, activeBranchId, draft);
      setBranches((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setDraft(toDraft(updated));
      setSuccess("Branch updated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update branch.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!dealershipId) {
    return (
      <PageContainer variant="analytics">
        <PageHeader
          title="Branch Management"
          description="Select an active dealership context to manage branch operations."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="analytics">
      <PageHeader
        title="Branch Management"
        description="Update branch contact information and operating hours for your dealership network."
        actions={(
          <Button onClick={save} loading={isSaving} disabled={!draft || !hasChanges}>
            Save Branch
          </Button>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Branches</CardTitle>
            <CardDescription>Select a branch to edit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Text tone="muted">Loading branches...</Text>
            ) : branches.length === 0 ? (
              <Text tone="muted">No branches found.</Text>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  className={`w-full rounded-[var(--radius-lg)] border px-3 py-3 text-left ${branch.id === activeBranchId ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)]"}`}
                  onClick={() => selectBranch(branch.id)}
                >
                  <Text variant="label" className="block">{branch.name}</Text>
                  <Text variant="body-sm" tone="muted">{branch.city}, {branch.province}</Text>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch Details</CardTitle>
            <CardDescription>Keep branch details accurate for buyers and staff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && <Text tone="danger">{error}</Text>}
            {success && <Text tone="success">{success}</Text>}

            {!draft ? (
              <Text tone="muted">Select a branch to begin editing.</Text>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Branch Name" htmlFor="branch-name" required>
                    <Input id="branch-name" value={draft.name} onChange={(e) => update({ name: e.target.value })} />
                  </FormField>
                  <FormField label="Branch Manager" htmlFor="branch-manager" required>
                    <Input id="branch-manager" value={draft.branchManager} onChange={(e) => update({ branchManager: e.target.value })} />
                  </FormField>
                </div>

                <FormField label="Address" htmlFor="branch-address" required>
                  <Input id="branch-address" value={draft.address} onChange={(e) => update({ address: e.target.value })} />
                </FormField>

                <div className="grid gap-5 md:grid-cols-3">
                  <FormField label="Province" htmlFor="branch-province" required>
                    <select
                      id="branch-province"
                      className="h-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                      value={draft.province}
                      onChange={(e) => update({ province: e.target.value })}
                    >
                      <option value="">Select province</option>
                      {SA_PROVINCES.map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="City" htmlFor="branch-city" required>
                    <Input id="branch-city" value={draft.city} onChange={(e) => update({ city: e.target.value })} />
                  </FormField>
                  <FormField label="Postal Code" htmlFor="branch-postal" required>
                    <Input id="branch-postal" value={draft.postalCode} onChange={(e) => update({ postalCode: e.target.value })} />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Telephone" htmlFor="branch-telephone" required>
                    <Input id="branch-telephone" value={draft.telephone ?? ""} onChange={(e) => update({ telephone: e.target.value })} />
                  </FormField>
                  <FormField label="WhatsApp" htmlFor="branch-whatsapp" required>
                    <Input id="branch-whatsapp" value={draft.whatsapp ?? ""} onChange={(e) => update({ whatsapp: e.target.value })} />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Email" htmlFor="branch-email" required>
                    <Input id="branch-email" type="email" value={draft.email ?? ""} onChange={(e) => update({ email: e.target.value })} />
                  </FormField>
                  <FormField label="Operating Hours" htmlFor="branch-hours" required>
                    <Input id="branch-hours" value={draft.businessHours} onChange={(e) => update({ businessHours: e.target.value })} placeholder="Mon-Fri 8:00-17:00, Sat 9:00-13:00" />
                  </FormField>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
