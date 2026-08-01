# PCP-033 — Premium Marketplace Experience

The brief said to look at the pages as a customer before looking at the code. Doing that found two
things that were not design problems at all, and they are the two most important entries in this
report.

**Re-run the evidence:**

```bash
node scripts/verify-marketplace-experience.mjs  # 24 checks — cross-page consistency + full journey
node scripts/verify-search-experience.mjs       # 49 checks — every control, history, results
node scripts/verify-marketplace-trust.mjs       # 36 checks — nothing invented came back
node scripts/verify-hero-premium.mjs            # 30 checks — the hero still holds
npx tsc --noEmit && npx eslint src/ && npm run build
```

Last run: **139 checks, 0 failures.** CLS **0.000** on all four pages. Production LCP good on all
four. Contrast 35/35 AA.

---

## 1. Before and after

| | |
|---|---|
| Marketplace | `screenshots/pcp033/before-marketplace.png` → `after-marketplace.png` |
| Vehicle | `before-vehicle.png` → `after-vehicle.png` |
| Dealer | `before-dealer.png` → `after-dealer.png` |
| Card close-up | `card-zoom.png` |
| Pagination | `pagination-after.png` |

---

## 2. The two findings that matter

### A vehicle priced at R445 000 per month

The vehicle page's largest number read:

> **R 445 000** / month

PCP-032 made `monthlyRepayment` nullable and removed the invented `price / 72 * 1.18` behind it. The
showcase kept its `/ month` suffix, so the price and the unit collapsed together on **every vehicle
in the marketplace**.

A dangling unit is the worst residue a removed value can leave. It does not look absent — it looks
like an instalment forty times the real one, sitting directly beneath the asking price. Fixed by
rendering the line only when there is a figure; the purchase rail and sticky bar were already
guarded, which is why it survived.

### 205 of 229 vehicles could not be reached by clicking

Every control in `PublicPagination` — Previous, Next, and each page number — was **hardcoded
`disabled`**, with no handler and no href behind any of them. It was also mounted as
`<PublicPagination showInfo={false} />` with no props at all, so `totalPages` fell to its default of
1 and the component did not know there was anywhere to go.

The only way through the catalogue was to type `?page=2` into the address bar.

This is the most expensive kind of dead UI: not a button that looks broken, but one that looks
finished. A buyer reaching the bottom of page one concludes the marketplace holds 24 cars.

Rebuilt as links rather than buttons, so a page deep in a filtered set can be shared, bookmarked,
opened in a new tab and reached with the browser's own Back. Verified: *"Showing 1–24 of 229"*, ten
pages, Next lands on 25–48.

---

## 3. Every issue discovered and fixed

| # | Page | Issue | Fix |
|---|---|---|---|
| 1 | Vehicle | Price rendered as "R 445 000 / month" | Line renders only when a figure exists |
| 2 | Marketplace | Pagination entirely non-functional; 205 vehicles unreachable | Rebuilt as URL-carrying links with real page counts |
| 3 | Dealer | One stock showroom photograph used as the hero of all 128 profiles, read as their premises | Dealership's own cover when it exists; a drawn header when it does not |
| 4 | Dealer | "Counted by SURF4CARS" under "Not yet assessed" and under a registration year — neither is a count | New `recorded` provenance kind |
| 5 | Dealer | The drawn header left a 300px empty gradient above the name | Sized to sit behind the identity block, not above it |
| 6 | Marketplace | Page opened on a 40px heading over flat graphite — a visitor knew instantly they had left the homepage | Eyebrow, display-scale statement, red hairline rule: the hero's own devices |
| 7 | Marketplace | Card title and price the same weight at nearly the same size — no first beat | Title to medium, price up a step |
| 8 | Marketplace | Town set in `--color-muted`, barely legible | Lifted to `--color-muted-foreground` with a pin |
| 9 | Marketplace | Card text evenly spaced, so name, price, spec and town read as four equal items | Grouped: name+price one thought, specification a second |
| 10 | Marketplace | Dealer badge sat on bare photography; low contrast over bright forecourts | Short scrim under the badge |
| 11 | All | Content column started at 108px on homepage and dealer, 100px on marketplace and vehicle | One column: `px-6 sm:px-8 lg:px-10` everywhere |
| 12 | Marketplace | Production LCP 2 548ms, just over the "good" threshold | First row of card images promoted to `priority` — now 2 380ms |

