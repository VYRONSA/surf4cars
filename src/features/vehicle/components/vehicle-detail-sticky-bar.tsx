"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/icons";
import { MessageCircle, Phone } from "@/components/ui/icons/registry";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { cn } from "@/utils";

export interface VehicleDetailStickyBarProps {
  readonly price: string;
  readonly monthlyRepayment: string;
  readonly dealerPhone: string;
  readonly dealerWhatsapp: string;
}

export function VehicleDetailStickyBar({ price, monthlyRepayment, dealerPhone, dealerWhatsapp }: VehicleDetailStickyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /*
    Mobile only.
    ===========
    On desktop the purchase rail travels down the page carrying the same price and the same two ways
    to reach the dealer, so this bar was a second copy of it pinned across the bottom of the same
    screen. Below `lg` there is no rail — the layout is one column — which is the case this was
    written for.
  */
  return (
    <div
      className={cn(
        vehiclePolish.stickyBar,
        "translate-y-full transition-transform duration-300 motion-nav lg:hidden",
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
          <a href={`tel:${dealerPhone}`} className="hidden h-11 items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 text-[length:var(--text-body-sm)] font-medium sm:inline-flex">
            <Icon icon={Phone} size="sm" aria-hidden />
            Call
          </a>
          <a href={`https://wa.me/${dealerWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 text-[length:var(--text-body-sm)] font-medium">
            <Icon icon={MessageCircle} size="sm" aria-hidden />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
