# PCP-036 — Dealer Migration Platform

**Re-run the evidence:**

```bash
node scripts/verify-dealer-migration.mjs   # 38 checks: mapping, parsing, validation, duplicates, scale, architecture
npx tsc --noEmit && npx eslint src/ && npm run build
node scripts/verify-marketplace-trust.mjs  # 36 checks — the public site is unchanged
```

Last run: **38 passed, 0 failed.** Public suite 36/36. Build, typecheck, lint clean.

**What was built:** the engine — adapters, mapping, validation, duplicate detection, readiness,
planning, and the batch/row ledger. **What was not:** the wizard UI, ZIP/folder media ingestion, and
the PDF export. Those are specified below and honestly marked as not done, because a half-built
wizard is worse than a designed one.

---

## 1. Inventory audit (Phase 1)

Every table a migration touches, and who owns writes to it. Counts are exact, read from PostgREST
with the service key on 2026-08-02 — not recalled.

| Table | Rows | Role in a migration |
|---|---|---|
| `inventory_vehicles` | 330 | The listing. 36 columns; an import supplies 15 of them directly, plus `branch_id` |
| `inventory_vehicle_media` | 1 834 | Photographs. `is_primary`, `sort_order`, `provenance`, `quality_status` |
| `inventory_vehicle_documents` | 110 | Not touched by import |
| `inventory_vehicle_price_history` | 150 | Written on price change, not on create |
| `inventory_vehicle_history` | 286 | Event log per vehicle |
| `inventory_vehicle_audit` | 26 | Actor-attributed actions |
| `dealerships` | 128 | Owner. `verification_status` is `unknown` on all 128 |
| `dealership_branches` | 128 | Branch resolution for the `branch` column |
| `equipment_items` | 37 | **Canonical equipment with `synonyms`** — the import vocabulary |
| `vehicle_equipment` | 0 | Join table, empty. Import is its first writer |
| `leads` | 300 | Enquiry routing, keyed on `dealership_id` + `vehicle_id` |
| `editorial_placements` | 0 | Curation. Imports never write here |
| `vehicle_import_batches` | *new* | One import run |
| `vehicle_import_rows` | *new* | One source row and its fate |

**Dependency order for a write:** dealership → branch → vehicle → media → equipment. Leads and
editorial reference vehicles but are never created by an import.

**Engines that already exist and must not be duplicated:** `buildListingReadiness` (PCP-035),
`RULE_SET` in `quality.rules.ts` (fingerprint-enforced — extending it means registering the rule or
it throws), the photography policy in `src/config/media/`, and `equipment_items.synonyms`.

---

## 2. Architecture (Phases 2 and 13)

```
  CSV ────┐
  Excel ──┤
AutoTrader ─┤──►  SourceTable  ──►  mapping  ──►  interpretation  ──►  validation
Cars.co.za ─┤     (columns +        (Phase 4)     (parse, never       (Phase 5)
  DMS ──────┘      rows)                           fabricate)              │
                                                                           ▼
                       plan ◄── readiness ◄── duplicate check ◄────────────┘
                        │       (existing        (Phase 8)
                        │        engine)
                        ▼
              dealer reviews ──► execute ──► drafts ──► publish
                                    │
                              batch + row ledger
```

**The architectural claim, stated as a rule:** an adapter may not validate, may not map to canonical
fields, and may not touch the database. It turns bytes into `SourceTable` and stops.

Phase 13's three questions:

| Question | Answer | Evidence |
|---|---|---|
| Add an importer without changing the engine? | Yes | Cars.co.za is 11 lines of column aliases and a `detect`. Asserted: adapters import neither validation nor mapping |
| Add a DMS without changing validation? | Yes | Validation consumes `MappedVehicle`, which no adapter produces |
| Add a source without changing publishing? | Yes | Publishing consumes the plan, which has no source-specific field |

The planner is also free of React, Next and Supabase — asserted by bundling it standalone in the
suite. That is what makes a 1 000-row scale test possible at all, and it stops planning from
quietly acquiring a request context.

---

## 3. Smart mapping (Phase 4)

Aliases, scored — not fuzzy matching and not a model. Both are right most of the time and silently
wrong occasionally, and the dealer discovers which when a buyer asks why the car has 2 019 km on it.

Exact alias (100) beats prefix/suffix (70) beats contains (40); a source-specific hint scores 120.
The winning reason is recorded per field and shown before import.

**All 17 columns of an AutoTrader-shaped export map correctly**, verified.

