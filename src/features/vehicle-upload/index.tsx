"use client";

import type { ReactNode } from "react";

import { UploadContextProvider } from "@/features/vehicle-upload/context/upload-context";
import { VehicleUploadPage } from "@/features/vehicle-upload/vehicle-upload-page";

export function VehicleUploadWizardPage() {
  return (
    <UploadContextProvider>
      <VehicleUploadPage />
    </UploadContextProvider>
  );
}

export function VehicleUploadRoot({ children }: { readonly children: ReactNode }) {
  return <UploadContextProvider>{children}</UploadContextProvider>;
}

export { VehicleUploadPage } from "@/features/vehicle-upload/vehicle-upload-page";
export { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
export type { UploadFormData, UploadStepId } from "@/features/vehicle-upload/types/upload.types";
export { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
