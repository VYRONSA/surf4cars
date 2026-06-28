"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Bell, Search, User } from "@/components/ui/icons/registry";
import { Input } from "@/components/ui/form";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import type { DashboardDealerProfile } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

export interface DashboardHeaderProps {
  readonly dealer: DashboardDealerProfile;
}

export function DashboardHeader({ dealer }: DashboardHeaderProps) {
  return (
    <header className={cn(dashboardPolish.glassCard, "p-5 lg:p-6")}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
            Dealer Command Centre
          </p>
          <h1 className="mt-1 text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h2)]">
            {dealer.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            <span>
              Subscription:{" "}
              <strong className="text-[var(--color-foreground)]">{dealer.subscription}</strong>
            </span>
            <span>Last login: {dealer.lastLogin}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-[200px] sm:min-w-[240px]">
            <div className="mb-1.5 flex items-center justify-between text-[length:var(--text-caption)]">
              <span className="text-[var(--color-muted-foreground)]">Profile completion</span>
              <span className="font-medium text-[var(--color-primary)]">{dealer.profileCompletion}%</span>
            </div>
            <Progress value={dealer.profileCompletion} className="h-2" aria-label="Profile completion" />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden min-w-[220px] md:block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Icon icon={Search} size="sm" tone="muted" aria-hidden />
              </span>
              <Input
                placeholder="Quick search inventory, leads…"
                disabled
                className="h-10 pl-9"
                aria-label="Quick search"
              />
            </div>
            <Button variant="ghost" size="icon-sm" disabled aria-label="Notifications">
              <Icon icon={Bell} size="sm" tone="muted" />
            </Button>
            <Button variant="outline" size="sm" disabled className="h-10 gap-2">
              <Icon icon={User} size="sm" tone="muted" aria-hidden />
              Profile
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
