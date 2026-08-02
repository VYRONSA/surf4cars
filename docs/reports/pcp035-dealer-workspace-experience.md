# PCP-035 — Dealer Workspace & Vehicle Listing Experience

I signed in as a dealer before reading any code, exactly as the brief asked. The single most
important finding came in the first thirty seconds and changes how the rest of this report reads.

**Re-run the public evidence:**

```bash
node scripts/verify-marketplace-trust.mjs       # 36 checks
node scripts/verify-marketplace-experience.mjs  # 24 checks
node scripts/verify-search-experience.mjs       # 49 checks
npx tsc --noEmit && npx eslint src/ && npm run build
```

Last run: **109 public checks, 0 failures.** Build, typecheck and lint clean.

---

## 1. The headline finding

**The dealer portal was not empty. It was unreachable.**

A dealer signing in landed on a dashboard reading *"Select an active dealership to load live
dashboard data"* — above six cards each congratulating them on inventory they could not see. The
inventory screen's version of the same problem was a text input labelled **Dealership ID** with the
placeholder `dealership-…`, asking a motor dealer to type a database key. There was no selector
anywhere, so the instruction could not be followed.

The cause: the active dealership lived **only in a cookie written once during onboarding**. Nothing
ever derived it from the account. That meant:

| Situation | Result before |
|---|---|
| Sign in on a second device | Dead portal |
| Clear cookies | Dead portal |
| Accept a staff invitation | Dead portal — they never went through onboarding at all |
| Return after the cookie expired | Dead portal |

`dealership_staff_memberships.user_id` has carried the answer since SFC-102. Nothing read it.

**After the fix**, the same account on the same dashboard reports 15 vehicles, 15 published, and real
recommendations — *"9 listings are missing photo depth"*, *"13 vehicles need pricing review based on
stock ageing"*. Verified end to end with a real Supabase auth user and a real staff membership, both
deleted afterwards.

**This reframes the whole audit.** The dealer workspace is substantially built and was starved of
context. Most of what looked broken was a symptom.

---

## 2. Every issue discovered

### Fixed

| # | Where | Issue |
|---|---|---|
| 1 | Dealer layout | No dealership resolvable from the account — the blocker above |
| 2 | Dashboard header | **"Subscription: Coming Soon · Last login: Coming Soon"** — a roadmap phrase in the position of a data value, on the first line a dealer reads. Nothing records a sign-in timestamp, so the field is now omitted rather than filled |
| 3 | Inventory page metadata | **"AI-powered insights for Atlantic Auto Collective"** — one dealership's name served to all 128, and the exact name AGENTS.md warns about |
| 4 | Listing wizard | **"The fastest guided workflow in South Africa"** — an unsubstantiated claim shown to dealers |
| 5 | Dashboard inventory cards | **"No vehicles in this category — your inventory is in good shape"**, rendered six times to a dealership with no stock at all. Now distinguishes "nothing needs attention" from "you have no listings yet" |
| 6 | Wizard live preview | An empty listing was previewed with a **stock mountain-road Porsche**. A dealer with no photographs saw a beautiful listing that was not theirs — and no reason to add any |
| 7 | Wizard live preview | **"Finance ready"** and **"AI enriched"** badges on every preview regardless of content — two claims about a vehicle the dealer had not finished describing |
| 8 | Photo step | File-transfer language throughout: "Upload vehicle photos", "Browse Files", "Mobile Upload", "Camera Upload". Now "Add photographs", "Choose photographs", "Send from a phone", "Take a photograph", and the helper text explains that the first photograph is what buyers see in search |

### Found and reported, not fixed

