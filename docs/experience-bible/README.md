# The SURF4CARS Experience Bible

**Status:** Authoritative. Version 1.0 — PCP-002C.
**Applies to:** every screen, component, string and interaction in the platform.

This document defines how SURF4CARS looks, behaves, communicates and feels. It is not a mood board
and not a rewrite of Design System V2 — it is the layer *above* the design system that says **why**
and **when**, where the design system says **what**.

| Layer | Lives in | Answers |
| --- | --- | --- |
| Tokens | `src/styles/tokens/*.css` | What is the value? |
| Components | `src/components/ui/*` | What is the building block? |
| **Experience Bible** | **`docs/experience-bible/`** | **When, why, and how does it feel?** |

If this document and the code disagree, **this document describes the intent and the code is the
defect** — with one exception: token *values* are owned by `colors.css` and verified by
`scripts/audit-design-contrast.mjs`. Never restate a hex value here; reference the token name.

---

## Contents

| # | Guide | Covers |
| --- | --- | --- |
| — | This file | Brand personality, design philosophy, emotional design |
| 01 | [Visual Language](01-visual-language.md) | Dark theme, red, glass, depth, materials, spacing |
| 02 | [Colour & Typography](02-colour-and-typography.md) | Every colour's job; every type role |
| 03 | [Photography Direction](03-photography.md) | Vehicle, dealer, lifestyle, hero, South African identity |
| 04 | [Interaction & Motion](04-interaction-and-motion.md) | Hover, lift, transitions, loading, timing, sound |
| 05 | [Writing Style](05-writing-style.md) | Voice, vocabulary, buttons, errors, empty states |
| 06 | [Component Usage](06-component-usage.md) | When to use each primitive — and when not to |
| 07 | [Brand Governance](07-brand-governance.md) | Hard rules, enforcement, review checklist |
| 08 | [Experience Specifications](08-experience-specifications.md) | Homepage, marketplace, VDP, dealer, buyer, AI, mobile, tablet |
| 09 | [Rollout Plan](09-rollout-plan.md) | Four waves, effort, dependencies, risk, order |

---

## 1. Product vision

SURF4CARS is **a premium automotive technology platform**.

It is not a classifieds board, not a dealer management system, and not generic SaaS. The distinction
is not cosmetic — it changes what we optimise for.

| | Classifieds (AutoTrader, Cars.co.za) | Generic SaaS | **SURF4CARS** |
| --- | --- | --- | --- |
| Optimises for | Listing volume | Feature surface | **Decision confidence** |
| Hero element | Advertising | Dashboard chrome | **The vehicle** |
| Success metric | Impressions | Seats | **Right buyer, right car, faster** |
| Feels like | A noticeboard | A tool | **A showroom with an engine behind it** |

We are competing on **certainty**, not inventory count. Anyone can list 10 000 cars. We tell a buyer
*which one* and *why*, and we tell a dealer *what their market is doing* — and both experiences are
delivered with the composure of a marque, not the urgency of a marketplace.

### The seven feelings

Every screen must carry at least three of these, and must never contradict any of them.

1. **Luxury** — restraint, space, quality of materials.
2. **Technology** — precision, real data, no decoration masquerading as insight.
3. **Performance** — nothing feels slow; motion is decisive.
4. **Confidence** — the interface never hedges or apologises.
5. **Trust** — provenance is visible; claims are sourced.
6. **Speed** — the shortest path to the next decision.
7. **Intelligence** — the product knows something the user does not, and says so plainly.

---

## 2. Brand personality

### If SURF4CARS were a vehicle

A **current-generation performance saloon in matte graphite** — the kind that does not announce
itself in a car park but is unmistakable once moving. Think restrained bodywork, a single red brake
caliper visible through the wheel, and an interior where every control falls exactly where the hand
expects it.

Not a supercar: supercars are loud, impractical and about the owner. Not an SUV: too safe, too
common. This is the car chosen by someone who already knows what they want and does not need the
purchase to speak on their behalf.

**What this dictates:** dark bodywork (`--color-background`, `--color-surface`), one accent used
sparingly (`--color-primary`), and controls that are obvious without being labelled twice.

### If SURF4CARS were a dealership

An **appointment-only showroom in Kyalami or Somerset West.** You are greeted by name. Nobody
follows you around the floor. The person who eventually approaches knows the service history of the
car you are standing next to without looking it up, and tells you the one thing wrong with it before
you ask.

There are no banners. No "SALE" stickers on windscreens. No pressure. The price is on the car and it
is the real price.

**What this dictates:** no interstitials, no countdown timers, no artificial scarcity, no dark
patterns. Disclosure before persuasion. The AI behaves like that salesperson — informed, brief, and
willing to talk you *out* of a car.

### If SURF4CARS were a showroom

**Polished dark concrete floor. Matte charcoal walls. Vehicles lit individually from above** so each
one sits in its own pool of light with darkness between. Glass mezzanine overhead where the finance
and handover offices sit — visible, but not in the way.

The only colour in the room is on the cars themselves and a single red line inlaid in the floor that
guides you from the entrance to the vehicle you came to see.

**What this dictates — and this is the single most important sentence in this document:**

> **The interface is the unlit room. The vehicle photography is the lit object. Everything we design
> must recede so the cars advance.**

Every dark surface, every restrained border, every muted label exists to make a photograph of a car
look expensive. When a design decision is ambiguous, ask which option makes the photography look
better.

### Voice, in one line

**A specialist who respects your time.** Knows more than you. Never condescends. Never oversells.
Tells you the flaw before you find it.

---

## 3. Design philosophy

