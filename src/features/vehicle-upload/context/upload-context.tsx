"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { UPLOAD_STEPS } from "@/features/vehicle-upload/types/upload.types";
import {
  INITIAL_UPLOAD_DATA,
  type UploadFormData,
  type UploadIdentificationData,
  type UploadMediaItem,
  type UploadPricingData,
  type UploadPublishingData,
  type UploadSpecificationsData,
  type UploadStepId,
} from "@/features/vehicle-upload/types/upload.types";
import { clearUploadDraft, loadUploadDraft, saveUploadDraft } from "@/features/vehicle-upload/utils/upload-storage";
import type { UploadPublishScores } from "@/features/vehicle-upload/utils/upload-scores";
import { computePublishScores } from "@/features/vehicle-upload/utils/upload-scores";

export interface UploadContextValue {
  readonly currentStep: UploadStepId;
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly data: UploadFormData;
  readonly completedSteps: readonly UploadStepId[];
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
  readonly isSuccessStep: boolean;
  readonly isSaving: boolean;
  readonly lastSavedAt: string | null;
  readonly draftId: string;
  readonly publishScores: UploadPublishScores | null;
  readonly goToStep: (step: UploadStepId) => void;
  readonly nextStep: () => void;
  readonly prevStep: () => void;
  readonly markStepComplete: () => void;
  readonly updateIdentification: (values: Partial<UploadIdentificationData>) => void;
  readonly updatePricing: (values: Partial<UploadPricingData>) => void;
  readonly updateSpecifications: (values: Partial<UploadSpecificationsData>) => void;
  readonly toggleFeature: (featureId: string) => void;
  readonly setMedia: (media: readonly UploadMediaItem[]) => void;
  readonly updateDescription: (description: string) => void;
  readonly updatePublishing: (values: Partial<UploadPublishingData>) => void;
  readonly saveDraft: () => void;
  readonly clearDraft: () => void;
  readonly completePublish: () => UploadPublishScores;
  readonly startNewListing: () => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

const STEP_IDS = UPLOAD_STEPS.map((s) => s.id);

function createDraftId(): string {
  return `draft-${Date.now().toString(36)}`;
}

function readInitialDraft() {
  if (typeof window === "undefined") return null;
  return loadUploadDraft();
}

export function UploadContextProvider({ children }: { readonly children: ReactNode }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(() => readInitialDraft()?.currentStepIndex ?? 0);
  const [data, setData] = useState<UploadFormData>(() => readInitialDraft()?.data ?? INITIAL_UPLOAD_DATA);
  const [completedSteps, setCompletedSteps] = useState<readonly UploadStepId[]>(
    () => readInitialDraft()?.completedSteps ?? [],
  );
  const [draftId, setDraftId] = useState(() => readInitialDraft()?.draftId ?? createDraftId());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() =>
    readInitialDraft() ? new Date().toISOString() : null,
  );
  const [isSuccessStep, setIsSuccessStep] = useState(false);
  const [publishScores, setPublishScores] = useState<UploadPublishScores | null>(null);

  const currentStep = STEP_IDS[currentStepIndex] ?? "identification";

  const persist = useCallback(
    (nextData: UploadFormData, stepIndex: number, completed: readonly UploadStepId[], id: string) => {
      setIsSaving(true);
      const savedAt = new Date().toISOString();
      saveUploadDraft({
        data: nextData,
        currentStepIndex: stepIndex,
        completedSteps: completed,
        draftId: id,
      });
      setLastSavedAt(savedAt);
      window.setTimeout(() => setIsSaving(false), 400);
    },
    [],
  );

  const saveDraft = useCallback(() => {
    persist(data, currentStepIndex, completedSteps, draftId);
  }, [data, currentStepIndex, completedSteps, draftId, persist]);

