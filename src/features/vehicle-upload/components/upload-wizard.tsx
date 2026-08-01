"use client";

import { StepDescription } from "@/features/vehicle-upload/components/steps/step-description";
import { StepFeatures } from "@/features/vehicle-upload/components/steps/step-features";
import { StepIdentification } from "@/features/vehicle-upload/components/steps/step-identification";
import { StepMedia } from "@/features/vehicle-upload/components/steps/step-media";
import { StepPricing } from "@/features/vehicle-upload/components/steps/step-pricing";
import { StepReview } from "@/features/vehicle-upload/components/steps/step-review";
import { StepSpecifications } from "@/features/vehicle-upload/components/steps/step-specifications";
import { StepSuccess } from "@/features/vehicle-upload/components/steps/step-success";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import type { UploadStepId } from "@/features/vehicle-upload/types/upload.types";
import { cn } from "@/utils";

const STEP_COMPONENTS: Record<UploadStepId, React.ComponentType> = {
  media: StepMedia,
  specifications: StepSpecifications,
  identification: StepIdentification,
  pricing: StepPricing,
  features: StepFeatures,
  description: StepDescription,
  review: StepReview,
};

export function UploadWizard() {
  const { currentStep, isSuccessStep } = useUploadWizard();

  if (isSuccessStep) {
    return (
      <div className={cn("flex flex-1 flex-col", uploadPolish.stepTransition)} role="region" aria-live="polite">
        <StepSuccess />
      </div>
    );
  }

  const StepComponent = STEP_COMPONENTS[currentStep];

  return (
    <div
      className={cn("flex flex-1 flex-col", uploadPolish.stepTransition)}
      role="region"
      aria-live="polite"
      aria-label={`Upload step: ${currentStep}`}
    >
      <StepComponent />
    </div>
  );
}
