"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { MessageCircle, Phone } from "@/components/ui/icons/registry";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { cn } from "@/utils";

export interface VehicleDetailStickyBarProps {
  readonly price: string;
  readonly monthlyRepayment: string;
}

export function VehicleDetailStickyBar({ price, monthlyRepayment }: VehicleDetailStickyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        vehiclePolish.stickyBar,
        "translate-y-full transition-transform duration-300 motion-nav",
        visible && "translate-y-0",
      )}
      role="region"
      aria-label="Quick actions"
    >
      <div className="mx-auto flex max-w-[var(--container-2xl)] items-center gap-3 px-4 py-3 lg:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[length:var(--text-body-md)] font-semibold">{price}</p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
            {monthlyRepayment} / month
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="md" disabled className="hidden h-11 sm:inline-flex">
            <Icon icon={Phone} size="sm" aria-hidden />
            Call
          </Button>
          <Button variant="outline" size="md" disabled className="h-11">
            <Icon icon={MessageCircle} size="sm" aria-hidden />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          <Button variant="primary" size="md" disabled className="h-11">
            Reserve
          </Button>
        </div>
      </div>
    </div>
  );
}
