# 09 — Prioritised Rollout Plan

How the Experience Bible gets applied to the product, in what order, and at what cost.

---

## 1. Audit finding: the brief's screen list does not match the codebase

Before sequencing, the inventory was verified against `src/app`. **42 routes exist.** Several
screens named in the sprint brief's waves do not exist as routes, and some have no UI code at all.

This changes the plan fundamentally: **parts of Waves 2 and 3 are greenfield builds, not restyles.**
Estimating them as "apply the design system" would understate the effort by roughly an order of
magnitude.

| Brief calls for | Reality | Consequence |
| --- | --- | --- |
| Wave 1 — **Dealer Profile** | `/dealer/profile` is the dealer's own **authenticated editor**. There is **no public dealer storefront** route | **New build.** A public dealer page is a significant SEO and trust asset that does not exist |
| Wave 2 — **Leads** | No route. `src/features/crm` and `src/features/enquiries` contain **server code and an empty component scaffold** — no UI | **New build** |
| Wave 2 — **Analytics** | No route. `src/features/analytics` is an **empty scaffold** (`index.ts` only) | **New build** |
| Wave 2 — **Media** | No route. `src/features/media` is an **empty scaffold** | **New build** |
| Wave 3 — **AI Recommendations / Reports** | No dedicated routes | **New build** |
| Buyer — **Saved, Compare, Alerts, Recently Viewed** | Not implemented (confirmed out of scope in PCP-001G) | **New build** |
| Wave 3 — **Market Intelligence** | `src/features/market-intelligence` has a real page; `/dealer/market` exists | Restyle |
| Wave 3 — **SURF Intelligence** | `/buyer/intelligence` exists | Restyle |

**Recommendation:** split every wave into **Restyle** (apply the Bible to something that exists) and
**Build** (new surface). They have different risk profiles, different owners, and should not be
estimated together.

Effort below is in **engineer-days**, assuming the existing component library is used and no new
primitives are needed. Ranges reflect restyle-vs-build uncertainty.

---

## 2. Blocking dependency

> **PCP-001K2 is not complete.** PCP-001F stands at 10/23 and PCP-001G at 9/22, with a confirmed
> unfixed defect: the PostgREST 1000-row cap truncating `inventory_vehicle_media` to 1000 of 2761
> rows, plus at least one further undiagnosed defect in the marketplace read path.

**Every vehicle-dependent screen is blocked**: Marketplace Search, Vehicle Detail, Homepage featured
sections, Dealer Inventory, and any AI surface that reads vehicle data.

Redesigning a screen whose data layer is truncated means styling a broken surface and verifying it
twice. **K2 is Wave 0 and must land first.**

---

## 3. Wave 0 — Unblock (prerequisite)

| Item | Effort | Notes |
| --- | --- | --- |
| Paginate `loadDataset()` past the 1000-row PostgREST cap | 0.5–1 | Confirmed defect, mechanical fix |
| Diagnose remaining marketplace read-path failures | 2–4 | Unknown until the cap is fixed — the cap may be masking them |
| Re-run F and G verification matrices to green | 1 | |
| Province + free-text search pushdown | 2–3 | Currently falls back to in-memory |
| Production-build performance benchmark | 0.5 | Never run |

**Total: 6–10 days.** **Risk: the undiagnosed defect could be larger than estimated.**

**Recommended governance addition, run in parallel (2–3 days):** the hardcoded-colour and
banned-terms lints from [07](07-brand-governance.md), plus visual regression against
`/design-system`. Building these *before* the restyle waves means 40+ screens are checked
automatically instead of by review. This is the highest-leverage 3 days in the whole plan.

---

## 4. Wave 1 — Customer-facing

**Why first:** it is where the brand is judged, where SEO lives, and where the premium positioning
either lands or does not. Highest visibility, highest revenue sensitivity.

| Screen | Type | Effort | Notes |
| --- | --- | --- | --- |
| **Art direction: hero + lifestyle photography** | **Non-code** | — | **Start immediately, in parallel with Wave 0.** Long lead time; blocks the homepage |
| Homepage | Restyle | 5–8 | 11 sections; hero blocked on photography. A known layout defect ("SURF Intelligence / AI-ASSISTED VEHICLE DISCOVERY" wraps and overlaps) must be fixed here |
| Marketplace Search | Restyle | 5–8 | Filter rail, chips, card grid, zero-result state. **Blocked by K2** |
| Vehicle Detail | Restyle | 8–12 | Largest single surface; 12 specified sections. **Blocked by K2** |
| Public Dealer Profile | **Build** | 8–12 | Does not exist. Significant SEO and trust asset |
| Auth (7 routes) | Restyle | 3–4 | Sign-in, sign-up ×3, verify, forgot, reset. Low complexity, high polish value |

**Total: 29–44 days** (of which ~8–12 is new build).

**Dependencies:** K2 · photography · public dealer profile needs a public dealer data contract.
**Risks:** photography is the critical path and is not an engineering task — if it slips, the
homepage cannot land. Vehicle Detail is the most complex surface in the product and is also the most
data-dependent. **Mitigation: commission photography now.**

---

## 5. Wave 2 — Dealer Platform

**Why second:** dealers are the paying customers and the supply side. Poor dealer tooling degrades
listing quality, which degrades Wave 1. But the cockpit is internal-facing, so brand risk is lower.

