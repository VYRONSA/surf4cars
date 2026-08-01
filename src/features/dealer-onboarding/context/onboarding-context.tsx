"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  resolveOwnerOnboardingAccessToken,
  setClientActiveDealershipContext,
} from "@/features/authentication";
import { resolveRolePermissions } from "@/features/dealer-onboarding/config/staff-roles";
import { ONBOARDING_STEPS } from "@/features/dealer-onboarding/config/onboarding-config";
import {
  completeOnboardingInApi,
  saveDraftToApi,
} from "@/features/dealer-onboarding/services/onboarding-api";
import {
  INITIAL_ONBOARDING_DATA,
  type BrandingInfo,
  type BranchInfo,
  createDefaultBranch,
  createDefaultStaffInvite,
  type DealershipInfo,
  type OnboardingCompletionResult,
  type OnboardingFormData,
  type OnboardingStepId,
  type OwnerAccountInfo,
  type StaffInvite,
  type SubscriptionPackageId,
} from "@/features/dealer-onboarding/types/onboarding.types";
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  readOnboardingDraftFromStorageEvent,
  saveOnboardingDraft,
} from "@/features/dealer-onboarding/utils/onboarding-storage";
import { validateForCompletion } from "@/features/dealer-onboarding/utils/onboarding-validators";

