"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Bell, RotateCcw, Search, User } from "@/components/ui/icons/registry";
import { useNotifications } from "@/components/shell/notifications";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import type { DashboardDealerProfile } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

export interface DashboardHeaderProps {
  readonly dealer: DashboardDealerProfile;
  readonly onRefresh: () => void;
  readonly isRefreshing: boolean;
}

export function DashboardHeader({ dealer, onRefresh, isRefreshing }: DashboardHeaderProps) {
  const { showToast } = useNotifications();

  const showComingSoon = (label: string) => {
    showToast({
      title: `${label} Coming Soon`,
      description: `${label} will connect to the shared SURF shell when the live service is ready.`,
      variant: "info",
    });
  };

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
          {/*
            "Subscription: Coming Soon · Last login: Coming Soon" used to render here.
            ========================================================================
            A product roadmap phrase in the position of a data value, on the first line a dealer reads
            every morning. Nothing tracks last sign-in, and a dealership without a subscription package
            recorded has no subscription to report — so both are omitted rather than filled.
          */}
          {(dealer.subscription || dealer.lastLogin) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              {dealer.subscription && (
                <span>
                  Subscription:{" "}
                  <strong className="text-[var(--color-foreground)]">{dealer.subscription}</strong>
                </span>
              )}
              {dealer.lastLogin && <span>Last login: {dealer.lastLogin}</span>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-[200px] sm:min-w-[240px]">
            <div className="mb-1.5 flex items-center justify-between text-[length:var(--text-caption)]">
              <span className="text-[var(--color-muted-foreground)]">Profile completion</span>
              <span className="font-medium text-[var(--color-primary-text)]">{dealer.profileCompletion}%</span>
            </div>
            <Progress value={dealer.profileCompletion} className="h-2" aria-label="Profile completion" />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden h-10 gap-2 md:inline-flex"
              onClick={() => showComingSoon("Dashboard Search")}
            >
              <Icon icon={Search} size="sm" tone="muted" aria-hidden />
              Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2"
              onClick={onRefresh}
              loading={isRefreshing}
            >
              {!isRefreshing && <Icon icon={RotateCcw} size="sm" tone="muted" aria-hidden />}
              Refresh
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => showComingSoon("Notifications")} aria-label="Notifications coming soon">
              <Icon icon={Bell} size="sm" tone="muted" />
            </Button>
            <Link href="/dealer/profile" className="inline-flex">
              <Button variant="outline" size="sm" className="h-10 gap-2">
              <Icon icon={User} size="sm" tone="muted" aria-hidden />
              Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
