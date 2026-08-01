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
  getDealershipProfileData,
  saveDealershipProfileData,
} from "@/features/dealership/services/dealership-management.api";
import type {
  DealershipProfileRecord,
  UpdateDealershipProfileRequest,
} from "@/features/dealership/types/dealership-management.types";

function toPayload(profile: DealershipProfileRecord): UpdateDealershipProfileRequest {
  return {
    businessName: profile.businessName,
    tradingName: profile.tradingName,
    registrationNumber: profile.registrationNumber,
    vatNumber: profile.vatNumber,
    dealerLicenceNumber: profile.dealerLicenceNumber,
    businessType: profile.businessType,
    physicalAddress: profile.physicalAddress,
    province: profile.province,
    city: profile.city,
    postalCode: profile.postalCode,
    gpsLatitude: profile.gpsLatitude,
    gpsLongitude: profile.gpsLongitude,
    telephone: profile.telephone,
    whatsapp: profile.whatsapp,
    email: profile.email,
    website: profile.website,
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
  };
}

export function DealershipProfilePage({
  initialDealershipId = null,
}: {
  readonly initialDealershipId?: string | null;
}) {
  const [dealershipId, setDealershipId] = useState<string | null>(initialDealershipId);
  const [profile, setProfile] = useState<DealershipProfileRecord | null>(null);
  const [draft, setDraft] = useState<UpdateDealershipProfileRequest | null>(null);
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

    void getDealershipProfileData(dealershipId)
      .then((next) => {
        if (cancelled) return;
        setProfile(next);
        setDraft(toPayload(next));
      })
      .catch((nextError) => {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to load dealership profile.");
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

  const hasChanges = useMemo(() => {
    if (!profile || !draft) return false;
    return JSON.stringify(toPayload(profile)) !== JSON.stringify(draft);
  }, [profile, draft]);

  function update(values: Partial<UpdateDealershipProfileRequest>) {
    setError(null);
    setSuccess(null);
    setDraft((prev) => (prev ? { ...prev, ...values } : prev));
  }

  async function save() {
    if (!dealershipId || !draft) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await saveDealershipProfileData(dealershipId, draft);
      setProfile(updated);
      setDraft(toPayload(updated));
      setSuccess("Dealership profile updated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save dealership profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!dealershipId) {
    return (
      <PageContainer variant="analytics">
        <PageHeader
          title="Dealership Profile"
          description="Select an active dealership context to manage profile details."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="analytics">
      <PageHeader
        title="Dealership Profile"
        description="Manage your dealership details, branding colors, and contact information without rerunning onboarding."
        actions={(
          <Button onClick={save} loading={isSaving} disabled={!draft || !hasChanges}>
            Save Changes
          </Button>
        )}
      />

      <div className="space-y-6">
        {error && <Text tone="danger">{error}</Text>}
        {success && <Text tone="success">{success}</Text>}

        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Update legal, trading, and registration details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading || !draft ? (
              <Text tone="muted">Loading profile...</Text>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Business Name" htmlFor="business-name" required>
                    <Input id="business-name" value={draft.businessName} onChange={(e) => update({ businessName: e.target.value })} />
                  </FormField>
                  <FormField label="Trading Name" htmlFor="trading-name" required>
                    <Input id="trading-name" value={draft.tradingName} onChange={(e) => update({ tradingName: e.target.value })} />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {/* Not required: a sole proprietor has no CIPC registration number. */}
                  <FormField label="Registration Number" htmlFor="registration-number">
                    <Input id="registration-number" value={draft.registrationNumber ?? ""} onChange={(e) => update({ registrationNumber: e.target.value })} />
                  </FormField>
                  {/* Not required: VAT registration is voluntary below R1m turnover. */}
                  <FormField label="VAT Number" htmlFor="vat-number">
                    <Input id="vat-number" value={draft.vatNumber ?? ""} onChange={(e) => update({ vatNumber: e.target.value })} />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Dealer Licence Number" htmlFor="dealer-licence">
                    <Input id="dealer-licence" value={draft.dealerLicenceNumber ?? ""} onChange={(e) => update({ dealerLicenceNumber: e.target.value || null })} />
                  </FormField>
                  <FormField label="Business Type" htmlFor="business-type" required>
                    <Input id="business-type" value={draft.businessType} onChange={(e) => update({ businessType: e.target.value })} />
                  </FormField>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact And Location</CardTitle>
            <CardDescription>Keep public and operational contact details current.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading || !draft ? (
              <Text tone="muted">Loading location details...</Text>
            ) : (
              <>
                <FormField label="Physical Address" htmlFor="physical-address" required>
                  <Input id="physical-address" value={draft.physicalAddress} onChange={(e) => update({ physicalAddress: e.target.value })} />
                </FormField>

                <div className="grid gap-5 md:grid-cols-3">
                  <FormField label="Province" htmlFor="province" required>
                    <select
                      id="province"
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
                  <FormField label="City" htmlFor="city" required>
                    <Input id="city" value={draft.city} onChange={(e) => update({ city: e.target.value })} />
                  </FormField>
                  <FormField label="Postal Code" htmlFor="postal-code" required>
                    <Input id="postal-code" value={draft.postalCode} onChange={(e) => update({ postalCode: e.target.value })} />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Telephone" htmlFor="telephone" required>
                    <Input id="telephone" value={draft.telephone ?? ""} onChange={(e) => update({ telephone: e.target.value })} />
                  </FormField>
                  <FormField label="WhatsApp" htmlFor="whatsapp" required>
                    <Input id="whatsapp" value={draft.whatsapp ?? ""} onChange={(e) => update({ whatsapp: e.target.value })} />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Email" htmlFor="email" required>
                    <Input id="email" type="email" value={draft.email ?? ""} onChange={(e) => update({ email: e.target.value })} />
                  </FormField>
                  <FormField label="Website" htmlFor="website">
                    <Input id="website" value={draft.website ?? ""} onChange={(e) => update({ website: e.target.value || null })} placeholder="https://" />
                  </FormField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="GPS Latitude" htmlFor="gps-latitude" required>
                    <Input id="gps-latitude" value={draft.gpsLatitude} onChange={(e) => update({ gpsLatitude: e.target.value })} />
                  </FormField>
                  <FormField label="GPS Longitude" htmlFor="gps-longitude" required>
                    <Input id="gps-longitude" value={draft.gpsLongitude} onChange={(e) => update({ gpsLongitude: e.target.value })} />
                  </FormField>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Update primary and secondary brand colors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading || !draft ? (
              <Text tone="muted">Loading branding...</Text>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Primary Color" htmlFor="primary-color" required>
                  <Input id="primary-color" value={draft.primaryColor} onChange={(e) => update({ primaryColor: e.target.value })} />
                </FormField>
                <FormField label="Secondary Color" htmlFor="secondary-color" required>
                  <Input id="secondary-color" value={draft.secondaryColor} onChange={(e) => update({ secondaryColor: e.target.value })} />
                </FormField>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
