# PCP-034 — Premium Vehicle Intelligence Experience

Building the intelligence found two defects that were more valuable than the intelligence itself.
Both are recorded first.

**Re-run the evidence:**

```bash
node scripts/verify-marketplace-trust.mjs       # 36 checks — nothing invented came back
node scripts/verify-marketplace-experience.mjs  # 24 checks — consistency + full journey
node scripts/verify-search-experience.mjs       # 49 checks — every control, history, results
node scripts/verify-hero-premium.mjs            # 30 checks — the hero still holds
npx tsc --noEmit && npx eslint src/ && npm run build
```

Last run: **139 checks, 0 failures.** CLS **0.000** on all four pages. Build, typecheck and lint clean.

---

## 1. Two defects found while building

### 34 published vehicles led to a different car

`buildVehicleSlug` truncated the id discriminator to eight characters. **191 of the 229 published
vehicles carry ids shaped `s1-veh-0141`** — every one of them truncates to `s1-veh-0`. Measured:
**29 colliding slugs, 34 vehicles shadowed.**

A shadowed listing is not merely unreachable. The detail route resolves by slug and takes the first
match, so a buyer clicking the fourth Hilux was shown the first one — a different price, a different
odometer, a different car — with nothing on screen indicating anything had gone wrong.

The function's own docstring used `s1-veh-0141` → `s1-veh-0` to *illustrate* the truncation without
following the consequence. Twelve characters removes every collision. Verified: 24 cards, 24 unique
destinations, eight checked cards all landing on the vehicle they advertised.

Found because React warned about duplicate keys in the new similar-vehicles list.

### My own peer set produced a confident falsehood

The first build of the price panel let statistics fall back to "every Corolla Cross listed" when the
year window was thin. On a 2026 measured against 2018–2024 listings it rendered:

> **Priced above similar vehicles** — R315 000 above the median. Priced above 100% of them.

True arithmetic, false insight. Price falls with age: that car is not overpriced, it is eight years
newer. Statistics now come **only** from the same model within three years, or are not made at all.
The looser set survives for the similar-vehicles list, where every difference is stated on the row —
a number in a sentence carries no such qualifier.

`market-insight.ts` had the same flaw and now carries the same window; the two render on one page and
must never disagree.

---

## 2. What was built

| Phase | Section | Renders when |
|---|---|---|
| 1 | **What stands out** | Any signal is true: lower/higher mileage than peers, lowest price, newest, lowest mileage, one of only N listed, added this week |
| 2 | **What this price means** | ≥4 same-model peers within ±3 years. Shows position, median, range, percentile, sample size and stated confidence |
| 3 | **How it compares** | Three closest listings by price, year and mileage, each with signed deltas and a stated basis |
| 4 | **What we can confirm** | Photography, equipment list, dealer description, VIN, full specification — each present or explicitly absent |
| 5 | **What they carry** (dealer) | ≥4 listings: typical asking price and range, typical model year, marques stocked, added in 30 days |
| 6 | **Narrow search** | ≤4 results with filters active: names every filter and the measured count without each one |

**Every section is absent when it has nothing defensible to say.** A section that appears on every
listing with a shrug in it trains a buyer to scroll past the place the useful information lives.

### Sample output

Signals, on a 2024 BMW X5 with 13 peers:

> **Higher mileage than similar vehicles** — 41 000 km against a median of 28 500 km across 8
> comparable listings.

Price, same vehicle:

> **Priced around the middle of similar vehicles.** Within 12% of the median asking price for 2024
> BMW X5. Lowest R1 249 900 · Median R1 249 900 · Highest R1 329 900. This vehicle at R1 299 900 is
> priced above 62% of them. *Compared against 13 vehicles of the same model within three years of it
> — measured against a large enough set to be reliable. Asking prices only; nothing here is a
> valuation.*

Narrow search, `?make=BMW&transmission=Manual`:

> **Nothing matches all of these at once** — BMW · Manual transmission
> Remove one to see more: Without BMW — 54 vehicles · Without Manual transmission — 21 vehicles

---

## 3. Where the line was drawn

