"use client";

import { useState } from "react";

import { FormField, Input, Select } from "@/components/ui/form";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";

const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT"];
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"];
const DRIVE_TYPES = ["FWD", "RWD", "AWD", "4WD"];
const BODY_TYPES = ["SUV", "Sedan", "Hatchback", "Bakkie", "Coupe", "Wagon", "Van"];

export function StepSpecifications() {
  const { data, updateSpecifications, markStepComplete } = useUploadWizard();
  const { specifications } = data;
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate() {
    if (!specifications.mileage.trim()) {
      setValidationError("Enter the odometer reading — buyers filter by mileage range.");
      return false;
    }
    setValidationError(null);
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="specifications">
      <div className={uploadPolish.formStack}>
        <div className={uploadPolish.formGrid}>
          <FormField label="Mileage (km)" htmlFor="mileage" required helperText="Odometer reading at time of listing.">
            <Input
              id="mileage"
              inputSize="lg"
              value={specifications.mileage}
              onChange={(e) => updateSpecifications({ mileage: e.target.value })}
              placeholder="12,400"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Exterior Colour" htmlFor="colour" helperText="As shown on the licence disc.">
            <Input
              id="colour"
              inputSize="lg"
              value={specifications.colour}
              onChange={(e) => updateSpecifications({ colour: e.target.value })}
              placeholder="Alpine White"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Transmission" htmlFor="transmission">
            <Select
              id="transmission"
              inputSize="lg"
              value={specifications.transmission}
              onChange={(e) => updateSpecifications({ transmission: e.target.value })}
              className={uploadPolish.inputClass}
            >
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Fuel Type" htmlFor="fuel">
            <Select
              id="fuel"
              inputSize="lg"
              value={specifications.fuel}
              onChange={(e) => updateSpecifications({ fuel: e.target.value })}
              className={uploadPolish.inputClass}
            >
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Engine" htmlFor="engine" helperText="Capacity and configuration — e.g. 3.0L Turbo Inline-6">
          <Input
            id="engine"
            inputSize="lg"
            value={specifications.engine}
            onChange={(e) => updateSpecifications({ engine: e.target.value })}
            placeholder="3.0L Turbo Inline-6"
            className={uploadPolish.inputClass}
          />
        </FormField>

        <div className={uploadPolish.formGrid}>
          <FormField label="Power" htmlFor="power">
            <Input
              id="power"
              inputSize="lg"
              value={specifications.power}
              onChange={(e) => updateSpecifications({ power: e.target.value })}
              placeholder="250 kW"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Torque" htmlFor="torque">
            <Input
              id="torque"
              inputSize="lg"
              value={specifications.torque}
              onChange={(e) => updateSpecifications({ torque: e.target.value })}
              placeholder="450 Nm"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Drive Type" htmlFor="drive-type">
            <Select
              id="drive-type"
              inputSize="lg"
              value={specifications.driveType}
              onChange={(e) => updateSpecifications({ driveType: e.target.value })}
              className={uploadPolish.inputClass}
            >
              {DRIVE_TYPES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Body Type" htmlFor="body-type">
            <Select
              id="body-type"
              inputSize="lg"
              value={specifications.bodyType}
              onChange={(e) => updateSpecifications({ bodyType: e.target.value })}
              className={uploadPolish.inputClass}
            >
              {BODY_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Doors" htmlFor="doors">
            <Input
              id="doors"
              inputSize="lg"
              type="number"
              min={2}
              max={5}
              value={specifications.doors}
              onChange={(e) => updateSpecifications({ doors: e.target.value })}
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Seats" htmlFor="seats">
            <Input
              id="seats"
              inputSize="lg"
              type="number"
              min={2}
              max={9}
              value={specifications.seats}
              onChange={(e) => updateSpecifications({ seats: e.target.value })}
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>
      </div>

      <UploadNavigation onContinue={validate} validationError={validationError} />
    </UploadStepLayout>
  );
}