### The two mappings that would have done commercial damage

Found by the suite, live until then:

| Column | Would have become | Consequence |
|---|---|---|
| **Cost Price** | The public asking price | A dealership's buying price published to the open marketplace |
| **Internal Notes** | The public description | Internal remarks published to buyers |

Both end in a legitimate alias (`price`, `notes`) and scored identically to the right column. On an
export listing cost first — which is where margin lives, and it is in every DMS format I modelled —
the wrong one wins on column order alone.

Protected columns (`cost`, `purchase`, `trade`, `internal`, `private`, `margin`, `profit`,
`floorplan`, …) are now never auto-mapped, and are **reported as ignored** so a dealer can map one
deliberately if they meant to.

**Unknown columns never disappear.** They travel to the review screen, into the batch record, and
out again in the report.

---

## 4. Validation (Phase 5)

Two severities. An **error** rejects the row; a **warning** imports it and says what will be thin.
The line is whether a buyer would be misled or the platform would hold a nonsense record.

| Rule | Severity | Message shape |
|---|---|---|
| Duplicate VIN in file | error | "This VIN also appears on row 2 of this file." |
| Duplicate stock number / registration in file | error | Names the other row |
| Model year in the future | error | "…further ahead than next year's models. Check whether this column holds a registration date." |
| Impossible mileage (> 2 000 000 km) | error | "…not a plausible reading. Check whether this figure is in metres or includes the price." |
| Negative price | error | Stated as negative, not as unparseable |
| Missing price / make / model | error | "Buyers filter by price before anything else…" |
| Unreadable price / year / mileage | error | Quotes the value and says what failed |
| Price under R1 000 | warning | "If it is a monthly instalment, the wrong column may be mapped." |
| VIN not 17 characters | warning | Imports anyway |
| No photographs / fewer than 6 | warning | |
| No description / under 60 characters | warning | |
| No equipment | warning | |
| Unknown make / model for that make | warning | Never an error — it would refuse the first Cupra listed |
| Non-URL image entries | warning | Counts them and says why they were skipped |

**Every issue carries the row number, the dealer's own column name and the value.** There is no bare
"Failed" anywhere in the engine.

### Parsing verified against what dealers actually send

- `R 249 900`, `1.250.000,00` (European grouping), `R199950.00` — all read correctly.
- A description containing newlines stays **one row**, not six. Dealers paste from Word.
- Delimiter auto-detected (comma, semicolon, tab, pipe) — Excel on a comma-decimal machine writes
  semicolons without telling anybody.
- Byte-order marks stripped, or `VIN` becomes `﻿VIN` and matches nothing.
- Row numbers are the dealer's: header is row 1, first vehicle is row 2.

---

## 5. Duplicate strategy (Phase 8)

Matched in order of identifier certainty: **VIN → stock number → registration**. Make/model/year is
deliberately *not* used — a forecourt with four identical Polos would report every one as a duplicate.

**The default for a match is `skip` — keep what already exists.** That is enforced by the default, not
by a confirmation dialogue somebody can click through. A dealership re-importing yesterday's file
after adding photographs to three cars would otherwise silently flatten the day's work.

`update` and `create additional` exist as decisions the dealer makes per row or in bulk. **Nothing
sets `update` automatically** — asserted.

---

## 6. Media strategy (Phase 6) — designed, partially built

**Built:** URL extraction from a delimited cell, deduplication within the row, validation that each
entry is a fetchable `http(s)` address, a warning naming how many were skipped and why, and a
photograph count feeding readiness.

**Not built:** ZIP upload, folder upload, cloud sources, fetching and re-hosting the images, EXIF
ordering, lead-image detection, and running the photography-quality engine over imported frames.

The design: import stores URLs against `inventory_vehicle_media` with `processing_status = 'pending'`;
a background pass fetches, hashes for cross-vehicle deduplication, stores in the `vehicle-media`
bucket and runs the existing policy. Until that pass exists, an imported listing references someone
else's CDN — which is why **imports currently produce drafts and publishing is a separate, conscious
step.**

**One provenance decision is genuinely open, and it belongs to the founder.**
`inventory_vehicle_media.provenance` is constrained to `dealer | library | manufacturer`, with no
default, because PCP-015D decided that writing an image requires deciding where it came from. A
migrated photograph does not cleanly fit: the dealer did supply it, but through a third-party feed we
have not verified. Writing `'dealer'` is defensible and slightly overclaims; adding `'imported'` is
honest and means the gallery needs a fourth label. **The executor must not be built until this is
decided**, because the wrong choice is invisible — it renders identically and misstates provenance on
every migrated image.

