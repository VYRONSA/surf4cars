"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { Icon } from "@/components/ui/icons";
import { Heart, Share2 } from "@/components/ui/icons/registry";
import { getClientActiveBuyerContext } from "@/features/authentication";
import {
  createSavedVehicle,
  deleteSavedVehicle,
  listSavedVehicles,
} from "@/features/buyer-intelligence/services/buyer-intelligence.api";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

/**
 * Save and share.
 *
 * Extracted unchanged in behaviour from `VehicleDetailActions`, which also rendered a permanently
 * disabled Compare button between them. Compare is not built, and a third of a row of actions that
 * never responds teaches a buyer to stop trying the other two.
 *
 * Set as quiet text links rather than as three equal-weight buttons: neither is the action this page
 * is asking for, and at button weight they competed with the enquiry call-to-action directly above.
 */

export interface VehicleDetailSaveShareProps {
  readonly vehicle: VehicleDetail;
  readonly className?: string;
}

export function VehicleDetailSaveShare({ vehicle, className }: VehicleDetailSaveShareProps) {
  const buyerId = useSyncExternalStore(subscribeBuyerContext, getClientActiveBuyerContext, () => null);
  const [savedVehicleId, setSavedVehicleId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedVehicleState() {
      if (!buyerId) {
        if (!cancelled) {
          setSavedVehicleId(null);
          setIsSyncing(false);
        }
        return;
      }

      setIsSyncing(true);

      try {
        const savedVehicles = await listSavedVehicles(buyerId);
        const savedRecord = savedVehicles.find((item) => item.vehicleId === vehicle.id);
        if (!cancelled) setSavedVehicleId(savedRecord?.id ?? null);
      } catch {
        if (!cancelled) setSavedVehicleId(null);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    }

    void loadSavedVehicleState();

    return () => {
      cancelled = true;
    };
  }, [buyerId, vehicle.id]);

  async function toggleSavedVehicle() {
    setStatusMessage(null);

    if (!buyerId) {
      setStatusMessage("Sign in as a buyer to save vehicles.");
      return;
    }

    setIsSaving(true);

    try {
      if (savedVehicleId) {
        await deleteSavedVehicle({ buyerId, id: savedVehicleId });
        setSavedVehicleId(null);
        setStatusMessage("Removed from saved vehicles.");
      } else {
        const saved = await createSavedVehicle({ buyerId, vehicleId: vehicle.id });
        setSavedVehicleId(saved.id);
        setStatusMessage("Saved to your buyer profile.");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to update saved vehicles.");
    } finally {
      setIsSaving(false);
    }
  }

  async function shareVehicle() {
    setStatusMessage(null);

    const shareUrl = typeof window !== "undefined" ? window.location.href : `/vehicle/${vehicle.slug}`;
    const sharePayload = {
      title: vehicle.title,
      text: `Take a look at this ${vehicle.title} on SURF FOR CARS.`,
      url: shareUrl,
    };

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share(sharePayload);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setStatusMessage("Vehicle link copied.");
      } else {
        setStatusMessage("Sharing is not available in this browser.");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to share vehicle.");
    }
  }

  const linkClass = cn(
    "motion-nav inline-flex items-center gap-2 text-[length:var(--text-body-sm)]",
    "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    "rounded-[var(--radius-sm)] disabled:opacity-50",
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={() => void toggleSavedVehicle()}
          disabled={isSaving || isSyncing}
          aria-pressed={Boolean(savedVehicleId)}
          className={linkClass}
        >
          <Icon
            icon={Heart}
            aria-hidden
            className={cn("size-4", savedVehicleId && "text-[var(--color-primary-text)]")}
          />
          {savedVehicleId ? "Saved" : "Save"}
        </button>

        <button type="button" onClick={() => void shareVehicle()} className={linkClass}>
          <Icon icon={Share2} aria-hidden className="size-4" />
          Share
        </button>
      </div>

      {statusMessage && (
        <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          {statusMessage}
        </p>
      )}
    </div>
  );
}

function subscribeBuyerContext(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}
