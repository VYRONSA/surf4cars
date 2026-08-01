"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sparkles } from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";

export function StepIdentification() {
  const {
    data,
    markStepComplete,
    runVehicleIdentification,
    updateIdentification,
    updateSpecifications,
  } = useUploadWizard();

  const isIdentificationBusy = data.identificationAi.analysisStatus === "pending";

  const [validationError, setValidationError] = useState<string | null>(null);

  async function triggerIdentification() {
    await runVehicleIdentification();
  }

  function validate() {
    if (!data.identification.make.trim()) {
      setValidationError("Vehicle make is required.");
      return false;
    }
    if (!data.identification.model.trim()) {
      setValidationError("Vehicle model is required.");
      return false;
    }
    if (!data.identification.year.trim()) {
      setValidationError("Vehicle year is required.");
      return false;
    }

    setValidationError(null);
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="identification">
      <div className={uploadPolish.formStack}>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/35 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[length:var(--text-body-md)] font-semibold">AI Identification Pipeline</p>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                Make, model, variant, year, colour, fuel, transmission, VIN and engine size extraction.
              </p>
            </div>
            <Button type="button" onClick={() => void triggerIdentification()} disabled={isIdentificationBusy}>
              <Icon icon={Sparkles} size="xs" aria-hidden />
              {isIdentificationBusy ? "Running AI Identification..." : "Run AI Identification"}
            </Button>
          </div>

          <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            {data.identificationAi.analysisMessage || "Awaiting AI analysis"}
          </p>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Make" htmlFor="make" required>
            <Input
              id="make"
              value={data.identification.make}
              onChange={(event) => updateIdentification({ make: event.target.value })}
              placeholder="BMW"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Model" htmlFor="model" required>
            <Input
              id="model"
              value={data.identification.model}
              onChange={(event) => updateIdentification({ model: event.target.value })}
              placeholder="X5"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Variant" htmlFor="variant">
            <Input
              id="variant"
              value={data.identification.variant}
              onChange={(event) => updateIdentification({ variant: event.target.value })}
              placeholder="xDrive40i M Sport"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Year" htmlFor="year" required>
            <Input
              id="year"
              type="number"
              min={1990}
              max={2035}
              value={data.identification.year}
              onChange={(event) => updateIdentification({ year: event.target.value })}
              placeholder="2024"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Stock Number" htmlFor="stock-number">
            <Input
              id="stock-number"
              value={data.identification.stockNumber}
              onChange={(event) => updateIdentification({ stockNumber: event.target.value.toUpperCase() })}
              placeholder="SFC-2024-001"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Condition" htmlFor="condition">
            <Select
              id="condition"
              value={data.identification.condition}
              onChange={(event) => updateIdentification({ condition: event.target.value as typeof data.identification.condition })}
            >
              <option value="used">Used</option>
              <option value="new">New</option>
              <option value="demo">Demo</option>
              <option value="certified-pre-owned">Certified Pre-Owned</option>
            </Select>
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="VIN" htmlFor="vin">
            <Input
              id="vin"
              value={data.identification.vin}
              onChange={(event) => updateIdentification({ vin: event.target.value.toUpperCase() })}
              placeholder="WBAxxxxxxxxxxxxxx"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Registration" htmlFor="registration">
            <Input
              id="registration"
              value={data.identification.registration}
              onChange={(event) => updateIdentification({ registration: event.target.value.toUpperCase() })}
              placeholder="CA 123-456"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Fuel Type" htmlFor="fuel">
            <Select
              id="fuel"
              value={data.specifications.fuel}
              onChange={(event) => updateSpecifications({ fuel: event.target.value })}
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Electric">Electric</option>
            </Select>
          </FormField>
          <FormField label="Transmission" htmlFor="transmission">
            <Select
              id="transmission"
              value={data.specifications.transmission}
              onChange={(event) => updateSpecifications({ transmission: event.target.value })}
            >
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </Select>
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Mileage (km)" htmlFor="mileage">
            <Input
              id="mileage"
              type="number"
              min={0}
              value={data.specifications.mileage}
              onChange={(event) => updateSpecifications({ mileage: event.target.value })}
              placeholder="25000"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Engine Size" htmlFor="engine">
            <Input
              id="engine"
              value={data.specifications.engine}
              onChange={(event) => updateSpecifications({ engine: event.target.value })}
              placeholder="3.0L"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Colour" htmlFor="colour">
            <Input
              id="colour"
              value={data.specifications.colour}
              onChange={(event) => updateSpecifications({ colour: event.target.value })}
              placeholder="Alpine White"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>
      </div>

      <UploadNavigation
        onContinue={validate}
        validationError={validationError}
        continueLabel="Continue to SURF Intelligence Review"
      />
    </UploadStepLayout>
  );
}