| Wording used | Wording rejected | Why |
|---|---|---|
| "VIN recorded — on file, not independently decoded" | "VIN decoded" | Nothing decodes it |
| "Registration number on file" | "Registration verified" | Nobody has checked a registry |
| *(response time omitted entirely)* | "Response time: unknown" | An unknown implies a metric exists |
| "Asking prices only; nothing here is a valuation" | "Market value" | There is no valuation model |
| "Higher mileage than similar vehicles" | *(suppressing it)* | A module that only flatters is advertising |

Higher mileage renders in the caution tone rather than being hidden. The buyer is the one taking the
risk, and it is exactly the fact they are on the page to find.

---

## 4. Trust audit (Phase 8)

Re-ran in full: **36 checks, 0 failures.** No hardcoded rating, review count, response time, years in
business, verification flag, contact fallback, specification default or finance figure has returned.
Everything added in this sprint is computed at request time from published stock.

---

## 5. Performance (Phase 9)

**CLS 0.000 on all four pages.** No client components were added — every intelligence section is a
server component, and the price distribution is a `<div>` with a positioned marker rather than a
charting dependency.

### A pre-existing slowness, measured and attributed

`/search` takes **6.0–6.8 seconds** to complete its document locally. I bisected it against a stash
of this sprint's work: **the baseline is identical**, so nothing here caused it.

The cause is round-trip latency to the hosted database from a development machine:

| Query | Time |
|---|---|
| `select id from dealerships limit 1` | **360ms** |
| dealerships (128 rows) | 261ms |
| leads (300 rows) | 427ms |
| media (1 834 rows) | 438ms |
| vehicles (330 rows) | 609ms |

TTFB is 34–70ms; the document body is what takes six seconds. A trivial query costing 360ms means
every table read is dominated by the network, and the dataset load performs eight of them with
paging on several.

**This is unlikely to look the same in production**, where Vercel and Supabase would be co-located
and each round trip would be single-digit milliseconds. But co-location would *mask* the shape rather
than fix it: `dealerships`, `branches` and `leads` are read **in full on every request** regardless of
which vehicles are being shown. That is the specific improvement to make, and it is a caching and
query-scoping change rather than anything this brief asked for — so it is reported, not attempted.

Production LCP with the dev server stopped: home 492ms, dealer 2 040ms, vehicle 3 352ms, search
7 004ms — all CLS 0.

---

## 6. Customer journey observations

Walked homepage → marketplace → vehicle → dealer → enquiry → confirmation: **four clicks**, no dead
controls, no console errors.

- **Before:** the vehicle page answered "what is it" — a specification table, a price, a gallery.
- **After:** it answers "should I" first. Intelligence sits above the specification, because a buyer
  who has already decided reads the table and a buyer who has not is the one the page has to serve.
- **On a thin listing** — few peers, no equipment, no photographs — every intelligence section
  disappears and the page collapses to the old order. That is the intended behaviour and it is what
  most Corolla Cross listings currently do, because the marketplace does not hold four of them within
  three years of each other.

---

## 7. Remaining founder decisions

| # | Decision |
|---|---|
| 1 | **Service history, previous owners and warranty are recorded for 0 of 229 vehicles.** The columns and their provenance fields exist; nothing populates them. These are the highest-value additions to buying confidence and they are a dealer-onboarding question |
| 2 | **`/search` server timing** — scope the dealership, branch and lead reads, or cache the corpus. Measured above; not attempted |
| 3 | Photography — 57 of 229 published vehicles have no photographs at all |
| 4 | Reinstate finance figures with a real partner rate and disclosure |
| 5 | Build a verification workflow, or leave every dealership unassessed |
| 6 | Collect reviews, or leave "No reviews yet" indefinitely |
| 7 | Dealer contact details — still 0 of 128 |
| 8 | "229+" vs "229" on the hero; brand name SURF4CARS vs SURF FOR CARS |

---

## 8. Screenshots

`screenshots/pcp034/after-vehicle-intelligence.png`, `after-search-intelligence.png`,
`after-dealer-intelligence.png`.