export interface OnboardingContextValue {
  readonly currentStep: OnboardingStepId;
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly data: OnboardingFormData;
  readonly isFirstStep: boolean;
  readonly isLastFormStep: boolean;
  readonly isSuccessStep: boolean;
  readonly isSaving: boolean;
  readonly isSubmitting: boolean;
  readonly lastSavedAt: string | null;
  readonly errorMessage: string | null;
  readonly completion: OnboardingCompletionResult | null;
  readonly goToStep: (step: OnboardingStepId) => void;
  readonly nextStep: () => void;
  readonly prevStep: () => void;
  readonly updateDealership: (values: Partial<DealershipInfo>) => void;
  readonly updateBranding: (values: Partial<BrandingInfo>) => void;
  readonly addBranch: () => void;
  readonly updateBranch: (branchId: string, values: Partial<BranchInfo>) => void;
  readonly removeBranch: (branchId: string) => void;
  readonly updateOwnerAccount: (values: Partial<OwnerAccountInfo>) => void;
  readonly addStaffInvite: () => void;
  readonly updateStaffInvite: (inviteId: string, values: Partial<StaffInvite>) => void;
  readonly removeStaffInvite: (inviteId: string) => void;
  readonly applyRolePermissions: (inviteId: string) => void;
  readonly setSubscriptionPackage: (pkg: SubscriptionPackageId) => void;
  readonly clearError: () => void;
  readonly completeOnboarding: () => Promise<boolean>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const STEP_IDS = ONBOARDING_STEPS.map((s) => s.id);

export function OnboardingProvider({ children }: { readonly children: ReactNode }) {
  const skipNextDraftSaveRef = useRef(false);
  const revisionRef = useRef(0);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingFormData>(INITIAL_ONBOARDING_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completion, setCompletion] = useState<OnboardingCompletionResult | null>(null);

  const currentStep = STEP_IDS[currentStepIndex] ?? "welcome";

  const clampStepIndex = useCallback((index: number) => {
    return Math.min(Math.max(index, 0), STEP_IDS.length - 1);
  }, []);

  const markSaved = useCallback(() => {
    if (typeof window === "undefined") return;
    setIsSaving(true);
    setLastSavedAt(new Date().toISOString());
    window.setTimeout(() => setIsSaving(false), 250);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initial = loadOnboardingDraft();
    queueMicrotask(() => {
      if (initial) {
        setCurrentStepIndex(clampStepIndex(initial.currentStepIndex));
        setData(initial.data);
        revisionRef.current = initial.revision;
      } else {
        revisionRef.current = Date.now();
      }

      setIsDraftHydrated(true);
    });
  }, [clampStepIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isDraftHydrated) return;
    if (skipNextDraftSaveRef.current) {
      skipNextDraftSaveRef.current = false;
      return;
    }

    const nextRevision = Math.max(Date.now(), revisionRef.current + 1);
    const saveResult = saveOnboardingDraft({
      currentStepIndex,
      revision: nextRevision,
      data,
    });

    if (saveResult.saved) {
      revisionRef.current = nextRevision;
      return;
    }

    if (saveResult.existing && saveResult.existing.revision > revisionRef.current) {
      skipNextDraftSaveRef.current = true;
      revisionRef.current = saveResult.existing.revision;
      setCurrentStepIndex(clampStepIndex(saveResult.existing.currentStepIndex));
      setData(saveResult.existing.data);
    }
  }, [clampStepIndex, currentStepIndex, data, isDraftHydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      const snapshot = readOnboardingDraftFromStorageEvent(event);
      if (!snapshot) return;
      if (snapshot.revision <= revisionRef.current) return;

      skipNextDraftSaveRef.current = true;
      revisionRef.current = snapshot.revision;
      setCurrentStepIndex(clampStepIndex(snapshot.currentStepIndex));
      setData(snapshot.data);
      setLastSavedAt(new Date(snapshot.revision).toISOString());
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [clampStepIndex]);

  const persistDraftToApi = useCallback(async (nextData: OnboardingFormData, stepIndex: number) => {
    try {
      await saveDraftToApi({ data: nextData, currentStepIndex: stepIndex });
    } catch {
      // Draft API is best effort; local storage remains source for resume.
    }
  }, []);

  const goToStep = useCallback((step: OnboardingStepId) => {
    const index = STEP_IDS.indexOf(step);
    if (index >= 0) {
      setCurrentStepIndex(index);
      markSaved();
      void persistDraftToApi(data, index);
    }
  }, [data, markSaved, persistDraftToApi]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = Math.min(prev + 1, STEP_IDS.length - 1);
      markSaved();
      void persistDraftToApi(data, next);
      return next;
    });
  }, [data, markSaved, persistDraftToApi]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      markSaved();
      void persistDraftToApi(data, next);
      return next;
    });
  }, [data, markSaved, persistDraftToApi]);

  const updateDealership = useCallback((values: Partial<DealershipInfo>) => {
    setErrorMessage(null);
    markSaved();
    setData((prev) => ({
      ...prev,
      dealership: { ...prev.dealership, ...values },
    }));
  }, [markSaved]);

  const updateBranding = useCallback((values: Partial<BrandingInfo>) => {
    setErrorMessage(null);
    markSaved();
    setData((prev) => ({
      ...prev,
      branding: { ...prev.branding, ...values },
    }));
  }, [markSaved]);

  const addBranch = useCallback(() => {
    markSaved();
    setData((prev) => ({
      ...prev,
      branches: [...prev.branches, createDefaultBranch()],
    }));
  }, [markSaved]);

  const updateBranch = useCallback((branchId: string, values: Partial<BranchInfo>) => {
    setErrorMessage(null);
    markSaved();
    setData((prev) => ({
      ...prev,
      branches: prev.branches.map((branch) =>
        branch.id === branchId ? { ...branch, ...values } : branch,
      ),
    }));
  }, [markSaved]);

  const removeBranch = useCallback((branchId: string) => {
    markSaved();
    setData((prev) => {
      const next = prev.branches.filter((branch) => branch.id !== branchId);
      return {
        ...prev,
        branches: next.length > 0 ? next : [createDefaultBranch()],
      };
    });
  }, [markSaved]);

  const updateOwnerAccount = useCallback((values: Partial<OwnerAccountInfo>) => {
    setErrorMessage(null);
    markSaved();
    setData((prev) => ({
      ...prev,
      ownerAccount: { ...prev.ownerAccount, ...values },
    }));
  }, [markSaved]);

  const addStaffInvite = useCallback(() => {
    markSaved();
    setData((prev) => ({
      ...prev,
      staffInvites: [...prev.staffInvites, createDefaultStaffInvite()],
    }));
  }, [markSaved]);

  const updateStaffInvite = useCallback((inviteId: string, values: Partial<StaffInvite>) => {
    setErrorMessage(null);
    markSaved();
    setData((prev) => ({
      ...prev,
      staffInvites: prev.staffInvites.map((invite) =>
        invite.id === inviteId ? { ...invite, ...values } : invite,
      ),
    }));
  }, [markSaved]);

  const removeStaffInvite = useCallback((inviteId: string) => {
    markSaved();
    setData((prev) => ({
      ...prev,
      staffInvites: prev.staffInvites.filter((invite) => invite.id !== inviteId),
    }));
  }, [markSaved]);

  const applyRolePermissions = useCallback((inviteId: string) => {
    markSaved();
    setData((prev) => ({
      ...prev,
      staffInvites: prev.staffInvites.map((invite) =>
        invite.id === inviteId
          ? {
              ...invite,
              permissions: resolveRolePermissions(invite.role),
            }
          : invite,
      ),
    }));
  }, [markSaved]);

  const setSubscriptionPackage = useCallback((pkg: SubscriptionPackageId) => {
    setErrorMessage(null);
    markSaved();
    setData((prev) => ({ ...prev, subscriptionPackage: pkg }));
  }, [markSaved]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    const validation = validateForCompletion(data);
    if (!validation.valid) {
      setErrorMessage(validation.message ?? "Please complete all required fields.");
      return false;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const accessToken = await resolveOwnerOnboardingAccessToken({
        email: data.ownerAccount.email,
        password: data.ownerAccount.password,
        fullName: data.ownerAccount.fullName,
      });

      const result = await completeOnboardingInApi(data, accessToken);
      setCompletion(result);
      setClientActiveDealershipContext({
        dealershipId: result.dealershipId,
        branchId: result.primaryBranchId,
      });
      skipNextDraftSaveRef.current = true;
      revisionRef.current = 0;
      clearOnboardingDraft();
      setCurrentStepIndex(STEP_IDS.indexOf("success"));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete onboarding.";
      setErrorMessage(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [data]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      currentStep,
      currentStepIndex,
      totalSteps: ONBOARDING_STEPS.length,
      data,
      isFirstStep: currentStepIndex === 0,
      isLastFormStep: currentStep === "review",
      isSuccessStep: currentStep === "success",
      isSaving,
      isSubmitting,
      lastSavedAt,
      errorMessage,
      completion,
      goToStep,
      nextStep,
      prevStep,
      updateDealership,
      updateBranding,
      addBranch,
      updateBranch,
      removeBranch,
      updateOwnerAccount,
      addStaffInvite,
      updateStaffInvite,
      removeStaffInvite,
      applyRolePermissions,
      setSubscriptionPackage,
      clearError,
      completeOnboarding,
    }),
    [
      currentStep,
      currentStepIndex,
      data,
      isSaving,
      isSubmitting,
      lastSavedAt,
      errorMessage,
      completion,
      goToStep,
      nextStep,
      prevStep,
      updateDealership,
      updateBranding,
      addBranch,
      updateBranch,
      removeBranch,
      updateOwnerAccount,
      addStaffInvite,
      updateStaffInvite,
      removeStaffInvite,
      applyRolePermissions,
      setSubscriptionPackage,
      clearError,
      completeOnboarding,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
