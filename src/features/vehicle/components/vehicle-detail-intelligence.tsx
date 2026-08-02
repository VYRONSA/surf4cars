import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { AlertTriangle, ArrowRight, BadgeCheck, Check, Info, X } from "@/components/ui/icons/registry";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type {
  BuyingEvidence,
  IntelligenceSignal,
  PriceIntelligence,
  SimilarVehicle,

} from "@/features/vehicle/server/vehicle-intelligence";
import { cn } from "@/utils";

/**
 * The intelligence sections.
 *
 * Each renders only when it has something true to say. A section that appears on every listing with
 * a shrug in it — "no data available" — is worse than one that is simply not there: it trains a
 * buyer to scroll past the place the useful information lives.
 *
 * The sample size travels with every claim. "Below similar vehicles" on its own is a sales line;
 * "R38 000 below the median of eleven comparable listings" is a fact a buyer can go and check, and
 * checking is the point.
 */

const rand = (value: number) => `R ${Math.abs(Math.round(value)).toLocaleString("en-ZA").replace(/,/g, " ")}`;
const km = (value: number) => `${Math.abs(Math.round(value)).toLocaleString("en-ZA").replace(/,/g, " ")} km`;

const CONFIDENCE_COPY = {
  high: "measured against a large enough set to be reliable",
  moderate: "a moderate sample — treat it as a guide",
  low: "a small sample, so this is an observation rather than a market position",
} as const;

/* ── Price ───────────────────────────────────────────────────────────────────────────────────── */

