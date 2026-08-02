"use client";

import { useSearchParams } from "next/navigation";
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

import { getVehicleWorkspaceData } from "@/features/inventory/services/inventory-intelligence.api";
import { getActiveDealershipId } from "@/features/inventory/utils/active-dealership";
import {
  getListingBuilderDraft,
  publishListingFromBuilder,
  runDescriptionBuilder,
  runLicenceDiscOcr,
  runMarketIntelligence,
  runPricingIntelligence,
  runSurfReview,
  runVehicleIdentification,
  saveListingBuilderDraft as saveListingBuilderDraftRemote,
} from "@/features/vehicle-upload/services/listing-builder.api";
import { UPLOAD_STEPS } from "@/features/vehicle-upload/types/upload.types";
import {
  INITIAL_UPLOAD_DATA,
  type UploadDescriptionBuilderData,
  type UploadFormData,
  type UploadIdentificationData,
  type UploadIntelligenceReviewData,
  type UploadLicenceDiscData,
  type UploadMediaItem,
  type UploadPricingData,
  type UploadPricingWorkspaceData,
  type UploadPublishResult,
  type UploadPublishingData,
  type UploadSpecificationsData,
  type UploadStepId,
  type UploadVehicleIdentificationData,
} from "@/features/vehicle-upload/types/upload.types";
import {
  clearUploadDraft,
  loadUploadDraft,
  readUploadDraftFromStorageEvent,
  saveUploadDraft,
} from "@/features/vehicle-upload/utils/upload-storage";
import { buildUploadFormDataFromWorkspace } from "@/features/vehicle-upload/utils/listing-builder-audit";
import {
  countListingPhotos,
  hasPrimaryListingPhoto,
  resolveListingDescription,
  resolveListingTitle,
} from "@/features/vehicle-upload/utils/listing-summary";
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
  readonly isBusy: boolean;
  readonly isStepTransitioning: boolean;
  readonly asyncMessage: string | null;
  readonly editingVehicleId: string | null;
  readonly goToStep: (step: UploadStepId) => void;
  readonly nextStep: () => void;
  readonly continueToNextStep: (validator?: () => boolean | void) => void;
  readonly prevStep: () => void;
  readonly markStepComplete: () => void;
  readonly updateIdentification: (values: Partial<UploadIdentificationData>) => void;
  readonly updatePricing: (values: Partial<UploadPricingData>) => void;
  readonly updateSpecifications: (values: Partial<UploadSpecificationsData>) => void;
  readonly toggleFeature: (featureId: string) => void;
  readonly setMedia: (
    media: readonly UploadMediaItem[] | ((media: readonly UploadMediaItem[]) => readonly UploadMediaItem[])
  ) => void;
  readonly updateDescription: (description: string) => void;
  readonly updatePublishing: (values: Partial<UploadPublishingData>) => void;
  readonly updateLicenceDisc: (values: Partial<UploadLicenceDiscData>) => void;
  readonly updateIdentificationAi: (values: Partial<UploadVehicleIdentificationData>) => void;
  readonly updateIntelligenceReview: (values: Partial<UploadIntelligenceReviewData>) => void;
  readonly updateDescriptionBuilder: (values: Partial<UploadDescriptionBuilderData>) => void;
  readonly updatePricingWorkspace: (values: Partial<UploadPricingWorkspaceData>) => void;
  readonly updatePublishResult: (values: Partial<UploadPublishResult>) => void;
  readonly runLicenceDiscOcr: () => Promise<void>;
  readonly runVehicleIdentification: () => Promise<void>;
  readonly runSurfIntelligenceReview: () => Promise<void>;
  readonly runDescriptionBuilder: () => Promise<void>;
  readonly runPricingWorkspace: () => Promise<void>;
  readonly saveDraft: () => Promise<void>;
  readonly clearDraft: () => void;
  readonly completePublish: () => UploadPublishScores;
  readonly publishListing: (publishNow: boolean) => Promise<void>;
  readonly startNewListing: () => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

const STEP_IDS = UPLOAD_STEPS.map((s) => s.id);
const UPLOAD_SYNC_CHANNEL = "surf4cars:vehicle-upload-draft-sync";

function createDraftId(): string {
  return `draft-${Date.now().toString(36)}`;
}

function createTabId(): string {
  return `tab-${Math.random().toString(36).slice(2, 10)}`;
}

function shouldApplyIncomingSnapshot(
  snapshot: NonNullable<ReturnType<typeof loadUploadDraft>>,
  currentRevision: number,
  currentUpdatedAt: string | null,
): boolean {
  const incomingRevision = snapshot.revision ?? 0;

  if (incomingRevision < currentRevision) {
    return false;
  }

  if (incomingRevision === currentRevision) {
    const incomingUpdatedAt = Date.parse(snapshot.updatedAt ?? "") || 0;
    const existingUpdatedAt = Date.parse(currentUpdatedAt ?? "") || 0;
    if (incomingUpdatedAt <= existingUpdatedAt) {
      return false;
    }
  }

  return true;
}

function sanitizeRecoveredMedia(data: UploadFormData): {
  readonly data: UploadFormData;
  readonly removedBlobMedia: boolean;
} {
  const media = data.media.filter((item) => !item.previewUrl.startsWith("blob:"));
  const removedBlobMedia = media.length !== data.media.length;

  const normalizedMedia = media.map((item, index) => ({
    ...item,
    uploadProgress: Math.max(0, Math.min(100, item.uploadProgress)),
    isPrimary: item.isPrimary || (index === 0 && !media.some((m) => m.isPrimary)),
  }));

  return {
    data: {
      ...data,
      media: normalizedMedia,
    },
    removedBlobMedia,
  };
}

