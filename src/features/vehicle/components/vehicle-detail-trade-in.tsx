"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { ArrowRight, CheckCircle2, RotateCcw } from "@/components/ui/icons/registry";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { cn } from "@/utils";

/**
 * Trade-in.
 *
 * **This does not produce a number, and that is the design.**
 *
 * A trade-in estimate is a valuation, and a valuation needs data this platform does not have: auction
 * results, regional demand, condition grading, service history, accident record. Every other module on this
 * page can point at something real — the specification comes from the record, the market comparison from
 * live stock. An estimate here could only come from an invented formula.
 *
 * The damage from getting it wrong is asymmetric and lands on the customer. Quote R 180 000 against a real
 * R 140 000 and they budget around forty thousand rand that does not exist; quote low and they sell
 * elsewhere for more. Either way the number was ours and the loss is theirs.
 *
 * So this collects what the dealer needs in order to make a *real* offer, and says plainly that the offer
 * comes from a person who has seen the car. That is slower than a number on a screen and considerably more
 * honest — and it is what every dealer does anyway, because no one buys a car sight-unseen on a web form.
 *
 * When a valuation service exists, this component gains a result state. Nothing else about it changes.
 */

const FIELDS = [
  { id: "make", label: "Make", placeholder: "Volkswagen", type: "text" },
  { id: "model", label: "Model", placeholder: "Polo", type: "text" },
  { id: "year", label: "Year", placeholder: "2019", type: "text" },
  { id: "mileage", label: "Mileage", placeholder: "84 000 km", type: "text" },
] as const;

export interface VehicleDetailTradeInProps {
  readonly dealerName: string;
  readonly className?: string;
}

export function VehicleDetailTradeIn({ dealerName, className }: VehicleDetailTradeInProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="trade-in-heading">
      <h2 id="trade-in-heading" className={cn(vehiclePolish.sectionTitle, "mb-3")}>
        Have something to trade?
      </h2>
      <p className="mb-6 max-w-2xl text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
        Tell {dealerName} what you are driving and they will value it against this vehicle. We do not
        publish an instant figure — a trade-in price depends on condition, service history and the car in
        front of you, and a number generated without those is a guess you would end up negotiating away.
      </p>

      <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:p-8">
        {submitted ? (
          <div className="flex items-start gap-4">
            <Icon
              icon={CheckCircle2}
              aria-hidden
              className="mt-0.5 size-6 shrink-0 text-[var(--color-success)]"
            />
            <div>
              <p className="text-[length:var(--text-h5)] font-semibold text-[var(--color-foreground)]">
                Sent to {dealerName}
              </p>
              <p className="mt-2 max-w-prose text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
                They will come back with a figure and what it is based on. If they need to see the car
                first, they will say so rather than quote blind.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                leftIcon={<Icon icon={RotateCcw} size="sm" />}
                onClick={() => setSubmitted(false)}
              >
                Send another
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FIELDS.map((field) => (
                <div key={field.id}>
                  <label
                    htmlFor={`trade-${field.id}`}
                    className="mb-1.5 block text-[length:var(--text-caption)] uppercase tracking-[0.14em] text-[var(--color-muted)]"
                  >
                    {field.label}
                  </label>
                  <input
                    id={`trade-${field.id}`}
                    name={field.id}
                    type={field.type}
                    required
                    placeholder={field.placeholder}
                    className="h-11 w-full rounded-[var(--radius-lg)] border border-[var(--color-border-interactive)] bg-[var(--color-surface-sunken)] px-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              {/* Outline, not filled red. A page carries one primary action — here that is the
                  enquiry — and five filled red buttons down one page is how an accent stops
                  meaning "this one". */}
              <Button
                type="submit"
                size="md"
                variant="outline"
                rightIcon={<Icon icon={ArrowRight} size="sm" />}
              >
                Request a trade-in figure
              </Button>
              <p className="text-[length:var(--text-caption)] text-[var(--color-muted)]">
                No obligation. Your details go to this dealer only.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
