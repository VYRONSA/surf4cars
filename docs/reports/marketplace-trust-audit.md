# Marketplace trust audit — PCP-032

Every customer-facing value on SURF4CARS, checked against the database. Where a value could not be
defended, it was removed or replaced. This records what was found, where, why it was wrong, and what
replaced it.

**Re-run the evidence:**

```bash
node scripts/verify-marketplace-trust.mjs   # 36 checks — source scan + rendered pages + database
npx tsc --noEmit && npx eslint src/ && npm run build
```

Last run: **36 passed, 0 failed.** Search (43) and hero (24) suites still pass, so nothing was broken
to achieve it.

---

## The headline finding

**The platform was vouching for 128 businesses it had never assessed.** `verified: true` was a
hardcoded literal in two repositories, and there was no column in the database to verify *into*. Every
listing card, every vehicle page and every dealer profile carried the badge.

Alongside it, in the same block, every dealership was given a **4.8 star rating from 24 reviews**,
**eight years in business** and a **"responds within 15 minutes"** promise. There is no reviews table
in this schema, no trading-since date and no response-time measurement. None of it was ever true of
anybody.

**And every "Call them" button on the platform dialled `tel:+27`.** Not one of the 128 dealerships or
128 branches has a telephone number on record, so the `?? "+27"` fallback was reached by every single
listing. The buttons looked identical to working ones.

---

## Every invented fact found

| # | Fact | Where | Why it was wrong | Category | Replaced with |
|---|---|---|---|---|---|
| 1 | `verified: true` | `vehicle-platform.repository.ts:229`, `vehicle-record.mapper.ts:414` | No verification column existed. A badge nobody can revoke is not a badge | **C → new state** | Real `verification_status`; badge only when `verified` |
| 2 | `rating: 4.8` | same two files | No reviews table exists | **C** | `null` → "No reviews yet" |
| 3 | `reviewCount: 24` | same two files | No reviews table exists | **C** | `0` |
| 4 | `responseTime: "within 15 minutes"` | same two files | Nothing measures enquiry response time | **C** | `null` → line omitted |
| 5 | `yearsInBusiness: 8` | same two files | No trading-since date is captured at onboarding | **C** | `null` → line omitted |
| 6 | Trust indicator `"Dealer verified"` | both repositories | Its own description read *"Dealer account completed onboarding"* — the label claimed one thing, the description admitted another | **B** | `"Registered dealership"` / "Completed SURF4CARS onboarding" |
| 7 | `verified: onboarding_status === "completed"` | `dealer-profile.ts:251` | Conflated finishing a signup form with being checked. True for all 128 | **A** | Reads `verification_status` |
| 8 | `phone ?? "+27"`, `whatsapp ?? "+27"` | both repositories | Reached by 100% of listings. Rendered `tel:+27` and `wa.me/27` | **C** | `null`; buttons render only when a number exists |
| 9 | `fuel ?? "Petrol"` | both repositories | 3 published vehicles were given a fuel type nobody recorded | **C** | `""` → "Not specified" |
| 10 | `transmission ?? "Automatic"` | both repositories | Same 3 vehicles, invented gearbox | **C** | `""` → "Not specified" |
| 11 | `bodyType ?? "SUV"` | both repositories | Same, **and body type is a searchable filter** — a buyer could search SUV and be shown a car nobody described as one | **C** | `""` |
| 12 | `province ?? "Western Cape"` | both repositories | Puts a dealership in a place it may not be. Location is how a buyer decides whether to drive there | **C** | `""` |
| 13 | `dealershipName ?? "SURF4CARS Dealer"` | both repositories | Reads as a real trading name; attributes stock to a business that does not exist | **C** | `""` |
| 14 | `?? "SURF4CARS Dealer"` | `dealer-profile.ts:232` | Same, on the profile page | **C** | Row skipped rather than renamed |
| 15 | `price / 72 * 1.18` → "from R X p/m" | both repositories | 1.18 over six years is not an interest rate. No term, no deposit, no disclosure, no lender | **C** | `null` — see Business decisions |
| 16 | `dealer: "Atlantic Auto Collective"` | `upload-preview.ts:26` | A hardcoded third-party-sounding name in the dealer's own listing preview. **This is the exact name AGENTS.md warns about** — an earlier seed derived `atlanticauto.co.za` from it and the domain resolved to a live business | **C** | `"Your dealership"` — deliberately not a plausible name |
| 17 | `location: "Cape Town, WC"` | `upload-preview.ts:27` | Shown to every dealer regardless of where they are | **C** | `""` |
| 18 | `verified: true` | `upload-preview.ts:33` | Showed dealers a badge buyers would never see | **C** | Removed |
| 19 | `financeEstimate \|\| "Finance available"` | `upload-preview.ts:28` | A finance claim as a fallback string | **C** | `undefined` |
| 20 | `aiMatchScore` formula from photo count | `upload-preview.ts:29` | A "match score" computed from how many photos were uploaded | **C** | `0` |
| 21 | Seed `rating` / `reviewCount` / `responseTime` / `yearsInBusiness` | `vehicle-showcase.seed.ts` | Demonstration data manufacturing trust signals. AGENTS.md requires demo records to be *distinguishable*, not more convincing | **C** | Fields deleted from the seed input type entirely |
| 22 | "Every vehicle, every verified dealer" | `auth-shell.tsx:69` | Copy asserting #1 | **C** | "Every vehicle, from a registered dealership." |
| 23 | "Dealers who are verified" / "Every dealership is checked before it can publish a single vehicle" | `home-content.ts` | There was no checking step | **B** | "Registered dealerships only" / "Every seller is a licensed motor trader, not an anonymous private advert" |
| 24 | "Every listing verified, and photographed in full before it went live" | `search-headings.ts:89` | Neither half was verified by anything | **B** | "Every listing published by a registered dealership." |
| 25 | "every listing from every verified dealership, photographed and checked" | `search-headings.ts:75` | Same | **B** | "every listing from every registered dealership on SURF4CARS" |
| 26 | `"Unverified"` on the dealer profile stat | `dealer-profile-page.tsx:217` | The false branch of a badge is also a claim — a judgement we had not made | **B** | "Not yet assessed" |

