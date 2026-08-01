# Launch readiness — PCP-028

Every item is **Ready**, **Needs work** or **Blocked**. No item is left ambiguous, and nothing is
marked Ready on the strength of an assertion — the evidence column names how it was checked.

---

## The verdict

**No — I would not launch to the South African public tomorrow.**

Three things prevent it. Only three. Everything else on this page is Ready or is a known gap that
does not stop a launch.

| # | Blocker | Why it stops launch |
|---|---|---|
| 1 | **No terms, privacy policy or contact page** | The platform collects names, emails and phone numbers through the enquiry form and creates accounts. Operating that without a published privacy policy is not a polish issue. |
| 2 | **Enquiries are written to a local JSON file, not the database** | `dealer-enquiry.service.ts` calls `updatePlatformStore()`, which writes `db/local/platform-store.json` on the server's filesystem. A `leads` table exists in Supabase with 300 seeded rows; the enquiry path never moved onto it. On a serverless host that filesystem is read-only or ephemeral, so a real enquiry is lost — while the buyer is shown "Enquiry sent to the dealer." Nothing notifies the dealership either way. |
| 3 | **The photography is reference imagery** | 18 of 19 frames reviewed against the standard failed. This is a brand risk rather than a technical one, but launching a marketplace whose premise is photography, with photography borrowed from Wikipedia, is a decision rather than an oversight. |

Blockers 1 and 2 are days of work. Blocker 3 is a photographer.

**The condition under which I would launch:** those three closed. Nothing else on this list is worth
delaying for.

---

## Brand

| Item | Status | Evidence |
|---|---|---|
| Wordmark and hero identity | Ready | Typographic, scales continuously, owns the hero and yields to the masthead on scroll |
| Favicon | Ready | 26 KB `.ico`; the 1.4 MB WebP override removed |
| Theme colour | Ready | `#1a1f28`, matches the page — was `#080808` |
| Open Graph / share cards | Ready | Homepage and vehicle pages both carry an image; verified in rendered `<head>` |
| **Brand name is inconsistent** | **Needs work** | Wordmark says SURF4CARS, titles and copyright say SURF FOR CARS. `docs/brand-naming-audit.md`. Founder decision, not a blocker |
| Apple touch icon | Needs work | Declared none rather than a broken WebP. Needs a 180px PNG |

## Design and accessibility

| Item | Status | Evidence |
|---|---|---|
| One visual language across public pages | Ready | Cards, buttons, glass, motion and spacing unified across five programmes |
| Contrast | Ready | 35/35 pairings pass WCAG 2.1 AA — `scripts/audit-design-contrast.mjs` |
| Responsive | Ready | Desktop, tablet and mobile captured for every public page |
| Empty, error and loading states | Ready | `LuxuryEmptyState` standard; no "No results found", no disabled controls |
| Reduced motion | Ready | Smooth anchor scroll verified to fall back to instant under `prefers-reduced-motion` |

## Performance

| Item | Status | Evidence |
|---|---|---|
| LCP | Ready | 180 ms–2.3 s across all pages, production build |
| CLS | Ready | **0.000** on every page at both viewports, sustained across ten sprints |
| Bundle | Ready | ~280 kB JS per route, production |
| Image optimisation | Needs work | Hero assets are 2.3 MB WebP. Not a blocker — LCP is already good — but the cheapest remaining win |

## Photography

| Item | Status | Evidence |
|---|---|---|
| Policy enforcement | Ready | Three tiers, single funnel, no consumer can bypass |
| Readiness reporting | Ready | `docs/reports/photography-readiness.md`, regenerated on demand |
| **Hero-grade frames** | **Blocked** | **Zero** frames are ≥2000 px and landscape. No vehicle can carry a hero |
| **Homepage-grade frames** | **Blocked** | 106 policy-eligible, **1 human-approved of 19 reviewed** |

## Editorial system

| Item | Status | Evidence |
|---|---|---|
| Migration applied | Ready | `supabase db push` against project `xhspykrmbjylkyduudru`; 12 slots seeded |
| Publish → renders | Ready | 3 picks published → 3 rendered on the live homepage |
| Unpublish → disappears | Ready | Unpublished 1 → 2 remained |
| Rollback → fallback returns | Ready | Slot unpublished → algorithmic rail restored |
| Duplicate prevention | Ready | Unique constraint rejects a repeat (`23505`) |
| Campaigns without code | Ready | Every published `collection` slot renders in `position` order |
| Founder's Collection | Ready | Seeded slot; verified end to end |
| Stale subjects | Ready | Archived and deleted vehicles correctly refuse to render |
| RLS | Ready | anon INSERT blocked (`42501`); anon UPDATE changed nothing; service role writes |
| Console UI forms | Needs work | Data path proven end to end. The React forms themselves are unexercised — they sit behind auth |
| Campaign expiry / scheduling | Needs work | Publish and unpublish are manual. No start or end date |

## Marketplace and buyer experience

| Item | Status | Evidence |
|---|---|---|
| Ten-step buyer journey | Ready | `scripts/walk-buyer-journey.mjs` — all steps pass, no console errors |
| Search, filters, sort | Ready | All controls navigate and filter; nothing disabled |
| Vehicle detail | Ready | Story order, full-bleed gallery, lightbox, keyboard close |
| **Enquiry delivery** | **Blocked** | Writes to `db/local/platform-store.json` via `updatePlatformStore()`, not to the `leads` table that exists for it. No notification of any kind. Verified by reading the service and querying Supabase |
| Saved vehicles | Needs work | Works signed in. No public route to sign in from a vehicle page |
| Compare | Needs work | Does not exist. Not promised anywhere in the UI |

## Dealer experience

| Item | Status | Evidence |
|---|---|---|
| Registration and onboarding | Ready | Seven steps, autosave, honest copy |
| Portal access control | Ready | `/dealer/*` gated; verified 307 unauthenticated |
| Publish a vehicle | Needs work | Wizard exists; not walked end to end this sprint |

## Security and operations

| Item | Status | Evidence |
|---|---|---|
| Route gating | Ready | `src/proxy.ts` — operations, dealer and buyer all 307. **Was silently disabled for the whole project until PCP-017** |
| Editorial write path | Ready | Service role behind the operations gate; no client write policy |
| Quality engine | Ready | Rule set enforced at runtime; fingerprinted for comparability |
| Secrets | Ready | Service key server-only; not referenced in any client bundle |
| Error monitoring | Needs work | Logger writes to stdout. No aggregation |
| Backups / restore | Needs work | Supabase defaults. Never tested |

## Legal

| Item | Status | Evidence |
|---|---|---|
| **Terms of service** | **Blocked** | Does not exist |
| **Privacy policy** | **Blocked** | Does not exist. Personal data is collected today |
| **Contact / company details** | **Blocked** | No route. Required for a commercial site in South Africa |
| Demonstration data labelled | Ready | `is_demonstration` carried and surfaced |

---

## Not blockers — deliberately

Compare, saved-search alerts, campaign scheduling, error aggregation, image compression, the brand
name decision, the apple-touch icon. Each is real; none stops a launch, and listing them alongside
the three that do would obscure them.

## What I would do first

1. **Move enquiries onto the `leads` table, then notify.** Two faults, one path: the write goes to a
   local file that will not survive production, and nobody is told. The table is already there with
   the right shape. This is the platform's only conversion action and the one place it currently
   tells a customer something untrue.
2. **Publish terms, privacy and contact.** Days of work, and legally required.
3. **Book the photographer.** Twelve frames — see the brief at the foot of the readiness report.

In that order, because the first is a broken promise, the second is an obligation, and the third is
the difference between good and memorable.