---

## 7. Readiness (Phase 7)

Every planned row is scored by `buildListingReadiness`, the engine PCP-035 built. Never a second
engine; asserted in the suite.

**A caveat that belongs in the open, because it undercuts the claim slightly:** the import planner is
currently that engine's *only* caller. PCP-035 wrote it and never wired it into the inventory
screens. So a dealer would see a readiness figure on imported stock and none on stock they typed in
themselves — the same question answered on one screen and not the other, which is the inconsistency
principle 1 exists to prevent. The fix is to surface it in inventory, not to score imports
differently.

| State | Threshold | Meaning |
|---|---|---|
| Ready | ≥ 75 | Publishable as it stands |
| Needs review | 40–74 | Will publish; something is thin |
| Cannot publish | < 40 | Too little to be a listing |

Verified: a complete row scores 100% and reads `ready`; a bare row scores 29%, reads
`cannot-publish`, and is **imported rather than rejected** — reward completeness, never punish
incompleteness.

---

## 8. Performance (Phase 12)

Planning only. Measured on this machine, warm.

| Vehicles | Plan time | Heap | Photographs found |
|---|---|---|---|
| 20 | 2ms | 0.3 MB | 93 |
| 50 | 3ms | 0.4 MB | 240 |
| 100 | 4ms | 1.7 MB | 496 |
| 300 | 21ms | 6.6 MB | 1 491 |
| **1 000** | **30–130ms** | **6.5 MB** | 4 996 |

Roughly linear; 20 → 1 000 is ~35×. **A 250-vehicle file is validated, deduplicated and scored in
well under a tenth of a second**, which is what makes the review screen feel instant and makes
re-mapping and re-planning free.

Writing is not yet measured, because the executor is not built. It is the part that will dominate:
1 000 vehicles plus 5 000 media rows against a database whose round trip measured 360ms from this
machine (PCP-034) needs batched inserts, and that is a real risk noted below rather than a solved
problem.

---

## 9. Competitive benchmark (Phase 11)

| | AutoTrader / Cars.co.za dealer portals | SURF4CARS today |
|---|---|---|
| **Better there** | Bulk import from DMS and spreadsheet, established | Engine built, no UI |
| | Automated feed ingestion on a schedule | Not started |
| | Photograph hosting and processing at scale | Not started |
| | Buyer audience | 40 buyer accounts, all seeded on `surf4cars-demo.co.za` |
| | View and enquiry telemetry per listing | Honestly marked unavailable |
| **Better here** | Import is opaque; you upload and hope | Every row, issue and duplicate shown **before** anything is written |
| | Silent overwrite on re-import is normal | Overwrite is impossible without a per-row decision |
| | Unmapped columns vanish | Reported, stored, and in the report |
| | Cost columns are a known footgun | Structurally protected |
| | "Listing quality" is a black-box score | Itemised, weighted, each item naming the buyer consequence |
| | Provenance is not retained | Raw source cells kept as a ledger |
| **Never copy** | Scores that cannot be explained | |
| | Auto-publishing on import | |
| | Charging for visibility of your own data | |

**Where SURF4CARS can be clearly superior:** the review-before-write model. Every incumbent treats
import as a batch job with a report afterwards. Showing the complete outcome first — and refusing to
overwrite — is a genuinely different posture, and it is the one a dealership moving 250 cars actually
wants.

---

## 10. Founder question

> *If a dealership with 250 vehicles currently uses AutoTrader or Cars.co.za, what prevents them
> migrating completely to SURF4CARS?*

### Critical launch blockers

