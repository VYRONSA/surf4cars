import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { ArrowRight, MessageSquare } from "@/components/ui/icons/registry";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import type { DashboardLead } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

const STATUS_LABELS: Record<DashboardLead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  "follow-up": "Follow-up",
};

const STATUS_VARIANT = {
  new: "primary",
  contacted: "info",
  qualified: "success",
  "follow-up": "warning",
} as const;

export interface DashboardRecentLeadsProps {
  readonly leads: readonly DashboardLead[];
}

export function DashboardRecentLeads({ leads }: DashboardRecentLeadsProps) {
  return (
    <section className={dashboardPolish.section} aria-labelledby="dashboard-leads-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="dashboard-leads-heading" className={dashboardPolish.sectionTitle}>
          Recent Leads
        </h2>
        <Button variant="ghost" size="sm" disabled>
          View all
          <Icon icon={ArrowRight} size="xs" aria-hidden />
        </Button>
      </div>

      <div className={cn(dashboardPolish.panel, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
                <th className="px-4 py-3 font-medium lg:px-5">Buyer</th>
                <th className="px-4 py-3 font-medium lg:px-5">Vehicle</th>
                <th className="px-4 py-3 font-medium lg:px-5">Date</th>
                <th className="px-4 py-3 font-medium lg:px-5">Status</th>
                <th className="px-4 py-3 font-medium lg:px-5">Next Action</th>
                <th className="px-4 py-3 font-medium lg:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[var(--color-border-subtle)]/60 last:border-0 motion-card hover:bg-[var(--color-hover)]/30"
                >
                  <td className="px-4 py-3.5 text-[length:var(--text-body-sm)] font-medium lg:px-5">
                    {lead.buyer}
                  </td>
                  <td className="px-4 py-3.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] lg:px-5">
                    {lead.vehicle}
                  </td>
                  <td className="px-4 py-3.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] lg:px-5">
                    {lead.date}
                  </td>
                  <td className="px-4 py-3.5 lg:px-5">
                    <Badge variant={STATUS_VARIANT[lead.status]}>
                      {STATUS_LABELS[lead.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-[length:var(--text-body-sm)] lg:px-5">
                    {lead.nextAction}
                  </td>
                  <td className="px-4 py-3.5 lg:px-5">
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="icon-sm" disabled aria-label={`Quick reply to ${lead.buyer}`}>
                        <Icon icon={MessageSquare} size="xs" tone="muted" />
                      </Button>
                      <Button variant="outline" size="sm" disabled className="h-8">
                        Open
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
