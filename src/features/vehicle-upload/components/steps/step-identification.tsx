"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Wand2 } from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import {
  applyVinDecodeToIdentification,
  vinDecoder,
} from "@/features/vehicle-upload/utils/vin-decoder";
import { cn } from "@/utils";

export function StepIdentification() {
  const { data, updateIdentification, markStepComplete } = useUploadWizard();
  const { identification } = data;
  const [decodeMessage, setDecodeMessage] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleVinDecode() {
    setIsDecoding(true);
    setDecodeMessage(null);
    const result = await vinDecoder.decode(identification.vin);
    updateIdentification(applyVinDecodeToIdentification(identification, result));
    setDecodeMessage(result.message ?? (result.success ? "VIN decoded." : "Could not decode VIN."));
    setIsDecoding(false);
  }

  function validate() {
    if (!identification.make.trim()) {
      setValidationError("Enter the vehicle make — e.g. BMW, Toyota, Mercedes-Benz.");
      return false;
    }
    if (!identification.model.trim()) {
      setValidationError("Enter the model — e.g. X5, Hilux, GLC.");
      return false;
    }
    if (!identification.year.trim()) {
      setValidationError("Enter the model year — e.g. 2024.");
      return false;
    }
    setValidationError(null);
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="identification">
      <div className={uploadPolish.formStack}>
        <FormField
          label="VIN (Vehicle Identification Number)"
          htmlFor="vin"
          helperText="17-character code — used for duplicate detection and future auto-decode."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="vin"
              value={identification.vin}
              onChange={(e) => updateIdentification({ vin: e.target.value.toUpperCase() })}
              placeholder="WBAxxxxxxxxxxxxxx"
              className={cn(uploadPolish.inputClass, "font-mono uppercase tracking-wider")}
              aria-describedby="vin-helper"
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleVinDecode}
              loading={isDecoding}
              disabled={!identification.vin.trim()}
              className="shrink-0 gap-1.5"
            >
              <Icon icon={Wand2} size="sm" aria-hidden />
              Decode VIN
            </Button>
          </div>
          {decodeMessage && (
            <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-primary)]" role="status">
              {decodeMessage}
            </p>
          )}
        </FormField>

        <div className={uploadPolish.formGrid}>
          <FormField label="Registration Number" htmlFor="registration" helperText="Licence disc number on file.">
            <Input
              id="registration"
              inputSize="lg"
              value={identification.registration}
              onChange={(e) => updateIdentification({ registration: e.target.value.toUpperCase() })}
              placeholder="CA 123-456"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Stock Number" htmlFor="stock-number" helperText="Your internal reference — e.g. AAC-X5-2401.">
            <Input
              id="stock-number"
              inputSize="lg"
              value={identification.stockNumber}
              onChange={(e) => updateIdentification({ stockNumber: e.target.value.toUpperCase() })}
              placeholder="AAC-X5-2401"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Make" htmlFor="make" required>
            <Input
              id="make"
              inputSize="lg"
              value={identification.make}
              onChange={(e) => updateIdentification({ make: e.target.value })}
              placeholder="BMW"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Model" htmlFor="model" required>
            <Input
              id="model"
              inputSize="lg"
              value={identification.model}
              onChange={(e) => updateIdentification({ model: e.target.value })}
              placeholder="X5"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Variant / Trim" htmlFor="variant" helperText="M Sport, Raider, AMG Line, etc.">
            <Input
              id="variant"
              inputSize="lg"
              value={identification.variant}
              onChange={(e) => updateIdentification({ variant: e.target.value })}
              placeholder="xDrive40i M Sport"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Year" htmlFor="year" required>
            <Input
              id="year"
              inputSize="lg"
              type="number"
              min={1990}
              max={2030}
              value={identification.year}
              onChange={(e) => updateIdentification({ year: e.target.value })}
              placeholder="2024"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <FormField label="Condition" htmlFor="condition" required helperText="Affects buyer expectations and warranty display.">
          <Select
            id="condition"
            inputSize="lg"
            value={identification.condition}
            onChange={(e) =>
              updateIdentification({
                condition: e.target.value as typeof identification.condition,
              })
            }
            className={uploadPolish.inputClass}
          >
            <option value="new">New — unregistered, full warranty</option>
            <option value="demo">Demo — low mileage, dealer-owned</option>
            <option value="used">Used — standard pre-owned stock</option>
            <option value="certified-pre-owned">Certified Pre-Owned — inspected programme</option>
          </Select>
        </FormField>
      </div>

      <UploadNavigation onContinue={validate} validationError={validationError} />
    </UploadStepLayout>
  );
}