  const markStepComplete = useCallback(() => {
    setCompletedSteps((prev) => {
      if (prev.includes(currentStep)) return prev;
      const next = [...prev, currentStep];
      persist(data, currentStepIndex, next, draftId);
      return next;
    });
  }, [currentStep, data, currentStepIndex, draftId, persist]);

  const goToStep = useCallback(
    (step: UploadStepId) => {
      const index = STEP_IDS.indexOf(step);
      if (index >= 0) {
        setCurrentStepIndex(index);
        persist(data, index, completedSteps, draftId);
      }
    },
    [data, completedSteps, draftId, persist],
  );

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = Math.min(prev + 1, STEP_IDS.length - 1);
      persist(data, next, completedSteps, draftId);
      return next;
    });
  }, [data, completedSteps, draftId, persist]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      persist(data, next, completedSteps, draftId);
      return next;
    });
  }, [data, completedSteps, draftId, persist]);

  const updateIdentification = useCallback((values: Partial<UploadIdentificationData>) => {
    setData((prev) => ({ ...prev, identification: { ...prev.identification, ...values } }));
  }, []);

  const updatePricing = useCallback((values: Partial<UploadPricingData>) => {
    setData((prev) => ({ ...prev, pricing: { ...prev.pricing, ...values } }));
  }, []);

  const updateSpecifications = useCallback((values: Partial<UploadSpecificationsData>) => {
    setData((prev) => ({ ...prev, specifications: { ...prev.specifications, ...values } }));
  }, []);

  const toggleFeature = useCallback((featureId: string) => {
    setData((prev) => {
      const selected = prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter((id) => id !== featureId)
        : [...prev.selectedFeatures, featureId];
      return { ...prev, selectedFeatures: selected };
    });
  }, []);

  const setMedia = useCallback((media: readonly UploadMediaItem[]) => {
    setData((prev) => ({ ...prev, media }));
  }, []);

  const updateDescription = useCallback((description: string) => {
    setData((prev) => ({ ...prev, description }));
  }, []);

  const updatePublishing = useCallback((values: Partial<UploadPublishingData>) => {
    setData((prev) => ({ ...prev, publishing: { ...prev.publishing, ...values } }));
  }, []);

  const clearDraft = useCallback(() => {
    clearUploadDraft();
    setData(INITIAL_UPLOAD_DATA);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setDraftId(createDraftId());
    setLastSavedAt(null);
    setIsSuccessStep(false);
    setPublishScores(null);
  }, []);

  const completePublish = useCallback(() => {
    const scores = computePublishScores(data);
    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    setPublishScores(scores);
    setIsSuccessStep(true);
    clearUploadDraft();
    return scores;
  }, [data, currentStep]);

  const startNewListing = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  const value = useMemo<UploadContextValue>(
    () => ({
      currentStep,
      currentStepIndex,
      totalSteps: UPLOAD_STEPS.length,
      data,
      completedSteps,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === UPLOAD_STEPS.length - 1,
      isSuccessStep,
      isSaving,
      lastSavedAt,
      draftId,
      publishScores,
      goToStep,
      nextStep,
      prevStep,
      markStepComplete,
      updateIdentification,
      updatePricing,
      updateSpecifications,
      toggleFeature,
      setMedia,
      updateDescription,
      updatePublishing,
      saveDraft,
      clearDraft,
      completePublish,
      startNewListing,
    }),
    [
      currentStep,
      currentStepIndex,
      data,
      completedSteps,
      isSuccessStep,
      publishScores,
      isSaving,
      lastSavedAt,
      draftId,
      goToStep,
      nextStep,
      prevStep,
      markStepComplete,
      updateIdentification,
      updatePricing,
      updateSpecifications,
      toggleFeature,
      setMedia,
      updateDescription,
      updatePublishing,
      saveDraft,
      clearDraft,
      completePublish,
      startNewListing,
    ],
  );

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUploadWizard(): UploadContextValue {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUploadWizard must be used within UploadContextProvider");
  }
  return context;
}
