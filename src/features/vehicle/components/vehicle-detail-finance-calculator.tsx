"use client";

import { useMemo, useState } from "react";

import { FormField, Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Calculator } from "@/components/ui/icons/registry";
import { ProvenanceNote } from "@/components/ui/shared";
import { Text } from "@/components/ui/typography";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { cn } from "@/utils";

export interface VehicleDetailFinanceCalculatorProps {
  readonly priceNumeric: number;
  readonly className?: string;
}

function calculateMonthlyRepayment(
  principal: number,
  deposit: number,
  annualRate: number,
  termMonths: number,
): number {
  const loan = Math.max(principal - deposit, 0);
  if (loan <= 0 || termMonths <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return loan / termMonths;
  return (loan * monthlyRate * (1 + monthlyRate) ** termMonths) / ((1 + monthlyRate) ** termMonths - 1);
}

function formatCurrency(value: number): string {
  const rounded = Math.max(0, Math.round(value));
  const grouped = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `R ${grouped}`;
}

export function VehicleDetailFinanceCalculator({
  priceNumeric,
  className,
}: VehicleDetailFinanceCalculatorProps) {
  const [deposit, setDeposit] = useState(Math.round(priceNumeric * 0.1));
  const [interest, setInterest] = useState(11.5);
  const [term, setTerm] = useState(72);

  const monthly = useMemo(
    () => calculateMonthlyRepayment(priceNumeric, deposit, interest, term),
    [priceNumeric, deposit, interest, term],
  );

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-finance-heading">
      <h2 id="vehicle-finance-heading" className={vehiclePolish.sectionTitle}>
        What it would cost a month
      </h2>

      {/* One of the two places on this page a container still earns its keep: this is a form, and a
          form needs an edge so a buyer can see where the inputs they control begin and end. */}
      <div className={cn(vehiclePolish.glassCard, "p-6 lg:p-8")}>
        {/*
          Labelled as calculated, not measured.
          =====================================
          This is the most derived number on the platform — it comes from three inputs the buyer can
          change and a rate no bank has quoted them. Sitting unlabelled beside the asking price, which is
          a fact, it borrowed that price's authority. The provenance note costs a line and makes the
          distinction the platform is built on visible exactly where it matters most.
        */}
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Icon icon={Calculator} size="sm" tone="primary" aria-hidden />
          <Text variant="body-sm" tone="muted">
            Estimate your monthly repayment.
          </Text>
          <ProvenanceNote
            kind="calculated"
            label="Calculated from your inputs — not a quote"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField label="Deposit (R)" htmlFor="finance-deposit">
            <Input
              id="finance-deposit"
              type="number"
              min={0}
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value) || 0)}
              className="h-11"
            />
          </FormField>

          <FormField label="Interest (% p.a.)" htmlFor="finance-interest">
            <Input
              id="finance-interest"
              type="number"
              min={0}
              step={0.1}
              value={interest}
              onChange={(e) => setInterest(Number(e.target.value) || 0)}
              className="h-11"
            />
          </FormField>

          <FormField label="Term (months)" htmlFor="finance-term">
            <Select
              id="finance-term"
              value={String(term)}
              onChange={(e) => setTerm(Number(e.target.value))}
              className="h-11"
            >
              <option value="36">36 months</option>
              <option value="48">48 months</option>
              <option value="60">60 months</option>
              <option value="72">72 months</option>
              <option value="84">84 months</option>
            </Select>
          </FormField>
        </div>

        <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--color-primary)]/20 bg-[var(--color-primary-muted)]/40 p-5 text-center">
          <Text variant="caption" tone="muted" className="mb-1 block">
            Estimated monthly repayment
          </Text>
          <p className="text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)] text-[var(--color-primary-text)]">
            {formatCurrency(monthly)} / month
          </p>
        </div>

        {/*
          "Apply Now" has gone.
          ====================
          It was a full-width red bar, `disabled`, directly under the estimate — the single loudest
          object on the page, promising a finance application the platform cannot yet take. A buyer
          who wants finance now has a real path: the enquiry form carries a Finance Request mode that
          reaches the dealership, who can actually arrange it.
        */}
      </div>
    </section>
  );
}