### Harness faults fixed along the way

Three, all of which reported problems that did not exist:

- The consistency check compared the left edge of **containers**, and different pages nest them
  differently — it reported a misalignment a ruler on the screen could not find. It now measures
  where the *text* starts, which is what a visitor perceives as the margin.
- The heading-weight check treated the hero's uppercase 700 as an inconsistency with the interior
  pages' sentence-case 600. Those are two roles, not a fault; it now asserts that page titles agree
  with each other and that the system has one small set of weights.
- The Forward-navigation check compared rendered titles against a snapshot taken earlier and failed
  intermittently while React was still swapping the grid. It now asserts that the results obey the
  forward entry's filter — stronger, and immune to the frame it is read on.

---

## 4. Cross-page consistency — measured

| Property | Result |
|---|---|
| Masthead height | 81px on all four pages |
| Content column left edge | **108px on all four** (was 100/108) |
| Page background | Identical |
| Body typeface | Inter on all four; headings use the same family |
| Page-title weight | 600 on marketplace, vehicle and dealer. The hero is 700 — uppercase display type, a different role |
| Corner radii | Five values across the whole site: 6, 8, 12, 16, 9999px |
| Transition durations | Two: 0.12s and 0.2s |

---

## 5. Customer journey

**Homepage → Marketplace → Vehicle → Dealer → Enquiry → Confirmation in four clicks**, walked
automatically end to end with a real enquiry submitted and then deleted.

| Step | Clicks | Observation |
|---|---|---|
| Homepage → Marketplace | 1 | Nav link; results render immediately |
| Marketplace → Vehicle | 2 | Card is the whole click target |
| Vehicle → Dealer | 3 | Dealer link present in the purchase rail and the dealership section |
| Enquiry → Confirmation | 4 | Reference returned; wording correctly does **not** claim the dealer was notified, because no email provider is configured |

**Hesitations found and removed:** the price reading as a monthly payment (§2), the catalogue
appearing to end at 24 vehicles (§2), and the marketplace feeling like a different product on arrival
(§3 item 6).

**No dead or disabled control** remains on any of the four pages — the three that existed were the
pagination buttons.

---

## 6. Performance

Measured against a **production build**, because dev-server figures are compile-bound and not
representative — the marketplace read 4 276ms in dev and 2 380ms in production.

| Page | LCP | CLS |
|---|---|---|
| Homepage | 168ms | **0.000** |
| Marketplace | 2 380ms | **0.000** |
| Vehicle | 1 320ms | **0.000** |
| Dealer | 1 616ms | **0.000** |

No JavaScript was added to any critical path. The only performance change is a fetch-priority hint on
the three cards above the fold.

---

## 7. What I deliberately did not change

- **The borderless card.** It looks like a missing container until you read why it is not one: the
  border was drawn around real photography, and twenty-four of them stacked into visible column rules
  down the page. That decision was made deliberately in an earlier programme and it is right.
- **The finance calculator** on the vehicle page. It computes a real amortisation from inputs the
  *user* sets — a calculator, not a claim, and materially different from the invented estimate PCP-032
  removed.
- **The homepage hero**, per the brief.

---

## 8. Remaining founder decisions

Unchanged from PCP-032, and none of them engineering:

| # | Decision |
|---|---|
| 1 | Photography — the marketplace's weakest surface is still the images themselves: showroom shots with bystanders, container yards, inconsistent crops. No layout work fixes this |
| 2 | Dealer cover photography — every profile now has a drawn header because not one dealership has supplied a photograph of its premises |
| 3 | "229+" vs "229" on the hero |
| 4 | Reinstate finance figures with a real partner rate and disclosure |
| 5 | Build a verification workflow, or leave every dealership unassessed |
| 6 | Collect reviews, or leave "No reviews yet" indefinitely |
| 7 | Dealer contact details — still 0 of 128 |
| 8 | Brand name: SURF4CARS or SURF FOR CARS |

**On item 1:** with the layout, typography and spacing now consistent across all four pages, the
photography is the single largest remaining difference between this and a world-class automotive
marketplace. The hero looks like a premium brand because it has one commissioned-quality frame. The
catalogue does not, because it has 229 reference images.
