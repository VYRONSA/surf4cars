# Production readiness — RC1

_Generated 31 July 2026. Sources: `node scripts/pcp015c-quality-verify.mjs`,
`node scripts/audit-design-contrast.mjs`, `node scripts/audit-data-quality.mjs`, `npx next build`, and direct
inspection of the live database._

---

## The verdict in one line

**SURF4CARS is honest and empty.** It is not ready to launch, and the reason has changed: it is no longer
failing because it contains fabricated information — that has been removed — it is failing because it lacks
production content. Those are different risks with different owners, and conflating them was hiding which
one actually blocks launch.

| | Score | Owner | Blocks launch? |
| --- | --- | --- | --- |
| **Platform integrity** — is what we show true? | **85 / 100** | Engineering | Not on its own |
| **Marketplace completeness** — is there enough to trade? | **0 / 100** | Onboarding / dealer success | **Yes** |

Measured across 126 production dealerships and 218 published listings. Two demonstration dealerships are
excluded from both scores and listed separately.

A single blended figure would have read "25% ready" and sent us to fix the wrong thing. Engineering cannot
close a completeness gap; only dealers arriving with real photographs and real phone numbers can.

---

## Critical — blocks launch

### C1 · No listing shows a photograph of the vehicle being sold

**218 of 218 published listings.** Every image in the database — all 1 000 media rows — points at
`/images/vehicles/library/`, a generic photograph keyed on make and model.

This was an *integrity* failure until this sprint: the imagery was presented without qualification, so a
buyer assessing colour, trim and condition was assessing a different car. It is now disclosed in the gallery
frame ("Illustrative image — represents the make and model, may not depict the actual vehicle for sale"), so
the platform is no longer misleading anyone. It remains **critical under completeness**: disclosure makes a
thin listing honest, it does not make it saleable.

**Resolution:** dealer photography, stored with `provenance = 'dealer'`. No engineering work remains.

### C2 · No dealership can be contacted

**126 of 126 production dealerships** have no telephone, no WhatsApp and no email address.

This is the correct state, not a regression. Every previous value was fabricated — 76 `@example.com`
addresses and 52 `@surf4cars-demo.co.za`, with 76 telephone numbers containing "555" — and fabricated
contact details were removed rather than replaced with better fakes.

A marketplace where no listing can end in a conversation cannot open. **Resolution:** verified contact
details captured at onboarding. For investor demonstrations only,
`node scripts/seed/demo-contact-details.mjs --confirm` applies platform-owned values
(`demo@surf4cars.co.za`, `+27 10 000 0000`, `demo.surf4cars.co.za`) and flags every row
`is_demonstration = true` so the interface labels them. The script refuses to run against production.

---

## High

### H1 · No equipment on any listing — 218 of 218

`vehicle_equipment` holds zero rows. The architecture is complete and applied (catalogue of 37 items across
8 categories, synonym search, provenance per entry); nothing has been captured against it. Deliberate — no
equipment has ever been inferred from a model name. **Completeness.**

### H2 · 32 dealer addresses contradict themselves — **integrity**

Postal code and province disagree on 32 records; a further set names a city in the wrong province. Example:
postal code `6232` is Eastern Cape on records stating Gauteng.

These are the 15 points missing from the integrity score, and the only current defects where the platform
states something untrue. **Fix before launch** — an address a buyer cannot navigate to is a broken promise
regardless of how much content sits around it.

### H3 · 5 duplicate listings — **integrity**

Five listings are indistinguishable from another at the same dealership: same make, model, year and odometer
reading. A marketplace that repeats itself reads as padded stock.

---

## Medium

| Issue | Count | Dimension |
| --- | --- | --- |
| No dealer website recorded | 126 | Completeness |
| Street address names no suburb | 126 | Completeness |
| Trading identity unverified (no CIPC or VAT number) | 126 | Completeness |
| Opening hours | all | Completeness — provenance, not schema (corrected — see below) |
| Dealership story | all | Completeness — **no column exists**; schema work required |

### Correction: opening hours were never a schema gap

An earlier revision of this report stated that opening hours had no column anywhere. That was wrong, and the
error is worth recording because the distinction it missed turned out to be the most useful finding of
PRP-001.

`dealership_branches.business_hours` exists and is populated on all 128 branches. The dealer profile was
withholding it — correctly, because there are only five distinct strings across those 128 branches, so the
values are seed data and publishing them would send a buyer to a forecourt on our word.

**The problem was never missing data. It was missing provenance.** The information existed; what did not
exist was any way to establish whether it came from the dealership or from our seed. Lacking that, the read
path fell back to a hardcoded `null` — which suppressed the seed values, and would equally have suppressed a
real dealer's genuine hours the day they supplied them.

`dealership_field_provenance` resolves it: `seed` never publishes, `dealer` and `verified` do. The same
correction applies to `logo_data_url` (all 128 hold `/images/branding/logo.png` — the SURF4CARS logo) and
`cover_data_url` (one stock hero repeated).

The only genuine schema gap remaining is the dealership story, which has no storage anywhere.

---

## Resolved this programme

| Was | Now |
| --- | --- |
| 128 dealerships with fabricated contact details and legal identifiers | All cleared to NULL; schema permits "not supplied" |
| 3 generated dealer domains resolving to live third-party businesses | Removed; deriving contact details from a business name is now a documented prohibition |
| Format-correct fake VAT (`4200000273`) and CIPC (`2019/100039/07`) numbers | Cleared — a convincing fake is more dangerous than an obvious one |
| Stock photography presented as the actual vehicle | Labelled in-frame; provenance now mandatory on every media row |
| A test fixture as the largest dealership (22 vehicles) | Tagged `is_demonstration`, excluded from scoring, surfaced explicitly |
| `onboarding_status` in two spellings — 50 records invisible to every consumer | Normalised to `completed`, enforced by check constraint |
| Red text failing WCAG AA at 4.0:1 across 43 files | `--color-primary-text`; 35/35 pairings pass |
| Data quality report linking to 76 URLs that 404'd | Fixed; link construction consolidated into one implementation |

---

## Engineering health

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Clean |
| `npx next build` | Compiles |
| WCAG 2.1 AA contrast | 35 / 35 pairings pass |
| Design System | Frozen at 1.0 |
| Migrations | All applied and verified against the live database |

**The software is mature. The data is not.** No feature work is required to reach launch; what is required is
content, and content arrives through onboarding rather than through engineering.

---

## Recommended sequence

1. **Fix the 32 address contradictions.** The only remaining integrity defect, and the only item here
   engineering can close alone.
2. **Capture dealer-supplied opening hours.** The column and the provenance mechanism both exist; what is
   needed is a dealer confirming their hours, which flips provenance from `seed` to `dealer` and publishes
   them. No engineering work.
3. **Onboard a small number of real dealerships end to end** — verified contact details, genuine photography,
   captured equipment. Ten complete dealerships demonstrate the platform better than 126 empty ones, and will
   move completeness off zero in a way that is real.
4. **Re-run `pcp015c-quality-verify`** after each cohort. The score is designed to register progress; if it
   does not move, the cohort did not land.

Do not soften either score to make a milestone look closer. The integrity score is the one number on this
platform that must always be believed.
