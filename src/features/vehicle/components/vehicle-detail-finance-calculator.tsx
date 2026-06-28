"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Calculator } from "@/components/ui/icons/registry";
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
  return `R ${Math.round(value).toLocaleString("en-ZA")}`;
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
        Finance Calculator
      </h2>

      <div className={cn(vehiclePolish.glassPanel, "p-6 lg:p-8")}>
        <div className="mb-6 flex items-center gap-2">
          <Icon icon={Calculator} size="sm" tone="primary" aria-hidden />
          <Text variant="body-sm" tone="muted">
            Estimate your monthly repayment — indicative only.
          </Text>
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
          <p className="text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)] text-[var(--color-primary)]">
            {formatCurrency(monthly)} / month
          </p>
        </div>

        <Button variant="primary" size="lg" disabled className="mt-5 h-12 w-full">
          Apply Now
        </Button>
      </div>
    </section>
  );
}