function isTransientDraftSaveError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return ["failed to fetch", "network", "timeout", "502", "503", "504"].some((token) => message.includes(token));
}

/**
 * Instrumentation for the listing wizard, kept out of production builds.
 *
 * It was attaching `window.__pcp001eUploadDebug` in every environment — the production guard below
 * covered only the console line, not the array. So a shipped build accumulated a rolling window of
 * upload events, with their metadata, on the global object of every dealer's browser.
 *
 * Nobody else can read it: it lives in the dealer's own session and never leaves the page. It is
 * removed because debug scaffolding named after a programme id has no business in a build customers
 * use, not because it leaked. The call sites stay — they cost nothing once this returns early, and
 * they are genuinely useful when the wizard misbehaves in development.
 */
function appendUploadDebugEvent(event: string, meta: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;

  const target = window as typeof window & {
    __pcp001eUploadDebug?: Array<{ readonly ts: string; readonly event: string; readonly meta: Record<string, unknown> }>;
  };

  const entry = {
    ts: new Date().toISOString(),
    event,
    meta,
  } as const;

  target.__pcp001eUploadDebug = [...(target.__pcp001eUploadDebug ?? []).slice(-59), entry];

  /* No environment check here any more — the function returns early in production, so reaching this
     line already means the build is a development or test one. */
  console.info("[upload-debug]", entry);
}

function hasManualDescriptionBuilderCompletion(data: UploadFormData): boolean {
  return Boolean(
    data.descriptionBuilder.title.trim()
    && data.descriptionBuilder.description.trim()
    && data.descriptionBuilder.seoTitle.trim()
    && data.descriptionBuilder.seoDescription.trim(),
  );
}

