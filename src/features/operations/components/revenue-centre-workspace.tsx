import Link from "next/link";

import { REVENUE_CENTRE_SECTIONS } from "@/features/operations/config/revenue-centre-sections";
import type { RevenueCentreWorkspaceData } from "@/features/operations/types/revenue-centre.types";

interface RevenueCentreWorkspaceProps {
  readonly data: RevenueCentreWorkspaceData;
  readonly generatedLabel: string;
}

function cardTone(mode: "live" | "coming-soon"): string {
  return mode === "live"
    ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100"
    : "border-amber-300/40 bg-amber-500/10 text-amber-100";
}

export function RevenueCentreWorkspace({ data, generatedLabel }: RevenueCentreWorkspaceProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/15 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Revenue Centre</p>
            <h1 className="text-2xl font-semibold text-white">Executive Revenue Intelligence Layer</h1>
            <p className="mt-1 text-sm text-white/70">
              Subscription and marketplace revenue intelligence now, with billing and commission ledgers surfaced as Coming Soon until live integration.
            </p>
          </div>
          <p className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/70">Updated {generatedLabel}</p>
        </div>
      </section>

      <section className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
        {REVENUE_CENTRE_SECTIONS.map((section) => {
          const active = data.sectionId === section.id;
          return (
            <Link
              key={section.id}
              href={section.href}
              className={`rounded-2xl border px-3 py-3 transition ${
                active
                  ? "border-cyan-300/50 bg-cyan-500/20 text-cyan-100"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/30 hover:text-white"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.14em]">{section.label}</p>
              <p className="mt-1 text-xs text-white/60">{section.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.summaryCards.map((card) => (
          <article key={card.id} className={`rounded-2xl border p-4 ${cardTone(card.availability)}`}>
            <p className="text-xs uppercase tracking-[0.16em]">{card.label}</p>
            <p className="mt-2 text-xl font-semibold">{card.value}</p>
            <p className="mt-2 text-xs text-white/75">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-black/20 p-4 xl:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Revenue Streams</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead className="text-xs uppercase tracking-[0.16em] text-white/50">
                <tr>
                  <th className="px-2 py-2">Stream</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Value</th>
                  <th className="px-2 py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueStreams.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 align-top">
                    <td className="px-2 py-2">{row.stream}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          row.status === "live"
                            ? "border-emerald-300/50 bg-emerald-500/20 text-emerald-100"
                            : "border-amber-300/50 bg-amber-500/20 text-amber-100"
                        }`}
                      >
                        {row.status === "live" ? "Live" : "Coming Soon"}
                      </span>
                    </td>
                    <td className="px-2 py-2">{row.value}</td>
                    <td className="px-2 py-2 text-xs text-white/60">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Source Readiness</h2>
          <div className="mt-3 space-y-2">
            {data.sourceReadiness.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-white">{item.label}</p>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-white/60">{item.mode.replace("-", " ")}</span>
                </div>
                <p className="mt-1 text-xs text-white/65">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Subscriptions</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead className="text-xs uppercase tracking-[0.16em] text-white/50">
                <tr>
                  <th className="px-2 py-2">Package</th>
                  <th className="px-2 py-2">Dealers</th>
                  <th className="px-2 py-2">Trials</th>
                  <th className="px-2 py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.subscriptions.map((row) => (
                  <tr key={row.packageId} className="border-t border-white/10">
                    <td className="px-2 py-2">{row.packageLabel}</td>
                    <td className="px-2 py-2">{row.dealerCount}</td>
                    <td className="px-2 py-2">{row.trials}</td>
                    <td className="px-2 py-2">{row.revenueByPackage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Reports</h2>
          <div className="mt-3 space-y-2">
            {data.reports.map((report) => (
              <div key={report.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-white">{report.name}</p>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-white/60">{report.status}</span>
                </div>
                <p className="mt-1 text-xs text-white/65">{report.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