**Category key:** **A** — a real database value existed and is now used. **B** — the value could be
legitimately derived or restated truthfully. **C** — no evidence existed; removed.

### What survived the audit unchanged

- **`vehiclesInStock`** — always counted from live marketplace-visible listings. The one dealer figure
  that was real.
- **Price, year, mileage, make, model** — read from the dealer's own record.
- **Structured data** — contained no `aggregateRating` or `reviewCount`. Verified.
- **`views` telemetry** on the dealer dashboard — already honestly labelled "coming soon".
- **Demonstration labelling** — `is_demonstration` is carried and surfaced on dealer profiles.

---

## The verification system

Six states, in `dealerships.verification_status`:

| State | Meaning | Badge? |
|---|---|---|
| `unknown` | Nobody has assessed this dealership. **The default, and where all 128 sit today** | No |
| `pending` | Verification requested, queued | No |
| `documents_submitted` | Documents supplied, awaiting review | No |
| `verified` | SURF4CARS checked and confirmed | **Yes** |
| `rejected` | Checked and failed | No |
| `expired` | Was verified; the check has lapsed | No |

**Only `verified` renders a badge**, and that decision lives in one function
(`describeVerificationForCustomer`) rather than in each component — the moment two components decide
for themselves what counts as verified, one of them will decide `documents_submitted` is close enough.

**Nothing was backfilled.** Preserving the badges by setting 128 rows to `verified` would recreate the
fabrication in a form that looked like data rather than a literal — harder to find and easier to trust.

The state also carries `verification_checked_at`, `verification_checked_by`, `verification_note` and
`verification_expires_at`. A verification with no author is not auditable, and an unauditable
verification is the boolean again wearing a longer name.

---

## Founder decisions

### Business — these change marketplace strategy. Flagged, not decided.

| # | Decision | What is at stake |
|---|---|---|
| B1 | **Reinstate finance figures?** | Removed because `price / 72 * 1.18` is defensible to nobody. A monthly repayment needs a rate, a term and a deposit assumption from a real finance partner, plus a disclosure line. Finance is a significant conversion driver in South African car sales, so this is a commercial decision, not an engineering one. Choosing the rate myself would have been inventing with extra steps. |
| B2 | **Build a verification workflow, or stay unverified?** | The state machine exists and is empty. Verification means somebody checks a dealer licence and a company registration against documents — an operational commitment with a cost per dealership. Until then no dealership carries a badge, which is honest but removes a trust signal buyers look for. |
| B3 | **Collect reviews?** | There is no reviews table. "No reviews yet" is truthful and will stay on every dealership indefinitely unless review collection is built. A marketplace with no ratings competes differently from one with them. |
| B4 | **Capture trading-since and response times?** | "8 years in business" and "responds within 15 minutes" are gone. Both could be real: trading-since is one field at onboarding; response time is measurable from `lead_timeline` once dealers actually respond through the platform. Both are product decisions about what to ask dealers for and what to measure. |
| B5 | **Dealer contact details** | Still 0 of 128. Unchanged from PRP-006 and now more visible: with the `+27` fallback gone, vehicle pages show no Call or WhatsApp button at all. The enquiry form is the only route, and it works. |
| B6 | **What happens to demonstration data at launch?** | 128 seeded dealerships and 330 vehicles. Their trust signals are now honest, but they are still fictional businesses with fictional stock. |

### Engineering — complete

Everything in the table above is done, verified and guarded against regression. The source scan in
`verify-marketplace-trust.mjs` fails the build if any of the twelve banned literals reappears.

---

## Two harness faults worth recording

Both failed in the reassuring direction, which is the dangerous one for an audit tool.

**The source scan silently passed for its entire first run.** It shelled out to `rg`, which is not on
the PATH here; the spawn threw, the catch returned an empty array, and twelve "no fabrication found"
passes were printed for a scan that never executed. It now throws unless grep exits 0 or 1.

**Then it failed on its own documentation.** Two attempts to filter comment lines out of the results —
first by leading `*`, then by the presence of a backtick — both reported failures for the comments
explaining the very fixes being verified. A wrapped sentence inside a block comment has no reliable
lexical marker. It now strips comments from the file before searching, which errs toward scanning more
than it should rather than less.

A third fault was in the rendered checks: the missing-specification case searched by vehicle title and
matched a *different* Volvo XC90 that did have a fuel type, reporting a fabrication that was not there.
It now navigates by derived slug to the exact row.

---

## What can now be defended

Every claim on a customer-facing page traces to a database value or a documented structural fact:

- **"Registered dealership"** — every seller completed onboarding and holds a dealer licence number on
  the row.
- **"No reviews yet"** — counted: zero.
- **"7 vehicles in stock"** — counted from live listings.
- **"Not specified"** — the column is null.
- **"Not yet assessed"** — `verification_status = 'unknown'`.
- **229 vehicles / 43 dealerships / 7 provinces** on the hero — all counted.

Nothing on the platform now claims a rating, a review, a verification, a response time, years of
trading, a finance rate or a contact number that the database cannot produce.
