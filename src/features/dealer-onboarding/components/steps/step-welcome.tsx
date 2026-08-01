"use client";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

/**
 * The first screen a dealership sees.
 *
 * WHAT WAS HERE
 * =============
 * A red "DEALER ONBOARDING" overline — the same words already printed in the header eight pixels
 * above it — over "Welcome to the future of dealership growth.", then "SURF FOR CARS helps you market
 * your vehicles, grow your business, and reach more buyers — with technology built for ambitious
 * dealerships."
 *
 * That is the voice this programme spent four sprints removing from the buyer homepage, still in
 * place on the page that asks a real business for its registration number. It says nothing a
 * dealership can check: every marketplace claims to grow your business, so the claim carries no
 * information and reads as marketing rather than as an offer.
 *
 * WHAT REPLACED IT
 * ================
 * What actually happens next, and what it costs them. A dealership deciding whether to spend the
 * next ten minutes on a seven-step form wants to know how long it takes and what it needs to hand
 * over — not to be told the future is arriving. Concrete beats aspirational when somebody is about
 * to do work.
 */
export function StepWelcome() {
  const { nextStep } = useOnboarding();

  /* Top-aligned, not vertically centred. Centring a short panel in a tall flex column pushed it to
     roughly the middle of a 1000px viewport, leaving ~300px of empty page above the first thing a
     dealership reads. */
  return (
    <div className="flex flex-1 flex-col">
      <div className={cn(onboardingStyles.panel, "animate-slide-up-sfc")}>
        <h1 className="max-w-2xl text-balance text-[length:var(--text-h1)] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--color-foreground)]">
          Let&rsquo;s get your stock in front of buyers.
        </h1>

        <p className="mt-5 max-w-xl text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
          Seven steps, about ten minutes. You will need your company registration details and one
          branch address. Everything saves as you go, so you can stop and come back.
        </p>

        <button
          type="button"
          onClick={nextStep}
          className={cn(onboardingStyles.primaryButton, "mt-10 w-full sm:w-auto")}
        >
          Start
          <Icon icon={ArrowRight} size="sm" aria-hidden />
        </button>
      </div>
    </div>
  );
}