export function UploadContextProvider({ children }: { readonly children: ReactNode }) {
  const searchParams = useSearchParams();
  const tabIdRef = useRef(createTabId());
  const remoteHydratedRef = useRef(false);
  const vehicleHydratedRef = useRef<string | null>(null);
  const savingIndicatorTimerRef = useRef<number | null>(null);
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<UploadFormData>(INITIAL_UPLOAD_DATA);
  const [completedSteps, setCompletedSteps] = useState<readonly UploadStepId[]>([]);
  const [draftId, setDraftId] = useState(() => createDraftId());
  const [revision, setRevision] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSuccessStep, setIsSuccessStep] = useState(false);
  const [publishScores, setPublishScores] = useState<UploadPublishScores | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);
  const [asyncMessage, setAsyncMessage] = useState<string | null>(null);
  const [isContextHydrated, setIsContextHydrated] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  const revisionRef = useRef(revision);
  const latestSnapshotRef = useRef<ReturnType<typeof loadUploadDraft>>(null);
  const lastSavedAtRef = useRef<string | null>(lastSavedAt);
  const currentStepIndexRef = useRef(currentStepIndex);
  const dataRef = useRef(data);
  const completedStepsRef = useRef(completedSteps);
  const draftIdRef = useRef(draftId);
  const transitionRef = useRef<{
    readonly id: string;
    readonly fromStepIndex: number;
    readonly toStepIndex: number;
    readonly startedAt: number;
  } | null>(null);
  const pendingIncomingSnapshotRef = useRef<{
    readonly snapshot: NonNullable<ReturnType<typeof loadUploadDraft>>;
    readonly message?: string;
    readonly options?: { readonly preserveStepIndex?: boolean };
  } | null>(null);

  const currentStep = STEP_IDS[currentStepIndex] ?? "media";

  const dealershipId = getActiveDealershipId();
  const requestedVehicleId = searchParams.get("vehicleId")?.trim() || null;

  // Local edits always produce a new data object, and every persist/apply records the object it
  // committed, so reference inequality is an exact "changed since last save" signal.
  const hasUnsavedLocalEdits = useCallback((): boolean => {
    const baseline = latestSnapshotRef.current;
    if (!baseline) return false;
    return dataRef.current !== baseline.data;
  }, []);

  const applySnapshot = useCallback((
    snapshot: ReturnType<typeof loadUploadDraft>,
    message?: string,
    options?: { readonly preserveStepIndex?: boolean },
  ) => {
    if (!snapshot) return;

    if (transitionRef.current) {
      pendingIncomingSnapshotRef.current = {
        snapshot,
        message,
        options,
      };

      appendUploadDebugEvent("transition.snapshot.deferred", {
        transitionId: transitionRef.current.id,
        sourceTabId: snapshot.sourceTabId ?? "unknown",
        snapshotStepIndex: snapshot.currentStepIndex,
      });
      return;
    }

    // Edits made since the last persist are newer than any revision an incoming snapshot can
    // carry, because the writer had not seen them yet. Applying it here would silently discard
    // whatever the dealer is typing, so the snapshot waits until the pending autosave lands and
    // is then re-evaluated against the freshly published revision.
    if (hasUnsavedLocalEdits()) {
      pendingIncomingSnapshotRef.current = {
        snapshot,
        message,
        options,
      };

      appendUploadDebugEvent("sync.snapshot.deferred", {
        reason: "unsaved-local-edits",
        sourceTabId: snapshot.sourceTabId ?? "unknown",
        incomingRevision: snapshot.revision ?? 0,
        localRevision: revisionRef.current,
      });
      return;
    }

    const { data: normalizedData, removedBlobMedia } = sanitizeRecoveredMedia(snapshot.data);
    const snapshotStepIndex = Math.max(0, Math.min(snapshot.currentStepIndex, STEP_IDS.length - 1));
    const nextStepIndex = options?.preserveStepIndex
      ? currentStepIndexRef.current
      : snapshotStepIndex;

    setData(normalizedData);
    setCurrentStepIndex(nextStepIndex);
    // Kept in lockstep with the committed value so a later Continue click can never
    // compute its origin step from a stale ref.
    currentStepIndexRef.current = nextStepIndex;
    setCompletedSteps(snapshot.completedSteps);
    setDraftId(snapshot.draftId);
    setRevision(snapshot.revision ?? 0);
    setLastSavedAt(snapshot.updatedAt ?? new Date().toISOString());
    // The applied data is what sanitisation produced, not the raw snapshot payload. Recording it
    // as the baseline (and syncing dataRef with it) is what lets the unsaved-edit check above
    // distinguish "the dealer typed something" from "we just adopted a remote snapshot".
    dataRef.current = normalizedData;
    latestSnapshotRef.current = { ...snapshot, data: normalizedData };
    revisionRef.current = snapshot.revision ?? 0;

    if (removedBlobMedia) {
      setAsyncMessage("Some local image uploads were interrupted and need re-upload after restore.");
    }

    if (message) {
      setAsyncMessage(message);
    }
  }, [hasUnsavedLocalEdits]);

  const persist = useCallback(
    (
      nextData: UploadFormData,
      stepIndex: number,
      completed: readonly UploadStepId[],
      id: string,
      forcedRevision?: number,
      options?: { readonly showSavingIndicator?: boolean },
    ) => {
      const showSavingIndicator = options?.showSavingIndicator ?? true;
      if (showSavingIndicator) {
        setIsSaving(true);
      }
      const storageSnapshot = loadUploadDraft();
      const globalRevision = Math.max(revisionRef.current, storageSnapshot?.revision ?? 0);
      const nextRevision = forcedRevision ?? (globalRevision + 1);
      const savedAt = new Date().toISOString();
      const snapshot = {
        data: nextData,
        currentStepIndex: stepIndex,
        completedSteps: completed,
        draftId: id,
        revision: nextRevision,
        updatedAt: savedAt,
        dealershipId: dealershipId ?? null,
        sourceTabId: tabIdRef.current,
      } as const;

      const result = saveUploadDraft(snapshot);
      if (!result.saved && result.existing) {
        applySnapshot(result.existing, "A newer draft was detected in another tab. Latest data loaded.");
      } else {
        latestSnapshotRef.current = snapshot;
        revisionRef.current = nextRevision;
        setRevision(nextRevision);
        setLastSavedAt(savedAt);
        lastSavedAtRef.current = savedAt;
        syncChannelRef.current?.postMessage(snapshot);
      }

      if (showSavingIndicator) {
        if (savingIndicatorTimerRef.current) {
          window.clearTimeout(savingIndicatorTimerRef.current);
        }
        savingIndicatorTimerRef.current = window.setTimeout(() => setIsSaving(false), 280);
      }

      return latestSnapshotRef.current;
    },
    [applySnapshot, dealershipId],
  );

  // Releases a snapshot that was held back by a step transition or by unsaved local edits. The
  // revision guard is re-applied at release time: once the local edit has been published the
  // held snapshot is usually stale and is correctly discarded, but a genuinely newer remote
  // change still lands instead of being lost.
  const drainPendingIncomingSnapshot = useCallback(() => {
    const pending = pendingIncomingSnapshotRef.current;
    if (!pending) return;
    if (transitionRef.current || hasUnsavedLocalEdits()) return;

    pendingIncomingSnapshotRef.current = null;

    if (!shouldApplyIncomingSnapshot(pending.snapshot, revisionRef.current, lastSavedAtRef.current)) {
      appendUploadDebugEvent("sync.snapshot.discarded", {
        reason: "superseded-by-local-revision",
        incomingRevision: pending.snapshot.revision ?? 0,
        localRevision: revisionRef.current,
      });
      return;
    }

    appendUploadDebugEvent("sync.snapshot.applied", {
      incomingRevision: pending.snapshot.revision ?? 0,
      localRevision: revisionRef.current,
    });
    applySnapshot(pending.snapshot, pending.message, pending.options);
  }, [applySnapshot, hasUnsavedLocalEdits]);

  const withBusy = useCallback(async (fn: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await fn();
    } finally {
      setIsBusy(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const initialDraft = loadUploadDraft();
      if (initialDraft) {
        applySnapshot(initialDraft);
      }

      setIsContextHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  useEffect(() => {
    revisionRef.current = revision;
  }, [revision]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [applySnapshot, currentStepIndex]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    completedStepsRef.current = completedSteps;
  }, [completedSteps]);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => {
    lastSavedAtRef.current = lastSavedAt;
  }, [lastSavedAt]);

  useEffect(() => {
    if (!isContextHydrated) {
      return;
    }

    if (isSuccessStep) {
      return;
    }

    if (transitionRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      persist(data, currentStepIndex, completedSteps, draftId);
      drainPendingIncomingSnapshot();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [completedSteps, currentStepIndex, data, draftId, drainPendingIncomingSnapshot, isContextHydrated, isSuccessStep, persist]);

  useEffect(() => {
    if (!isContextHydrated) {
      return;
    }

    function onStorage(event: StorageEvent) {
      const snapshot = readUploadDraftFromStorageEvent(event);
      if (!snapshot) return;
      if (snapshot.sourceTabId === tabIdRef.current) return;
      if (!shouldApplyIncomingSnapshot(snapshot, revisionRef.current, lastSavedAtRef.current)) return;

      applySnapshot(snapshot, "Changes from another tab were synced into this draft.", { preserveStepIndex: true });
    }

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [applySnapshot, isContextHydrated]);

  useEffect(() => {
    if (!isContextHydrated || typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel(UPLOAD_SYNC_CHANNEL);
    syncChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ReturnType<typeof loadUploadDraft>>) => {
      const snapshot = event.data;
      if (!snapshot) return;
      if (snapshot.sourceTabId === tabIdRef.current) return;
      if (!shouldApplyIncomingSnapshot(snapshot, revisionRef.current, lastSavedAtRef.current)) return;

      applySnapshot(snapshot, "Changes from another tab were synced into this draft.", { preserveStepIndex: true });
    };

    return () => {
      if (syncChannelRef.current === channel) {
        syncChannelRef.current = null;
      }
      channel.close();
    };
  }, [applySnapshot, isContextHydrated]);

  useEffect(() => {
    if (!isContextHydrated) return;
    if (!dealershipId || remoteHydratedRef.current) return;
    remoteHydratedRef.current = true;
    const activeDealershipId = dealershipId;

    let cancelled = false;

    async function hydrateFromRemote() {
      try {
        const remoteDraft = await getListingBuilderDraft({ dealershipId: activeDealershipId, draftId });
        if (!remoteDraft || cancelled) return;

        if (remoteDraft.revision > revisionRef.current) {
          const clampedStep = Math.max(0, Math.min(remoteDraft.currentStepIndex, STEP_IDS.length - 1));
          const inferredCompleted = STEP_IDS.slice(0, clampedStep) as readonly UploadStepId[];
          applySnapshot(
            {
              data: remoteDraft.payload,
              currentStepIndex: clampedStep,
              completedSteps: inferredCompleted,
              draftId: remoteDraft.draftId,
              revision: remoteDraft.revision,
              updatedAt: remoteDraft.updatedAt,
              dealershipId: activeDealershipId,
              sourceTabId: "remote",
            },
            "Recovered your latest saved draft from the server.",
          );
        }
      } catch {
        setAsyncMessage("Unable to recover server draft right now. Continuing with local draft.");
      }
    }

    void hydrateFromRemote();

    return () => {
      cancelled = true;
    };
  }, [applySnapshot, dealershipId, draftId, isContextHydrated]);

  useEffect(() => {
    if (!isContextHydrated || !dealershipId || !requestedVehicleId) return;
    const activeDealershipId = dealershipId;
    const vehicleId = requestedVehicleId;
    if (vehicleHydratedRef.current === vehicleId) return;
    vehicleHydratedRef.current = vehicleId;

    let cancelled = false;

    async function hydrateFromVehicle() {
      if (!vehicleId) return;
      try {
        const workspace = await getVehicleWorkspaceData(activeDealershipId, vehicleId);
        if (cancelled) return;

        // An existing inventory listing already satisfies every builder step, so it is restored
        // as complete and opened on review rather than replayed from the first step.
        const reviewStepIndex = STEP_IDS.length - 1;
        applySnapshot(
          {
            data: buildUploadFormDataFromWorkspace(workspace),
            currentStepIndex: reviewStepIndex,
            completedSteps: STEP_IDS.slice(0, reviewStepIndex) as readonly UploadStepId[],
            draftId: createDraftId(),
            revision: 0,
            updatedAt: new Date().toISOString(),
            dealershipId: activeDealershipId,
            sourceTabId: "vehicle-edit",
          },
          "Published listing loaded into the builder for editing.",
        );
        setEditingVehicleId(vehicleId);
        setIsSuccessStep(false);
        setPublishScores(null);
      } catch {
        setAsyncMessage("Unable to load the published listing into the builder right now.");
      }
    }

    void hydrateFromVehicle();

    return () => {
      cancelled = true;
    };
  }, [applySnapshot, dealershipId, isContextHydrated, requestedVehicleId]);

  useEffect(() => () => {
    if (savingIndicatorTimerRef.current) {
      window.clearTimeout(savingIndicatorTimerRef.current);
    }
  }, []);

  const markStepComplete = useCallback(() => {
    appendUploadDebugEvent("step.complete", {
      step: currentStep,
      currentStepIndex,
      completedSteps,
    });
    setCompletedSteps((prev) => {
      if (prev.includes(currentStep)) return prev;
      return [...prev, currentStep];
    });
  }, [completedSteps, currentStep, currentStepIndex]);

  const goToStep = useCallback(
    (step: UploadStepId) => {
      const index = STEP_IDS.indexOf(step);
      if (index >= 0) {
        appendUploadDebugEvent("step.goto", {
          fromStep: STEP_IDS[currentStepIndex],
          fromStepIndex: currentStepIndex,
          toStep: step,
          toStepIndex: index,
          isBusy,
        });
        setCurrentStepIndex(index);
        persist(data, index, completedSteps, draftId, undefined, { showSavingIndicator: false });
      }
    },
    [completedSteps, currentStepIndex, data, draftId, isBusy, persist],
  );

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = Math.min(prev + 1, STEP_IDS.length - 1);
      appendUploadDebugEvent("step.next", {
        fromStep: STEP_IDS[prev],
        fromStepIndex: prev,
        toStep: STEP_IDS[next],
        toStepIndex: next,
        isBusy,
      });
      persist(data, next, completedSteps, draftId, undefined, { showSavingIndicator: false });
      return next;
    });
  }, [completedSteps, data, draftId, isBusy, persist]);

  const continueToNextStep = useCallback((validator?: () => boolean | void) => {
    const fromStepIndex = currentStepIndexRef.current;
    const toStepIndex = Math.min(fromStepIndex + 1, STEP_IDS.length - 1);

    if (toStepIndex === fromStepIndex) {
      return;
    }

    if (transitionRef.current) {
      appendUploadDebugEvent("transition.continue.skipped", {
        reason: "transition-in-progress",
        transitionId: transitionRef.current.id,
      });
      return;
    }

    const transitionId = `continue-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const startedAt = Date.now();

    transitionRef.current = {
      id: transitionId,
      fromStepIndex,
      toStepIndex,
      startedAt,
    };
    setIsStepTransitioning(true);

    appendUploadDebugEvent("transition.click", {
      transitionId,
      fromStep: STEP_IDS[fromStepIndex],
      fromStepIndex,
      toStep: STEP_IDS[toStepIndex],
      toStepIndex,
    });

    appendUploadDebugEvent("transition.validation.start", {
      transitionId,
      elapsedMs: Date.now() - startedAt,
    });
    const canProceed = validator?.();
    if (canProceed === false) {
      appendUploadDebugEvent("transition.validation.blocked", {
        transitionId,
        elapsedMs: Date.now() - startedAt,
      });
      transitionRef.current = null;
      setIsStepTransitioning(false);
      return;
    }
    appendUploadDebugEvent("transition.validation.complete", {
      transitionId,
      elapsedMs: Date.now() - startedAt,
    });

    const fromStep = STEP_IDS[fromStepIndex];
    if (!fromStep) {
      appendUploadDebugEvent("transition.validation.blocked", {
        transitionId,
        reason: "invalid-from-step",
        fromStepIndex,
        elapsedMs: Date.now() - startedAt,
      });
      transitionRef.current = null;
      setIsStepTransitioning(false);
      return;
    }
    const committedCompleted = completedStepsRef.current.includes(fromStep)
      ? completedStepsRef.current
      : [...completedStepsRef.current, fromStep];

    if (!completedStepsRef.current.includes(fromStep)) {
      setCompletedSteps(committedCompleted);
      appendUploadDebugEvent("transition.context.commit.step-complete", {
        transitionId,
        step: fromStep,
        elapsedMs: Date.now() - startedAt,
      });
    }

    appendUploadDebugEvent("transition.persist.start", {
      transitionId,
      elapsedMs: Date.now() - startedAt,
    });
    const persisted = persist(
      dataRef.current,
      toStepIndex,
      committedCompleted,
      draftIdRef.current,
      undefined,
      { showSavingIndicator: false },
    );
    appendUploadDebugEvent("transition.revision.update", {
      transitionId,
      revision: persisted?.revision ?? revisionRef.current,
      elapsedMs: Date.now() - startedAt,
    });

    appendUploadDebugEvent("transition.context.commit.step-index", {
      transitionId,
      toStepIndex,
      elapsedMs: Date.now() - startedAt,
    });
    setCurrentStepIndex(toStepIndex);
    currentStepIndexRef.current = toStepIndex;

    appendUploadDebugEvent("transition.render.requested", {
      transitionId,
      elapsedMs: Date.now() - startedAt,
    });
  }, [persist]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      appendUploadDebugEvent("step.prev", {
        fromStep: STEP_IDS[prev],
        fromStepIndex: prev,
        toStep: STEP_IDS[next],
        toStepIndex: next,
        isBusy,
      });
      persist(data, next, completedSteps, draftId, undefined, { showSavingIndicator: false });
      return next;
    });
  }, [completedSteps, data, draftId, isBusy, persist]);

  useEffect(() => {
    appendUploadDebugEvent("step.current", {
      step: currentStep,
      currentStepIndex,
      isBusy,
      intelligenceStatus: data.intelligenceReview.status,
      descriptionStatus: data.descriptionBuilder.generationStatus,
    });
  }, [currentStep, currentStepIndex, data.descriptionBuilder.generationStatus, data.intelligenceReview.status, isBusy]);

  useEffect(() => {
    const transition = transitionRef.current;
    if (!transition) {
      return;
    }

    if (currentStepIndex !== transition.toStepIndex) {
      return;
    }

    appendUploadDebugEvent("transition.navigation.complete", {
      transitionId: transition.id,
      toStep: STEP_IDS[transition.toStepIndex],
      toStepIndex: transition.toStepIndex,
      elapsedMs: Date.now() - transition.startedAt,
    });

    // The next step's DOM is committed by the time this effect runs, so the transition is
    // complete here. Completion must not depend on animation frames: they are throttled in
    // backgrounded tabs, and a frame that never arrives would leave transitionRef set, which
    // permanently skips every later Continue click and strands deferred cross-tab snapshots.
    appendUploadDebugEvent("transition.ready", {
      transitionId: transition.id,
      elapsedMs: Date.now() - transition.startedAt,
    });
    transitionRef.current = null;
    setIsStepTransitioning(false);

    drainPendingIncomingSnapshot();
    // isStepTransitioning is a dependency so this effect also runs on the commit that starts a
    // transition. Without it, a transition whose target step equals the committed step index
    // produces no re-render and would never be released.
  }, [currentStepIndex, drainPendingIncomingSnapshot, isStepTransitioning]);

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

  const setMedia = useCallback((mediaOrUpdater: readonly UploadMediaItem[] | ((media: readonly UploadMediaItem[]) => readonly UploadMediaItem[])) => {
    setData((prev) => {
      const nextMedia = typeof mediaOrUpdater === "function"
        ? mediaOrUpdater(prev.media)
        : mediaOrUpdater;
      return { ...prev, media: nextMedia };
    });
  }, []);

  const updateDescription = useCallback((description: string) => {
    setData((prev) => ({ ...prev, description }));
  }, []);

  const updatePublishing = useCallback((values: Partial<UploadPublishingData>) => {
    setData((prev) => ({ ...prev, publishing: { ...prev.publishing, ...values } }));
  }, []);

  const updateLicenceDisc = useCallback((values: Partial<UploadLicenceDiscData>) => {
    setData((prev) => ({ ...prev, licenceDisc: { ...prev.licenceDisc, ...values } }));
  }, []);

  const updateIdentificationAi = useCallback((values: Partial<UploadVehicleIdentificationData>) => {
    setData((prev) => ({ ...prev, identificationAi: { ...prev.identificationAi, ...values } }));
  }, []);

  const updateIntelligenceReview = useCallback((values: Partial<UploadIntelligenceReviewData>) => {
    setData((prev) => ({ ...prev, intelligenceReview: { ...prev.intelligenceReview, ...values } }));
  }, []);

  const updateDescriptionBuilder = useCallback((values: Partial<UploadDescriptionBuilderData>) => {
    setData((prev) => {
      const mergedBuilder: UploadDescriptionBuilderData = {
        ...prev.descriptionBuilder,
        ...values,
      };

      const hasManualCompletion = Boolean(
        mergedBuilder.title.trim()
        && mergedBuilder.description.trim()
        && mergedBuilder.seoTitle.trim()
        && mergedBuilder.seoDescription.trim(),
      );

      const normalizedBuilder: UploadDescriptionBuilderData = hasManualCompletion && mergedBuilder.generationStatus !== "complete"
        ? {
            ...mergedBuilder,
            generationStatus: "complete",
            generationMessage: "Description Builder completed with manual enrichment.",
          }
        : mergedBuilder;

      return {
        ...prev,
        descriptionBuilder: normalizedBuilder,
      };
    });
  }, []);

  const updatePricingWorkspace = useCallback((values: Partial<UploadPricingWorkspaceData>) => {
    setData((prev) => ({ ...prev, pricingWorkspace: { ...prev.pricingWorkspace, ...values } }));
  }, []);

  const updatePublishResult = useCallback((values: Partial<UploadPublishResult>) => {
    setData((prev) => ({ ...prev, publishResult: { ...prev.publishResult, ...values } }));
  }, []);

  const runLicenceDiscOcrAction = useCallback(async () => {
    await withBusy(async () => {
      updateLicenceDisc({ analysisStatus: "pending", analysisMessage: "Awaiting OCR analysis" });
      const result = await runLicenceDiscOcr({
        imageName: data.licenceDisc.fileName,
        imageUrl: data.licenceDisc.fileUrl,
      });

      const analysisStatus = result.status === "awaiting-ai-analysis" ? "pending" : "complete";

      updateLicenceDisc({
        analysisStatus,
        analysisMessage: result.message,
        extractedRegistration: result.registrationNumber ?? "",
        extractedVin: result.vin ?? "",
        extractedExpiryDate: result.expiryDate ?? "",
      });

      if (result.registrationNumber) {
        updateIdentification({ registration: result.registrationNumber });
      }

      if (result.vin) {
        updateIdentification({ vin: result.vin });
      }

      setAsyncMessage(result.message);
    });
  }, [
    data.licenceDisc.fileName,
    data.licenceDisc.fileUrl,
    updateIdentification,
    updateLicenceDisc,
    withBusy,
  ]);

  const runVehicleIdentificationAction = useCallback(async () => {
    await withBusy(async () => {
      updateIdentificationAi({ analysisStatus: "pending", analysisMessage: "Awaiting AI analysis" });
      const result = await runVehicleIdentification({
        photoUrls: data.media.filter((m) => m.kind === "photo").map((m) => m.previewUrl),
        licenceDiscRegistration: data.licenceDisc.extractedRegistration || undefined,
        vin: data.identification.vin || data.licenceDisc.extractedVin || undefined,
      });

      const analysisStatus = result.status === "awaiting-ai-analysis" ? "pending" : "complete";

      updateIdentificationAi({
        analysisStatus,
        analysisMessage: result.message,
        provider: result.providerState.provider,
      });

      updateIdentification({
        make: result.make ?? data.identification.make,
        model: result.model ?? data.identification.model,
        variant: result.variant ?? data.identification.variant,
        year: result.year ? String(result.year) : data.identification.year,
        vin: result.vin ?? data.identification.vin,
      });

      updateSpecifications({
        colour: result.colour ?? data.specifications.colour,
        fuel: result.fuelType ?? data.specifications.fuel,
        transmission: result.transmission ?? data.specifications.transmission,
        engine: result.engineSize ?? data.specifications.engine,
      });

      setAsyncMessage(result.message);
    });
  }, [
    data.identification.make,
    data.identification.model,
    data.identification.variant,
    data.identification.vin,
    data.identification.year,
    data.licenceDisc.extractedRegistration,
    data.licenceDisc.extractedVin,
    data.media,
    data.specifications.colour,
    data.specifications.engine,
    data.specifications.fuel,
    data.specifications.transmission,
    updateIdentification,
    updateIdentificationAi,
    updateSpecifications,
    withBusy,
  ]);

  const runSurfIntelligenceReviewAction = useCallback(async () => {
    appendUploadDebugEvent("features.surf-review.start", {
      step: currentStep,
      currentStepIndex,
      isBusy,
    });

    await withBusy(async () => {
      updateIntelligenceReview({
        status: "pending",
        qualityScore: 0,
        missingInformation: [],
        missingPhotos: [],
        suggestedImprovements: [],
      });

      const listing = {
        title: resolveListingTitle(data),
        description: resolveListingDescription(data),
        seoTitle: data.descriptionBuilder.seoTitle,
        seoDescription: data.descriptionBuilder.seoDescription,
        askingPriceCents: Number(data.pricing.sellingPrice || 0) * 100,
        currency: "ZAR",
        vin: data.identification.vin,
        registrationNumber: data.identification.registration,
        mileageKm: Number(data.specifications.mileage || 0),
        photoCount: countListingPhotos(data),
        hasPrimaryPhoto: hasPrimaryListingPhoto(data),
        serviceHistoryAvailable: false,
      } as const;

      try {
        const result = await runSurfReview({
          listing,
          pricing: {
            make: data.identification.make,
            model: data.identification.model,
            year: Number(data.identification.year || 0) || undefined,
            mileageKm: Number(data.specifications.mileage || 0),
            askingPriceCents: listing.askingPriceCents,
            currency: "ZAR",
          },
          images: {
            images: data.media
              .filter((m) => m.kind === "photo")
              .map((media) => ({
                imageId: media.id,
                width: media.width ?? null,
                height: media.height ?? null,
                angleTag: media.angleTag,
                fingerprint: media.fingerprint,
              })),
          },
          market: {
            make: data.identification.make,
            model: data.identification.model,
            year: Number(data.identification.year || 0) || undefined,
            askingPriceCents: listing.askingPriceCents,
          },
        });

        updateIntelligenceReview({
          status: "complete",
          qualityScore: result.listingQuality.qualityScore,
          missingInformation: result.listingQuality.missingInformation,
          missingPhotos: result.imageIntelligence.missingAngles,
          suggestedImprovements: result.dealerInsights.recommendations.map((rec) => rec.title),
        });

        setAsyncMessage("SURF Intelligence review complete.");
        appendUploadDebugEvent("features.surf-review.complete", {
          qualityScore: result.listingQuality.qualityScore,
          missingInfoCount: result.listingQuality.missingInformation.length,
          missingPhotoCount: result.imageIntelligence.missingAngles.length,
        });
      } catch (error) {
        updateIntelligenceReview({
          status: "idle",
          qualityScore: 0,
          missingInformation: [],
          missingPhotos: [],
          suggestedImprovements: [],
        });
        setAsyncMessage(error instanceof Error ? error.message : "SURF Intelligence review failed.");
        appendUploadDebugEvent("features.surf-review.error", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }, [
    currentStep,
    currentStepIndex,
    data,
    isBusy,
    updateIntelligenceReview,
    withBusy,
  ]);

  const runDescriptionBuilderAction = useCallback(async () => {
    await withBusy(async () => {
      updateDescriptionBuilder({ generationStatus: "pending", generationMessage: "Awaiting AI analysis" });
      try {
        const result = await runDescriptionBuilder({
          make: data.identification.make,
          model: data.identification.model,
          variant: data.identification.variant,
          year: Number(data.identification.year || 0) || undefined,
          mileageKm: Number(data.specifications.mileage || 0) || undefined,
          fuelType: data.specifications.fuel,
          transmission: data.specifications.transmission,
        });

        const generationStatus = result.status === "awaiting-ai-analysis" ? "pending" : "complete";

        const nextDescriptionBuilder: Partial<UploadDescriptionBuilderData> = {
          generationStatus,
          generationMessage: result.message,
          highlights: result.highlights,
          ...(typeof result.title === "string" ? { title: result.title } : {}),
          ...(typeof result.description === "string" ? { description: result.description } : {}),
          ...(typeof result.seoTitle === "string" ? { seoTitle: result.seoTitle } : {}),
          ...(typeof result.seoDescription === "string" ? { seoDescription: result.seoDescription } : {}),
        };

        const nextDataSnapshot: UploadFormData = {
          ...dataRef.current,
          descriptionBuilder: {
            ...dataRef.current.descriptionBuilder,
            ...nextDescriptionBuilder,
          },
        };

        const normalizedDescriptionBuilder: Partial<UploadDescriptionBuilderData> =
          hasManualDescriptionBuilderCompletion(nextDataSnapshot) && nextDescriptionBuilder.generationStatus !== "complete"
            ? {
                ...nextDescriptionBuilder,
                generationStatus: "complete",
                generationMessage: "Description Builder completed with manual enrichment.",
              }
            : nextDescriptionBuilder;

        updateDescriptionBuilder(normalizedDescriptionBuilder);
        setAsyncMessage(result.message);
      } catch (error) {
        updateDescriptionBuilder({ generationStatus: "idle", generationMessage: "Description Builder failed. You can continue with manual copy." });
        setAsyncMessage(error instanceof Error ? error.message : "Description Builder failed.");
      }
    });
  }, [
    data.identification.make,
    data.identification.model,
    data.identification.variant,
    data.identification.year,
    data.specifications.fuel,
    data.specifications.mileage,
    data.specifications.transmission,
    updateDescriptionBuilder,
    withBusy,
  ]);

  const runPricingWorkspaceAction = useCallback(async () => {
    await withBusy(async () => {
      updatePricingWorkspace({ status: "pending", statusMessage: "Awaiting live market data" });

      try {
        const pricingResult = await runPricingIntelligence({
          make: data.identification.make,
          model: data.identification.model,
          year: Number(data.identification.year || 0) || undefined,
          mileageKm: Number(data.specifications.mileage || 0),
          askingPriceCents: Number(data.pricing.sellingPrice || 0) * 100,
          currency: "ZAR",
        });

        const marketResult = await runMarketIntelligence({
          make: data.identification.make,
          model: data.identification.model,
          year: Number(data.identification.year || 0) || undefined,
          askingPriceCents: Number(data.pricing.sellingPrice || 0) * 100,
        });

        const status = pricingResult.status === "awaiting-live-market-data" || marketResult.status === "awaiting-live-market-data"
          ? "pending"
          : "complete";

        updatePricingWorkspace({
          status,
          statusMessage: pricingResult.recommendation.rationale,
          recommendedPriceCents: pricingResult.recommendation.recommendedPriceCents,
          confidence: pricingResult.recommendation.confidence,
          marketPosition: marketResult.pricePositioning,
        });

        setAsyncMessage(pricingResult.recommendation.rationale);
      } catch (error) {
        updatePricingWorkspace({ status: "idle", statusMessage: "Pricing intelligence unavailable. You can continue with manual pricing." });
        setAsyncMessage(error instanceof Error ? error.message : "Pricing intelligence failed.");
      }
    });
  }, [
    data.identification.make,
    data.identification.model,
    data.identification.year,
    data.pricing.sellingPrice,
    data.specifications.mileage,
    updatePricingWorkspace,
    withBusy,
  ]);

  const saveDraft = useCallback(async () => {
    const snapshot = persist(data, currentStepIndex, completedSteps, draftId);

    if (!dealershipId) {
      return;
    }

    const payload = {
      dealershipId,
      draftId,
      currentStepIndex,
      revision: snapshot?.revision ?? revisionRef.current,
      updatedAt: snapshot?.updatedAt ?? new Date().toISOString(),
      data,
    } as const;

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await saveListingBuilderDraftRemote(payload);
        return;
      } catch (error) {
        lastError = error;
        if (!isTransientDraftSaveError(error) || attempt === 2) {
          break;
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Failed to save listing draft.");
  }, [completedSteps, currentStepIndex, data, dealershipId, draftId, persist]);

  const clearDraft = useCallback(() => {
    clearUploadDraft();
    setData(INITIAL_UPLOAD_DATA);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    const nextDraftId = createDraftId();
    setDraftId(nextDraftId);
    setRevision(0);
    revisionRef.current = 0;
    latestSnapshotRef.current = null;
    setLastSavedAt(null);
    setIsSuccessStep(false);
    setPublishScores(null);
    setAsyncMessage(null);
    setEditingVehicleId(null);
    vehicleHydratedRef.current = null;
  }, []);

  const completePublish = useCallback(() => {
    const scores = computePublishScores(data);
    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    setPublishScores(scores);
    setIsSuccessStep(true);
    clearUploadDraft();
    return scores;
  }, [data, currentStep]);

  const publishListing = useCallback(async (publishNow: boolean) => {
    const startedAt = Date.now();
    if (!dealershipId) {
      updatePublishResult({
        status: "failed",
        message: "No active dealership selected.",
        vehicleId: null,
      });
      return;
    }

    await withBusy(async () => {
      appendUploadDebugEvent("publish.ui.requested", {
        publishNow,
        editingVehicleId,
        step: currentStep,
      });
      updatePublishResult({ status: "pending", message: "Publishing listing…", vehicleId: null });

      appendUploadDebugEvent("publish.api.request.start", {
        publishNow,
        elapsedMs: Date.now() - startedAt,
      });
      const response = await publishListingFromBuilder({
        dealershipId,
        draftId,
        vehicleId: editingVehicleId ?? undefined,
        publishNow,
        data,
      });
      appendUploadDebugEvent("publish.api.request.complete", {
        publishNow,
        vehicleId: response.vehicleId,
        lifecycleStatus: response.lifecycleStatus,
        elapsedMs: Date.now() - startedAt,
      });

      updatePublishResult({
        status: "published",
        message: editingVehicleId
          ? (publishNow ? "Vehicle updated in inventory." : "Vehicle saved as draft in inventory.")
          : (publishNow ? "Vehicle published to inventory." : "Vehicle saved as draft in inventory."),
        vehicleId: response.vehicleId,
      });
      setEditingVehicleId(response.vehicleId);
      completePublish();
      appendUploadDebugEvent("publish.ui.complete", {
        publishNow,
        vehicleId: response.vehicleId,
        elapsedMs: Date.now() - startedAt,
      });
    });
  }, [completePublish, currentStep, data, dealershipId, draftId, editingVehicleId, updatePublishResult, withBusy]);

  const startNewListing = useCallback(() => {
    if (requestedVehicleId) {
      window.location.replace("/dealer/inventory/new");
      return;
    }
    clearDraft();
  }, [clearDraft, requestedVehicleId]);

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
      isBusy,
      isStepTransitioning,
      asyncMessage,
      editingVehicleId,
      goToStep,
      nextStep,
      continueToNextStep,
      prevStep,
      markStepComplete,
      updateIdentification,
      updatePricing,
      updateSpecifications,
      toggleFeature,
      setMedia,
      updateDescription,
      updatePublishing,
      updateLicenceDisc,
      updateIdentificationAi,
      updateIntelligenceReview,
      updateDescriptionBuilder,
      updatePricingWorkspace,
      updatePublishResult,
      runLicenceDiscOcr: runLicenceDiscOcrAction,
      runVehicleIdentification: runVehicleIdentificationAction,
      runSurfIntelligenceReview: runSurfIntelligenceReviewAction,
      runDescriptionBuilder: runDescriptionBuilderAction,
      runPricingWorkspace: runPricingWorkspaceAction,
      saveDraft,
      clearDraft,
      completePublish,
      publishListing,
      startNewListing,
    }),
    [
      asyncMessage,
      clearDraft,
      completePublish,
      completedSteps,
      currentStep,
      currentStepIndex,
      data,
      draftId,
      editingVehicleId,
      goToStep,
      isBusy,
      isStepTransitioning,
      isSaving,
      isSuccessStep,
      lastSavedAt,
      markStepComplete,
      continueToNextStep,
      nextStep,
      prevStep,
      publishListing,
      publishScores,
      runDescriptionBuilderAction,
      runLicenceDiscOcrAction,
      runPricingWorkspaceAction,
      runSurfIntelligenceReviewAction,
      runVehicleIdentificationAction,
      saveDraft,
      setMedia,
      startNewListing,
      toggleFeature,
      updateDescription,
      updateDescriptionBuilder,
      updateIdentification,
      updateIdentificationAi,
      updateIntelligenceReview,
      updateLicenceDisc,
      updatePricing,
      updatePricingWorkspace,
      updatePublishResult,
      updatePublishing,
      updateSpecifications,
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
