import Image from "next/image";
import Link from "next/link";

import { PREMIUM_IMAGES } from "@/config/images/premium-images";
import {
  FOUNDING_BENEFITS,
  FOUNDING_FAQ,
  FOUNDING_PROGRAMME_FREE_UNTIL,
  FOUNDING_PROGRAMME_PLACES,
  FUTURE_ADVERTISING,
  FUTURE_PACKAGES,
  ILLUSTRATIVE_DASHBOARD,
  WHY_DEALERSHIPS_MOVE,
  WHY_JOIN_EARLY,
  WHY_WE_ARE_DOING_THIS,
} from "@/features/pricing/config/founding-programme";

/**
 * The Founding Dealer page.
 *
 * WHAT MAKES THIS NOT A PRICING PAGE
 * ==================================
 * The brief's instruction is a feeling — Apple keynote, not SaaS — and feelings are hard to review,
 * so it is worth writing down what was actually done differently:
 *
 *   **No pricing above the fold, and no pricing table anywhere.** The cost section is one number and
 *   one date set at display size. A four-column comparison grid with ticks is the single strongest
 *   signal that a page is selling software, and it is the shape this page most obviously could have
 *   taken.
 *
 *   **Photography carries the hero, not a gradient.** The same treatment as the buyer homepage:
 *   full-bleed frame, copy held in the quiet third, scrims sized to keep the photograph a photograph.
 *
 *   **Sections are editorial, not modular.** Numbered claims in text rather than icon-in-a-circle
 *   cards. The cards that do exist are for the programme benefits, where a list genuinely is a list.
 *
 *   **Generous type and space.** Display sizes for the two statements that matter — the invitation
 *   and the price — and body copy at reading width rather than filling the container.
 *
 * WHAT IS DELIBERATELY ABSENT
 * ===========================
 * No countdown. No "only N places remaining". No testimonials, because there are no customers to
 * quote. No platform statistics, because the honest ones are 229 vehicles and four accounts that
 * have ever signed in, and quoting those would be worse than quoting none. No logos of dealerships
 * who have not agreed to appear.
 *
 * Every future capability says it is future, in the section heading rather than in small print.
 */

const APPLY_HREF = "/contact?enquiry=founding-partner";
const DEMO_HREF = "/contact?enquiry=demo";

/* ── Shared section furniture ─────────────────────────────────────────────────────────────────── */

