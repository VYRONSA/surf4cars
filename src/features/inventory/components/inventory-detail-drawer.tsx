"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image";

import { PhotographPending } from "@/components/ui/media";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import {
  Archive,
  Copy,
  Edit,
  Image as ImageIcon,
  Megaphone,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from "@/components/ui/icons/registry";
import {
  InventoryHealthBadge,
  InventoryScoreRing,
  InventoryStatusBadge,
} from "@/features/inventory/components/inventory-health-badge";
import type { InventoryVehicle } from "@/features/inventory/types/inventory.types";
import { cn } from "@/utils";

export interface InventoryDetailDrawerProps {
  readonly vehicle: InventoryVehicle | undefined;
  readonly open: boolean;
  readonly onClose: () => void;
}

export function InventoryDetailDrawer({ vehicle, open, onClose }: InventoryDetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={vehicle.title}>
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm motion-nav"
        aria-label="Close panel"
        onClick={onClose}
      />

      <aside
        className={cn(
          "relative flex h-full w-full max-w-lg flex-col overflow-hidden",
          "border-l border-[var(--color-border-subtle)] bg-[var(--color-surface)]",
          "shadow-[var(--shadow-2xl)] motion-drawer animate-slide-up-sfc",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] p-5">
          <div className="min-w-0">
            <InventoryStatusBadge status={vehicle.status} />
            <h2 className="mt-2 text-[length:var(--text-h5)] font-semibold leading-[var(--leading-snug)]">
              {vehicle.title}
            </h2>
            <p className="mt-1 font-mono text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              {vehicle.stockNumber}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <Icon icon={X} size="sm" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--color-surface-sunken)]">
            {/* A dealer's own inventory is exactly where an unphotographed listing must be visible
                rather than dressed up — this is the screen they fix it from. */}
            {vehicle.imageSrc ? (
              <Image
                src={vehicle.imageSrc}
                alt={vehicle.title}
                fill
                sizes="480px"
                className="object-cover"
                style={{ objectPosition: vehicle.imagePosition }}
              />
            ) : (
              <PhotographPending vehicleTitle={vehicle.title} />
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[length:var(--text-h4)] font-semibold">{vehicle.price}</p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                {vehicle.financeEstimate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <InventoryScoreRing score={vehicle.listingScore} health={vehicle.health} />
              <InventoryHealthBadge health={vehicle.health} score={vehicle.listingScore} />
            </div>
          </div>

          <DrawerSection title="Specifications">
            <dl className="grid grid-cols-2 gap-3">
              {vehicle.specs.map((spec) => (
                <div key={spec.label}>
                  <dt className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{spec.label}</dt>
                  <dd className="text-[length:var(--text-body-sm)] font-medium">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </DrawerSection>

          <DrawerSection title="Performance Metrics">
            <dl className="grid grid-cols-2 gap-3">
              {vehicle.performanceMetrics.map((m) => (
                <div key={m.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]/60 p-3">
                  <dt className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{m.label}</dt>
                  <dd className="text-[length:var(--text-body-md)] font-semibold tabular-nums">{m.value}</dd>
                </div>
              ))}
            </dl>
          </DrawerSection>

          <DrawerSection title="Listing Quality">
            <ul className="space-y-3">
              {vehicle.listingQuality.map((item) => (
                <li key={item.factor}>
                  <div className="mb-1 flex justify-between text-[length:var(--text-body-sm)]">
                    <span>{item.factor}</span>
                    <span className="font-medium tabular-nums">{item.score}/{item.max}</span>
                  </div>
                  <Progress value={(item.score / item.max) * 100} className="h-1.5" />
                </li>
              ))}
            </ul>
          </DrawerSection>

          <DrawerSection title="Recent Activity">
            <ul className="space-y-2">
              {vehicle.recentActivity.map((a, i) => (
                <li key={i} className="flex justify-between gap-2 text-[length:var(--text-body-sm)]">
                  <span>{a.event}</span>
                  <span className="shrink-0 text-[var(--color-muted-foreground)]">{a.time}</span>
                </li>
              ))}
            </ul>
          </DrawerSection>

          <DrawerSection title="Price History">
            <ul className="space-y-2">
              {vehicle.priceHistory.map((p, i) => (
                <li key={i} className="flex justify-between text-[length:var(--text-body-sm)]">
                  <span className="text-[var(--color-muted-foreground)]">{p.date}</span>
                  <span className="font-medium">{p.price}</span>
                </li>
              ))}
            </ul>
          </DrawerSection>

          <DrawerSection title="Dealer Notes">
            <p className="text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)]">
              {vehicle.dealerNotes}
            </p>
          </DrawerSection>

          <DrawerSection title="Suggested Improvements">
            <ul className="space-y-2">
              {vehicle.suggestedImprovements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[length:var(--text-body-sm)]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </DrawerSection>
        </div>

        <div className="border-t border-[var(--color-border-subtle)] p-4">
          <p className="mb-3 text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <DrawerAction icon={Edit} label="Edit Listing" href={`/dealer/inventory/new?vehicleId=${vehicle.id}`} />
            <DrawerAction icon={ImageIcon} label="Replace Photos" />
            <DrawerAction icon={Tag} label="Adjust Price" />
            <DrawerAction icon={Megaphone} label="Promote" />
            <DrawerAction icon={TrendingUp} label="Mark Sold" />
            <DrawerAction icon={Copy} label="Duplicate" />
            <DrawerAction icon={Archive} label="Archive" />
            <DrawerAction icon={Trash2} label="Delete" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function DrawerSection({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[length:var(--text-body-sm)] font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DrawerAction({
  icon,
  label,
  href,
}: {
  readonly icon: typeof Edit;
  readonly label: string;
  readonly href?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex h-10 items-center justify-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-hover)]"
      >
        <Icon icon={icon} size="xs" tone="muted" aria-hidden />
        {label}
      </Link>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled className="h-10 justify-start gap-2">
      <Icon icon={icon} size="xs" tone="muted" aria-hidden />
      {label}
    </Button>
  );
}