Ten principles, ordered. When two conflict, the lower number wins.

### 1. Every screen must sell vehicles

Including dealer screens. A dealer's dashboard sells *their* vehicles by showing them what is not
moving and why. If a screen cannot draw a line to a vehicle transaction, justify its existence or
remove it.

### 2. Photography is the product

We are a visual business. Photography gets the largest area, the best position, and the first byte
loaded. Chrome shrinks before an image does. A vehicle card is a photograph with text attached — not
a text block with a thumbnail.

### 3. Every interaction must build trust

Show provenance. Cite the source of a price estimate. Say when data is stale. Never present a
computed number in the same visual weight as a verified fact — see the AI Confidence rules in
[08](08-experience-specifications.md).

### 4. Search is the hero

Search is not a utility in the header; on the homepage it *is* the hero. The fastest path from
landing to a filtered result set is the primary product metric.

### 5. Data supports decisions, it does not decorate

No chart without a decision attached. If a user cannot act differently because of a number, that
number is noise. Kill vanity metrics.

### 6. Luxury comes through restraint

Luxury is achieved by *removing*. One accent colour. One weight of emphasis per view. Generous
space. If a screen looks unfinished because it is calm, it is probably correct.

### 7. One primary action per view

Exactly one `Button variant="primary"` in the user's field of view. Red is a scarce resource. If two
actions compete, one of them is secondary — decide which.

### 8. Confidence over cheer

No exclamation marks. No emoji in product UI. No "Oops!". State facts. A calm error is more
reassuring than an apologetic one.

### 9. Density is earned, not default

Buyer surfaces are spacious. Dealer surfaces are dense — because a dealer works in the product for
six hours a day and scanning speed beats comfort. Never apply buyer spacing to a dealer table, or
dealer density to a marketplace grid.

### 10. Never ship a state you have not designed

Empty, loading, error, partial, offline, and too-much-data are states, not edge cases. A screen is
not complete until all six are specified.

---

## 4. Emotional design

For each critical workflow: what the user should feel, what creates that feeling, and the failure
mode we are designing against.

### Buyer — searching

**Feel:** *in control, and slightly spoiled for choice.*

The moment results appear the buyer should feel the platform has more than enough, and that
narrowing is easy and reversible. Filters must apply instantly and be trivially removable.

**Creates it:** result count updating live; active filters shown as removable chips; photography
loading top-down without layout shift.
**Failure mode:** anxiety. Caused by slow filters, zero-result dead ends, and results that jump as
images load.

### Buyer — finding *the one*

**Feel:** *certainty.*

This is the emotional peak of the entire product. The vehicle detail page must answer every question
a buyer would ask a salesperson, in the order they would ask it, before they have to ask.

**Creates it:** full-bleed gallery; price with market context, not price alone; the flaw disclosed;
a named, verified dealer.
**Failure mode:** suspicion. Caused by a price with no context, missing photographs, or an anonymous
seller.

### Dealer — publishing a vehicle

**Feel:** *professional pride, and momentum.*

Publishing is the dealer's creative act. It should feel like preparing a car for the floor, not
filling in a government form. Progress must always be visible and never lost.

**Creates it:** a live preview of the buyer-facing card as they type; autosave; "Preparing your
listing…" rather than "Processing"; a completeness score that rewards rather than scolds.
**Failure mode:** drudgery, then abandonment. Caused by long ungrouped forms, lost work, and
validation that fires before the user has finished typing.

### Dealer — receiving a lead

**Feel:** *urgency without panic.*

A lead is money with a shelf life. It should arrive with enough context to act immediately.

**Creates it:** the buyer's name, the vehicle, and how long the lead has been waiting — with the
elapsed timer as the emphasis. One-tap call. Response-time visible against the dealer's own average.
**Failure mode:** alarm fatigue. Caused by every notification looking equally urgent. Reserve
`--color-danger` for genuinely time-critical leads only.

### Dealer — making a sale

**Feel:** *earned satisfaction. Brief.*

Acknowledge it, credit it, and move on. A single confident confirmation, the vehicle moving to
*Sold*, and the metric that changed. Then get out of the way.

**Creates it:** one restrained success moment; updated month-to-date figure.
**Failure mode:** patronising. Caused by confetti, exclamation marks, or a modal requiring dismissal.

### Buyer or dealer — receiving an AI recommendation

**Feel:** *"it noticed something I hadn't."*

The recommendation must be specific enough that it could not apply to anyone else. Generic advice
destroys the product's credibility permanently.

**Creates it:** reasoning shown alongside the conclusion; real figures from the user's own data;
confidence stated honestly; the ability to dismiss and have that respected.
**Failure mode:** distrust — which is unrecoverable. One hallucinated or obviously generic insight
costs the feature its authority for that user forever. **When confidence is low, say less.**

### Buyer — browsing without intent

**Feel:** *pleasure.*

Not every session is a purchase. Casual browsing should feel like walking a showroom floor after
hours. Large photography, minimal chrome, no pressure to convert.

**Creates it:** editorial layout, generous imagery, low information density.
**Failure mode:** harassment. Caused by newsletter pop-ups, chat bubbles that open themselves, and
sticky finance banners.

---

## 5. How to use this document

**Designing a new screen:** read [08](08-experience-specifications.md) for the surface, then
[06](06-component-usage.md) before choosing a component, then [05](05-writing-style.md) for strings.

**Reviewing a pull request:** use the checklist in [07](07-brand-governance.md).

**Adding a colour, font size or effect:** you almost certainly should not. See
[07](07-brand-governance.md) §Hard rules.

**Sequencing work:** [09](09-rollout-plan.md).