function SectionShell({
  id,
  eyebrow,
  title,
  lede,
  children,
  bordered = true,
}: {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly lede?: string;
  readonly children: React.ReactNode;
  readonly bordered?: boolean;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={bordered ? "border-t border-[var(--color-border-subtle)]" : undefined}
    >
      <div className="mx-auto w-full max-w-[var(--container-2xl)] px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
        <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
          {eyebrow}
        </p>
        <h2
          id={`${id}-heading`}
          className="mt-4 max-w-3xl text-[length:var(--text-h1)] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]"
        >
          {title}
        </h2>
        {lede ? (
          <p className="mt-5 max-w-2xl text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
            {lede}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

/** Numbered editorial claims — the homepage's idiom, so the two pages read as one publication. */
function NumberedClaims({ items }: { readonly items: readonly { title: string; detail: string }[] }) {
  return (
    <ol className="mt-14 grid gap-10 md:grid-cols-2 lg:gap-x-16">
      {items.map((item, index) => (
        <li key={item.title} className="flex gap-5">
          <span
            aria-hidden
            className="shrink-0 pt-1 font-mono text-[length:var(--text-body-sm)] tabular-nums text-[var(--color-muted)]"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-[length:var(--text-h4)] font-semibold text-[var(--color-foreground)]">
              {item.title}
            </h3>
            <p className="mt-2 max-w-md text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
              {item.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── The page ─────────────────────────────────────────────────────────────────────────────────── */

export function FoundingDealerPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="founding-hero-heading" className="relative isolate overflow-hidden">
        <Image
          src={PREMIUM_IMAGES.sections.dealerGrowth}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,8,8,0.95)_0%,rgba(8,8,8,0.88)_38%,rgba(8,8,8,0.45)_68%,rgba(8,8,8,0.25)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,8,8,0.55)_0%,transparent_30%,transparent_70%,rgba(8,8,8,0.6)_100%)]"
        />

        <div className="relative mx-auto w-full max-w-[var(--container-2xl)] px-6 py-32 sm:px-8 lg:px-10 lg:py-48">
          <div className="max-w-2xl">
            <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
              Founding Dealer Programme
            </p>
            <h1
              id="founding-hero-heading"
              className="mt-5 text-[length:var(--text-display-md)] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--color-foreground)]"
            >
              Become a Founding Dealer on SURF4CARS
            </h1>
            <p className="mt-6 max-w-xl text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
              Join the first {FOUNDING_PROGRAMME_PLACES} dealerships helping shape South Africa&rsquo;s
              next premium automotive marketplace.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href={APPLY_HREF}
                className="inline-flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-foreground)] px-7 py-4 text-[length:var(--text-button)] font-semibold text-[var(--color-background)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
              >
                Apply to become a Founding Partner
              </Link>
              <Link
                href={DEMO_HREF}
                className="inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] px-7 py-4 text-[length:var(--text-button)] font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 1. Why join before launch ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="why-early"
        eyebrow="Before launch"
        title="Why join before the marketplace is public"
        lede="The honest version: you are trading audience for influence, and for a head start on the work that takes longest."
        bordered={false}
      >
        <NumberedClaims items={WHY_JOIN_EARLY} />

        {/*
          The timeline is four labelled stages and nothing else. No dates on the middle two, because
          only one of them is known — putting a plausible month against "Public Launch" would be the
          fake urgency the brief prohibits, dressed as a roadmap.
        */}
        <ol className="mt-16 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-border-subtle)] sm:grid-cols-4">
          {[
            { stage: "Now", label: "Platform build", note: "Complete" },
            { stage: "Stage two", label: "Founding Dealer Programme", note: "Open" },
            { stage: "Stage three", label: "Public launch", note: "Date to be announced" },
            { stage: "Stage four", label: "Standard pricing", note: `From ${FOUNDING_PROGRAMME_FREE_UNTIL}` },
          ].map((step) => (
            <li key={step.label} className="bg-[var(--color-background)] p-6">
              <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                {step.stage}
              </p>
              <p className="mt-3 text-[length:var(--text-h5)] font-semibold text-[var(--color-foreground)]">
                {step.label}
              </p>
              <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                {step.note}
              </p>
            </li>
          ))}
        </ol>
      </SectionShell>

      {/* ── 2. The programme ───────────────────────────────────────────────────────────────────── */}
      <SectionShell
        id="programme"
        eyebrow="The programme"
        title="What a Founding Partner receives"
        lede={`Limited to ${FOUNDING_PROGRAMME_PLACES} dealerships, because personal onboarding stops being personal beyond it.`}
      >
        <ul className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-border-subtle)] sm:grid-cols-2 lg:grid-cols-3">
          {FOUNDING_BENEFITS.map((benefit) => (
            <li key={benefit.title} className="bg-[var(--color-background)] p-8">
              <h3 className="text-[length:var(--text-h5)] font-semibold text-[var(--color-foreground)]">
                {benefit.title}
              </h3>
              <p className="mt-3 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
                {benefit.detail}
              </p>
            </li>
          ))}
        </ul>
      </SectionShell>

      {/* ── 3. Cost ────────────────────────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="cost-heading"
        className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]"
      >
        <div className="mx-auto w-full max-w-[var(--container-2xl)] px-6 py-28 text-center sm:px-8 lg:px-10 lg:py-40">
          <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
            What it costs
          </p>
          <h2
            id="cost-heading"
            className="mt-6 text-[length:var(--text-display-lg)] font-semibold leading-[0.95] tracking-[-0.035em] text-[var(--color-foreground)]"
          >
            Free
          </h2>
          <p className="mt-5 text-[length:var(--text-h3)] font-medium text-[var(--color-foreground)]">
            until {FOUNDING_PROGRAMME_FREE_UNTIL}
          </p>

          <ul className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-3 text-[length:var(--text-body-lg)] text-[var(--color-muted-foreground)] sm:flex-row sm:justify-center sm:gap-10">
            <li>No setup fee</li>
            <li>No migration fee</li>
            <li>No hidden costs</li>
          </ul>

          {/*
            The sentence the brief asks for, at a size that cannot be missed, and immediately after
            the word "Free" rather than in a footnote. A dealership that only reads two lines of this
            page should read both of them.
          */}
          <p className="mx-auto mt-16 max-w-3xl text-[length:var(--text-h4)] font-medium leading-snug text-[var(--color-foreground)]">
            After the Founding Programme ends, standard subscription pricing will apply.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
            There is no lifetime discount and no permanently reduced rate. Pricing will be announced
            before the programme concludes, so no dealership is asked to decide without knowing the
            number.
          </p>
        </div>
      </section>

      {/* ── 4. Why we are doing this ───────────────────────────────────────────────────────────── */}
      <SectionShell
        id="why-us"
        eyebrow="Our side of it"
        title="Why we are running this programme"
        lede="A free programme invites a fair question. This is the answer, without the marketing."
      >
        <NumberedClaims items={WHY_WE_ARE_DOING_THIS} />
      </SectionShell>

      {/* ── 5. Future pricing ──────────────────────────────────────────────────────────────────── */}
      <SectionShell
        id="future-pricing"
        eyebrow="Future pricing"
        title="The packages that will exist after the programme"
        lede="The shape of the range, not the numbers. Final pricing will be announced before the Founding Programme concludes."
      >
        <ul className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
          {FUTURE_PACKAGES.map((pkg) => (
            <li key={pkg.name} className="bg-[var(--color-background)] p-8">
              <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Future pricing
              </p>
              <h3 className="mt-3 text-[length:var(--text-h3)] font-semibold text-[var(--color-foreground)]">
                {pkg.name}
              </h3>
              <p className="mt-3 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
                {pkg.intent}
              </p>
              {/*
                No number, and no placeholder standing in for one. Nothing in this repository holds a
                price, because none has been decided — and a plausible figure printed here would be
                read as a commitment by exactly the person it should not be.
              */}
              <p className="mt-6 text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted)]">
                Price to be announced
              </p>
            </li>
          ))}
        </ul>
      </SectionShell>

      {/* ── 6. Advertising, after launch ───────────────────────────────────────────────────────── */}
      <SectionShell
        id="advertising"
        eyebrow="Available after public launch"
        title="Premium advertising opportunities"
        lede="None of this exists yet. It is what the marketplace will offer once there is an audience worth putting a dealership in front of."
      >
        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FUTURE_ADVERTISING.map((item) => (
            <li
              key={item.title}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] p-7"
            >
              <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                After launch
              </p>
              <h3 className="mt-3 text-[length:var(--text-h5)] font-semibold text-[var(--color-foreground)]">
                {item.title}
              </h3>
              <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </SectionShell>

      {/* ── 7. Dashboard ───────────────────────────────────────────────────────────────────────── */}
      <SectionShell
        id="dashboard"
        eyebrow="Illustrative example"
        title="What the platform reports back to you"
        lede="Per vehicle and across your forecourt, so the question “why has this one not sold” has an answer."
      >
        <figure className="mt-14">
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]">
            {/*
              The label sits inside the frame, above the numbers, in the same visual weight as the
              numbers themselves. Putting "illustrative" in a caption underneath would be technically
              honest and practically invisible — the figures are what gets screenshotted.
            */}
            <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] px-7 py-4">
              <p className="text-[length:var(--text-body-sm)] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Illustrative example — not live platform data
              </p>
            </div>
            <dl className="grid gap-px bg-[var(--color-border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
              {ILLUSTRATIVE_DASHBOARD.map((metric) => (
                <div key={metric.label} className="bg-[var(--color-background)] p-7">
                  <dt className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                    {metric.label}
                  </dt>
                  <dd className="mt-2 text-[length:var(--text-h2)] font-semibold tabular-nums tracking-[-0.02em] text-[var(--color-foreground)]">
                    {metric.value}
                  </dd>
                </div>
              ))}
              <div className="bg-[var(--color-background)] p-7">
                <dt className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  Per vehicle
                </dt>
                <dd className="mt-2 text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
                  Every figure above is also reported for each listing individually.
                </dd>
              </div>
            </dl>
          </div>
          <figcaption className="mt-4 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Figures shown are an illustration of the reporting, not results achieved by any
            dealership on the platform.
          </figcaption>
        </figure>
      </SectionShell>

      {/* ── 8. Why dealerships move ────────────────────────────────────────────────────────────── */}
      <SectionShell
        id="why-move"
        eyebrow="The case"
        title="Why a dealership moves"
        lede="Not a feature list. The things that change how a forecourt actually trades."
      >
        <NumberedClaims items={WHY_DEALERSHIPS_MOVE} />
      </SectionShell>

      {/* ── 9. FAQ ─────────────────────────────────────────────────────────────────────────────── */}
      <SectionShell id="faq" eyebrow="Questions" title="Before you apply">
        <dl className="mt-14 max-w-3xl divide-y divide-[var(--color-border-subtle)] border-y border-[var(--color-border-subtle)]">
          {FOUNDING_FAQ.map((entry) => (
            <div key={entry.question} className="py-8">
              <dt className="text-[length:var(--text-h5)] font-semibold text-[var(--color-foreground)]">
                {entry.question}
              </dt>
              <dd className="mt-3 text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
                {entry.answer}
              </dd>
            </div>
          ))}
        </dl>
      </SectionShell>

      {/* ── 10. Close ──────────────────────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="closing-heading"
        className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]"
      >
        <div className="mx-auto w-full max-w-[var(--container-2xl)] px-6 py-28 text-center sm:px-8 lg:px-10 lg:py-40">
          <h2
            id="closing-heading"
            className="mx-auto max-w-4xl text-[length:var(--text-display-md)] font-semibold leading-[1] tracking-[-0.03em] text-[var(--color-foreground)]"
          >
            Become one of South Africa&rsquo;s founding dealers
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
            {FOUNDING_PROGRAMME_PLACES} places. Free until {FOUNDING_PROGRAMME_FREE_UNTIL}. Leave
            whenever you like.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={APPLY_HREF}
              className="inline-flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-foreground)] px-9 py-4 text-[length:var(--text-button)] font-semibold text-[var(--color-background)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
            >
              Apply now
            </Link>
            <Link
              href={DEMO_HREF}
              className="inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] px-9 py-4 text-[length:var(--text-button)] font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