| # | Where | Issue | Why not fixed here |
|---|---|---|---|
| 9 | Sidebar | **"Create Vehicle" appears twice** and "Inventory"/"Stock" are two names for one destination | Navigation restructure; needs a decision on the intended information architecture |
| 10 | Inventory | Seven bulk-action buttons (Bulk AI Review, Bulk Ready, Bulk Archive, Bulk Restore, Bulk Publish, Bulk Reserve, Bulk Sold) render with nothing selected | Needs a selection model before the buttons mean anything |
| 11 | Dashboard | Dealership name renders blank in the header even when a dealership is bound | Small, but I could not reproduce it reliably enough to fix confidently |
| 12 | Dashboard | **"Inventory health score 0%"** with "15 need attention" — derived, but a 0% health score on a working dealership reads as a fault in the platform | Needs a scoring review, not a code change |
| 13 | Dashboard | "AI Business Insights" and "Quick Actions" render as headings with nothing beneath them when empty | Empty-state work across several cards |
| 14 | Wizard | Step named **"Copy"** — jargon for "description" | Trivial, but step names are referenced in several places and I ran out of confidence to sweep them all |

---

## 3. Listing readiness (Phase 4)

`src/features/inventory/server/listing-readiness.ts` — built, not yet surfaced in the UI.

Seven items, weighted by impact rather than equally, because a listing with no photographs is
unsellable while one with no colour recorded is merely thinner. Equal weighting would let a dealer
reach 80% without a single photograph.

| Item | Impact | Why it matters, in the dealer's terms |
|---|---|---|
| Photographs (≥6) | High | Listings without photographs are filtered out before a buyer reads anything |
| Description | High | Your own words are the only part a competitor cannot copy |
| Price | High | Buyers filter by price first; a listing without one is invisible |
| Fuel, gearbox, body | High | All three are search filters — a gap removes the car from those results |
| Equipment | Medium | The most common question a dealer answers by telephone |
| VIN | Medium | Shown to buyers as a sign the listing describes one specific vehicle |
| Engine and colour | Low | Appear in the specification table buyers scan before enquiring |

**Service history, previous owners and warranty are deliberately not scored.** They are recorded for
**zero of the 229 published vehicles** — the columns exist and nothing populates them. Scoring them
would give every dealership an unreachable ceiling and make the score meaningless on arrival.

Every missing item is worded as the next thing worth doing, never as a fault. The brief's rule:
reward completeness, never punish incompleteness.

---

## 4. Trust review (Phase 7)

Items 2, 3, 4, 5, 6 and 7 above were all trust violations inside the dealer portal — the same class
PCP-032 removed from the public site. The public trust suite still passes 36/36.

**Remaining, and honest:** the dashboard's "coming soon" markers on view telemetry and featured-listing
expiry are accurate — those services genuinely do not exist. They are labelled as unavailable rather
than filled with numbers, which is the correct behaviour.

---

## 5. Performance (Phase 8)

No client components were added to the public site. The one new client component
(`DealerWorkspaceSetup`) exists in the dealer portal only and renders on a screen that previously
rendered nothing usable.

Public pages: **CLS 0.000**, build clean, 109 checks passing. The dealer portal is not measured for
CLS because it sits behind authentication and is not a customer-facing surface.

---

## 6. Dealer journey observations

- **Sign in → dashboard** now works from a cold browser. Before, it worked only if the browser still
  held an onboarding cookie.
- **The wizard is the best-built part of the product.** Seven steps, photographs first, a live
  preview, autosave ("Draft saved automatically"), and per-step "Why this matters" guidance. It needs
  language work, not structural work.
- **Inventory is the weakest.** It opens with a raw identifier field and seven bulk buttons above an
  empty table.
- **The dashboard is genuinely good once fed.** It surfaces missing photo depth, pricing review by
  stock ageing, and publish-ready counts — all derived from real records.

---

## 7. Remaining founder decisions

| # | Decision |
|---|---|
| 1 | **Nobody can sign in as a dealer today.** The 98 seeded staff rows have no Supabase auth accounts. Registration works; there is no way to issue credentials to an existing dealership |
| 2 | Navigation structure — "Create Vehicle" twice, "Inventory" vs "Stock" |
| 3 | Whether to capture service history, previous owners and warranty at listing time (0 of 229 today) |
| 4 | Inventory health scoring — a working dealership currently scores 0% |
| 5 | Everything carried from PCP-032/034: dealer contact details (0 of 128), verification workflow, reviews, finance partner rate, photography |

**The competitive roadmap requested at the end of the brief is a separate document:**
[docs/reports/pcp035-competitive-roadmap.md](./pcp035-competitive-roadmap.md).