| # | Obstacle | Evidence |
|---|---|---|
| **1** | **No dealership can take possession of its own record.** Every dealership *does* have a working owner account — 128 of 128 `owner_user_id` values resolve to a real `auth.users` row, and all 98 staff memberships resolve too. But every one of those accounts is a seed identity on an address the dealership does not control: **76 owner addresses on `example.com`** (IANA-reserved, cannot receive mail) and **50 on `surf4cars-demo.co.za`** (ours). Password reset therefore delivers to us, not to them. `owner_user_id` is written once, at onboarding completion (`onboarding-persistence.ts:329`), and **nothing anywhere reassigns it** — grep finds exactly one write and one read. The team-invite endpoint requires an already-signed-in dealer holding `dealer:team:manage`, so it cannot bootstrap the first account | Corrected from PCP-035, which recorded this as "no accounts exist". Accounts exist; ownership transfer does not |
| **2** | **No import UI.** The engine is built and tested; a dealer cannot reach it | This sprint |
| **3** | **No import executor.** Planning writes nothing; nothing turns an approved plan into listings | This sprint |
| **4** | **No photograph pipeline**, and the provenance value for a migrated image is undecided (above). Imported listings would reference a competitor's CDN, which disappears when the dealer leaves | |
| **5** | **No enquiry delivery.** Provider key, verified domain and scheduler still unconfigured | Carried from PRP-006 |
| **6** | **No dealer contact details.** `telephone`, `whatsapp`, `email` and `website` are null on **all 128 dealerships and all 128 branches** | Measured 2026-08-02 |
| **7** | **No verification.** `verification_status` is `unknown` on 128 of 128 | |

### High business value

8. Scheduled feed ingestion — dealers change stock daily; a one-off import goes stale in a week.
9. Import report export (CSV/Excel/PDF) — the artefact a dealer principal signs off.
10. Bulk publishing UI with undo — designed; the ledger already supports reversal.
11. Equipment synonym matching against `equipment_items` — 37 canonical items with a `synonyms`
    column already exist and `vehicle_equipment` has 0 rows, so the import would be its first writer.

### Competitive advantage

12. Review-before-write, already built — the differentiator, unusable without #2.
13. Listing readiness surfaced in inventory (built in PCP-035, called only by the import planner).
14. Cross-vehicle photograph deduplication.
15. Price positioning for dealers (engine exists from PCP-034).

### Future enhancement

16. Excel `.xlsx` binary parsing (CSV export covers today).
17. Two-way sync back to the incumbent during a trial period.
18. VIN decoding to fill specification gaps.

### One thing found while checking these numbers

Two owner accounts carry addresses on **`capemotors.co.za`** — a domain derived from the business
name "Cape Motors", which is the exact pattern AGENTS.md prohibits. Both belong to the two records
flagged `is_demonstration = true`, so nothing customer-facing claims that domain, and these are
internal auth records rather than published contact details. It is still a live address on a domain
SURF4CARS does not own, sitting in `auth.users`, and it should be moved to `demo.surf4cars.co.za`
before any production credential flow is switched on.

---

## 11. Would I ask a real dealership to migrate to SURF4CARS today?

## NO

Not close. In business-impact order:

1. **They cannot get into their own account.** The account exists and works; the address on it is
   ours or `example.com`, and nothing can transfer ownership to them.
2. **There is no import screen.** The engine is real and tested; nothing exposes it.
3. **Nothing writes the plan.** Approval leads nowhere.
4. **Photographs would point at AutoTrader's CDN** and break when they leave — the migration would
   undo itself.
5. **Enquiries reach nobody.** No provider configured, and no telephone number or email on any of
   the 128 dealerships.
6. **There is no audience.** 229 published vehicles, and every one of the 40 buyer accounts is a
   seed identity on `surf4cars-demo.co.za`. All 300 leads are from those same seeded addresses.
   **4 of 269 accounts have ever signed in, most recently 2026-06-30.** Nobody has used this
   platform.

Point 6 is the one worth sitting with, and it is the one I got wrong on the first pass of this
report — I wrote "zero buyer accounts", and there are forty. It makes no difference to the answer,
because all forty are ours. That is the more useful framing: the platform currently has a complete
population of plausible users, none of whom exist. Items 1–5 are weeks of unglamorous work with a
definite end. Point 6 is not an engineering problem, and no amount of migration tooling solves it —
a dealership that moves 250 cars onto a marketplace with no audience has paid a switching cost for
nothing.

**The honest sequence is to fix 1–5, then acquire buyers against a small number of hand-onboarded
dealerships — and only ask a 250-vehicle dealership to migrate once enquiries are demonstrably
arriving.** Asking sooner would burn the one thing that cannot be rebuilt, which is a dealer
principal's willingness to try you twice.

---

### How the numbers in this report were obtained

Every count above was read directly from PostgREST with the service key on 2026-08-02, not carried
forward from an earlier report. That check is the reason three claims in the first draft of this
document changed: "98 staff rows have no auth accounts" (they all resolve), "zero buyer accounts"
(forty, all seeded), and a media `provenance = 'imported'` design that the schema's check constraint
would have rejected. The first two came from a previous programme's summary and were plausible enough
to survive rereading — which is the failure mode AGENTS.md is about, arriving via a report rather
than a seed.
