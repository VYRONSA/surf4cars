"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { FileText, Search } from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";

export function StepSpecifications() {
  const {
    data,
    runLicenceDiscOcr,
    updateLicenceDisc,
    markStepComplete,
  } = useUploadWizard();

  const isOcrBusy = data.licenceDisc.analysisStatus === "pending";

  const [validationError, setValidationError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUpload(files: FileList) {
    const file = files[0];
    if (!file) return;

    updateLicenceDisc({
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      analysisStatus: "idle",
      analysisMessage: "Awaiting OCR analysis",
    });
  }

  async function handleRunOcr() {
    await runLicenceDiscOcr();
  }

  function validate() {
    if (!data.licenceDisc.fileUrl) {
      setValidationError("Upload a licence disc image before continuing.");
      return false;
    }

    setValidationError(null);
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="specifications">
      <div className={uploadPolish.formStack}>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[length:var(--text-body-md)] font-semibold">Licence Disc Upload</p>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                OCR extraction framework is ready. Current provider state: Awaiting OCR analysis.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <Icon icon={FileText} size="xs" aria-hidden />
              Upload Disc Image
            </Button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => event.target.files && handleUpload(event.target.files)}
          />

          {data.licenceDisc.fileUrl ? (
            <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                <Image src={data.licenceDisc.fileUrl} alt={data.licenceDisc.fileName || "Licence disc"} fill className="object-cover" unoptimized />
              </div>
              <div className="space-y-3">
                <Button type="button" onClick={() => void handleRunOcr()} disabled={isOcrBusy}>
                  <Icon icon={Search} size="xs" aria-hidden />
                  {isOcrBusy ? "Running OCR..." : "Run OCR Analysis"}
                </Button>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {data.licenceDisc.analysisMessage || "Awaiting OCR analysis"}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField label="Registration" htmlFor="ocr-registration">
                    <Input id="ocr-registration" value={data.licenceDisc.extractedRegistration} readOnly placeholder="Awaiting OCR analysis" />
                  </FormField>
                  <FormField label="VIN" htmlFor="ocr-vin">
                    <Input id="ocr-vin" value={data.licenceDisc.extractedVin} readOnly placeholder="Awaiting OCR analysis" />
                  </FormField>
                  <FormField label="Expiry" htmlFor="ocr-expiry">
                    <Input id="ocr-expiry" value={data.licenceDisc.extractedExpiryDate} readOnly placeholder="Awaiting OCR analysis" />
                  </FormField>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              No licence disc image uploaded yet.
            </p>
          )}
        </div>
      </div>

      <UploadNavigation
        onContinue={validate}
        validationError={validationError}
        continueLabel="Continue to Vehicle Identification"
      />
    </UploadStepLayout>
  );
}