export function VehicleDetailPriceIntelligence({
  price,
  priceNumeric,
  className,
}: {
  readonly price: PriceIntelligence | null;
  readonly priceNumeric: number;
  readonly className?: string;
}) {
  if (!price) return null;

  const headline =
    price.standing === "below"
      ? "Priced below similar vehicles"
      : price.standing === "above"
        ? "Priced above similar vehicles"
        : "Priced around the middle of similar vehicles";

  const tone =
    price.standing === "below" ? "positive" : price.standing === "above" ? "caution" : "neutral";

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="price-intelligence-heading">
      <h2 id="price-intelligence-heading" className={vehiclePolish.sectionTitle}>
        What this price means
      </h2>

      <p
        className={cn(
          "mt-1 text-[length:var(--text-h5)] font-semibold",
          tone === "positive" && "text-[var(--color-success)]",
          tone === "caution" && "text-[var(--color-warning)]",
          tone === "neutral" && "text-[var(--color-foreground)]",
        )}
      >
        {headline}
      </p>

      <p className="mt-2 max-w-2xl text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
        {price.standing === "around"
          ? `Within 12% of the median asking price for ${price.basis.label}.`
          : `${rand(price.differenceFromMedian)} ${price.standing === "below" ? "below" : "above"} the median asking price for ${price.basis.label}.`}
      </p>

      {/*
        The distribution, as a bar rather than a chart library.
        =====================================================
        Three numbers and a marker say everything a percentile means, cost no JavaScript, and cannot
        mislead by choosing an axis. A charting dependency for this would be the most expensive way
        to be less clear.
      */}
      <div className="mt-6 max-w-2xl">
        <div className="relative h-1.5 rounded-full bg-[var(--color-surface-sunken)]">
          <span
            aria-hidden
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-background)]"
            style={{ left: `${Math.min(100, Math.max(0, price.percentile))}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[length:var(--text-caption)] text-[var(--color-muted)]">
          <span>Lowest {rand(price.lowestPrice)}</span>
          <span className="text-[var(--color-muted-foreground)]">Median {rand(price.medianPrice)}</span>
          <span>Highest {rand(price.highestPrice)}</span>
        </div>
        <p className="mt-4 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          This vehicle at <span className="font-medium text-[var(--color-foreground)]">{rand(priceNumeric)}</span> is
          priced above {price.percentile}% of them.
        </p>
      </div>

      {/*
        Confidence, stated rather than implied.
        ======================================
        The brief asks for it explicitly and it is the line that keeps the section honest: the same
        sentence structure over four cars and over forty would be a claim of precision the second one
        earns and the first one does not.
      */}
      <p className="mt-5 flex items-start gap-2 text-[length:var(--text-caption)] leading-relaxed text-[var(--color-muted)]">
        <Icon icon={Info} aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Compared against <span className="text-[var(--color-muted-foreground)]">{price.basis.count}</span>{" "}
          vehicles of the same model within three years of it, currently
          published on SURF4CARS — {CONFIDENCE_COPY[price.basis.confidence]}. Asking prices only; nothing here is a valuation.
        </span>
      </p>
    </section>
  );
}

/* ── Signals ─────────────────────────────────────────────────────────────────────────────────── */

export function VehicleDetailSignals({
  signals,
  className,
}: {
  readonly signals: readonly IntelligenceSignal[];
  readonly className?: string;
}) {
  if (signals.length === 0) return null;

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="signals-heading">
      <h2 id="signals-heading" className={vehiclePolish.sectionTitle}>
        What stands out
      </h2>

      <ul className="mt-1 space-y-4">
        {signals.map((signal) => (
          <li key={signal.id} className="flex gap-3.5">
            <Icon
              icon={signal.tone === "caution" ? AlertTriangle : signal.tone === "positive" ? BadgeCheck : Info}
              aria-hidden
              className={cn(
                "mt-0.5 size-[1.125rem] shrink-0",
                signal.tone === "positive" && "text-[var(--color-success)]",
                signal.tone === "caution" && "text-[var(--color-warning)]",
                signal.tone === "neutral" && "text-[var(--color-muted)]",
              )}
            />
            <div className="min-w-0">
              <p className="text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)]">
                {signal.label}
              </p>
              <p className="mt-0.5 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
                {signal.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Evidence ────────────────────────────────────────────────────────────────────────────────── */

export function VehicleDetailEvidence({
  evidence,
  className,
}: {
  readonly evidence: readonly BuyingEvidence[];
  readonly className?: string;
}) {
  if (evidence.length === 0) return null;
  const complete = evidence.filter((item) => item.present).length;

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="evidence-heading">
      <h2 id="evidence-heading" className={vehiclePolish.sectionTitle}>
        What we can confirm
      </h2>
      <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {complete} of {evidence.length}{" "}
        recorded. These describe the listing, not the vehicle&rsquo;s condition
        — SURF4CARS has not inspected it.
      </p>

      <ul className="mt-5 space-y-3">
        {evidence.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <Icon
              icon={item.present ? Check : X}
              aria-hidden
              className={cn(
                "mt-0.5 size-4 shrink-0",
                item.present ? "text-[var(--color-success)]" : "text-[var(--color-muted)]",
              )}
            />
            <p className="text-[length:var(--text-body-sm)] leading-relaxed">
              <span className={item.present ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"}>
                {item.label}
              </span>
              <span className="text-[var(--color-muted)]"> — {item.detail}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Similar vehicles ────────────────────────────────────────────────────────────────────────── */

export function VehicleDetailSimilarIntelligence({
  similar,
  basis,
  className,
}: {
  readonly similar: readonly SimilarVehicle[];
  readonly basis: string | null;
  readonly className?: string;
}) {
  if (similar.length === 0 || !basis) return null;

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="similar-intelligence-heading">
      <h2 id="similar-intelligence-heading" className={vehiclePolish.sectionTitle}>
        How it compares
      </h2>
      {/* Never show unexplained cars — the brief's rule, and the difference between a comparison and
          a carousel. */}
      <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        The closest {basis} listings on SURF4CARS by price, year and mileage. Differences from this
        vehicle are shown on each.
      </p>

      <ul className="mt-6 space-y-3">
        {similar.map((vehicle) => (
          <li key={vehicle.id}>
            <Link
              href={`/vehicle/${vehicle.slug}`}
              className="motion-card group flex gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] p-3 hover:border-[var(--color-border)] hover:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              <span className="relative size-20 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)]">
                {vehicle.imageSrc && (
                  <Image src={vehicle.imageSrc} alt="" fill sizes="80px" className="object-cover" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)]">
                  {vehicle.title}
                </span>
                <span className="mt-1 block text-[length:var(--text-body-sm)] font-semibold tabular-nums text-[var(--color-foreground)]">
                  {vehicle.price}
                </span>
                {/* The three deltas the buyer is actually trading off, signed so the direction is
                    unmistakable without reading the numbers. */}
                <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                  <Delta value={vehicle.priceDelta} format={rand} cheaperIsBetter />
                  <Delta value={vehicle.yearDelta} format={(v) => `${Math.abs(v)} year${Math.abs(v) === 1 ? "" : "s"}`} newerIsBetter />
                  <Delta value={vehicle.mileageDelta} format={km} cheaperIsBetter />
                </span>
              </span>

              <Icon
                icon={ArrowRight}
                aria-hidden
                className="mt-1 size-4 shrink-0 self-start text-[var(--color-muted)] transition-transform motion-hover group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A signed difference, worded rather than arrowed — "R12 000 cheaper" needs no legend. */
function Delta({
  value,
  format,
  cheaperIsBetter,
  newerIsBetter,
}: {
  readonly value: number;
  readonly format: (value: number) => string;
  readonly cheaperIsBetter?: boolean;
  readonly newerIsBetter?: boolean;
}) {
  if (value === 0) return <span>same</span>;
  const word = newerIsBetter ? (value > 0 ? "newer" : "older") : value < 0 ? "less" : "more";
  const good = cheaperIsBetter ? value < 0 : value > 0;
  return (
    <span className={good ? "text-[var(--color-success)]" : undefined}>
      {format(value)} {word}
    </span>
  );
}