| Screen | Type | Effort | Notes |
| --- | --- | --- | --- |
| Dealer Dashboard | Restyle | 4–6 | Reorder by urgency, not metric count |
| My Stock (inventory) | Restyle | 5–7 | Cockpit table, bulk actions, ageing flags. **Blocked by K2** |
| Publish flow (`inventory/new`) | Restyle | 6–9 | Add live `VehicleCard` preview — the highest-value single feature in this wave. **Blocked by K2** |
| **Enquiries (Leads)** | **Build** | 10–15 | No UI exists. Server code only |
| **Performance (Analytics)** | **Build** | 10–15 | Empty scaffold |
| **Media management** | **Build** | 8–12 | Empty scaffold. Tablet-first |
| Branches / Team / Settings / Profile | Restyle | 4–6 | Four routes, low complexity |

**Total: 47–70 days** (of which ~28–42 is new build).

**Dependencies:** K2 for stock and publish · Enquiries needs the lead pipeline certified · Media
needs the storage buckets and the 1000-row fix.
**Risks:** three greenfield builds in one wave. **Mitigation: sequence Enquiries first** — it is the
dealer's revenue surface and the clearest gap. Consider deferring Media to Wave 3.

---

## 6. Wave 3 — Intelligence

**Why third:** it is the differentiator, but it depends on trustworthy data from Waves 0–2. Shipping
AI on truncated or uncertified data is the fastest way to destroy the feature's credibility
permanently — and that damage is not recoverable.

| Screen | Type | Effort | Notes |
| --- | --- | --- | --- |
| SURF Intelligence (`/buyer/intelligence`) | Restyle | 6–9 | De-chatbot: rich cards, cited reasoning |
| Market Intelligence (`/dealer/market`) | Restyle | 5–7 | Real page exists |
| AI Recommendations | **Build** | 8–12 | Embedded across surfaces, not a page |
| Reports | **Build** | 8–12 | Export, scheduling |
| Buyer Saved / Compare / Alerts | **Build** | 12–18 | Confirmed not implemented. **Strongest retention mechanic available** |

**Total: 39–58 days** (of which ~28–42 is new build).

**Risks:** highest trust risk in the plan. One generic or hallucinated insight costs the feature its
authority for that user permanently. **Mitigation: ship the reasoning and provenance UI before
broadening coverage; when confidence is low, show less.**

---

## 7. Wave 4 — Administration

**Why last:** internal users, smallest audience, lowest brand risk — but the largest route count
(18 operations routes plus settings).

| Screen | Type | Effort | Notes |
| --- | --- | --- | --- |
| Operations dashboard + centre routes (~18) | Restyle | 12–18 | Many share `[section]` patterns — restyle the shared layout once |
| Settings (dealer + operations) | Restyle | 3–4 | |
| Admin / dealer management | Restyle | 4–6 | |
| User management / team / workers | Restyle | 3–5 | |
| Audit logs | Restyle | 2–3 | |

**Total: 24–36 days.**

**Opportunity:** these routes are highly repetitive. Investing 3–5 days in a shared operations page
template first will cut the rest roughly in half. **Do the template before the screens.**

---

## 8. Recommended order

```
NOW ──────────────────────────────────────────────────────────────────
  ├─ Commission photography + art direction        (non-code, long lead)
  ├─ Wave 0: close PCP-001K2                       6–10 d   BLOCKING
  └─ Governance lints + visual regression          2–3  d   (parallel)

THEN ─────────────────────────────────────────────────────────────────
  1. Wave 1 — Customer-facing                     29–44 d
       Auth first (unblocked, builds momentum)
       Homepage when photography lands
       Search → Vehicle Detail once K2 is green
       Public Dealer Profile last (new build)

  2. Wave 2 — Dealer Platform                     47–70 d
       Dashboard + My Stock + Publish (restyle)
       Enquiries (build — highest dealer value)
       Performance, then Media

  3. Wave 3 — Intelligence                        39–58 d
       Restyle existing surfaces first
       Buyer Saved/Compare/Alerts (retention)
       Recommendations and Reports last

  4. Wave 4 — Administration                      24–36 d
       Shared operations template FIRST, then screens
```

**Programme total: ~145–221 engineer-days**, of which roughly **65–95 days is new build**, not
restyling. That distinction is the single most important number in this document.

---

## 9. Cross-cutting risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Photography does not materialise** | Homepage and brand positioning cannot land. The Bible's central premise — "photography is the product" — fails | Commission now. It is the longest lead item and is not an engineering task |
| **K2 defect is larger than estimated** | Waves 1–2 slip | Fix the 1000-row cap first; it may be masking the other failures |
| **Greenfield builds estimated as restyles** | Roughly 65–95 days of unplanned work | Already separated above. Re-estimate at wave start |
| **Governance not automated** | 40+ screens drift; the Bible becomes decoration | Build the lints in Wave 0 |
| **Design system drift during a long programme** | Late screens diverge from early ones | Visual regression on `/design-system`; the Bible is versioned with the code |
| **Dealer disruption** | Dealers work in this daily; a surprise redesign costs goodwill | Communicate before Wave 2; keep vocabulary stable ([05](05-writing-style.md)) |

---

## 10. Definition of done, per screen

A screen has adopted the Bible when:

- [ ] Zero hardcoded colours; all tokens
- [ ] Correct density tier applied
- [ ] Exactly one primary action in view
- [ ] Empty, loading (skeleton), error and partial states all designed
- [ ] Copy passes the [05](05-writing-style.md) vocabulary table
- [ ] Photography follows [03](03-photography.md); zero layout shift
- [ ] Motion via `.motion-*` only; verified under `prefers-reduced-motion`
- [ ] Keyboard navigable with visible focus throughout
- [ ] Contrast audit passes
- [ ] Reviewed against the [07](07-brand-governance.md) checklist
- [ ] No new component duplicating an existing primitive
