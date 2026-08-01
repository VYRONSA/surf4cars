# Launch readiness — PCP-028

Every item is **Ready**, **Needs work** or **Blocked**. No item is left ambiguous, and nothing is
marked Ready on the strength of an assertion — the evidence column names how it was checked.

---

## The verdict

**PCP-028 verdict: No.** Three blockers.
**PCP-029 verdict: still No.** One blocker remained: nobody was told an enquiry arrived.
**PCP-030 verdict: No — but the remaining blockers are all things the founder holds, not things to build.**

| # | Blocker | Status |
|---|---|---|
| 1 | No terms, privacy policy or contact page | **Closed** (PCP-029). Four pages written against what the code does, linked in the footer. Unresolved items render as visible "Founder review required" notes — company registration, POPIA Information Officer, retention period, attorney review. |
| 2 | Enquiries written to a local JSON file | **Closed** (PCP-029). Persisted to Supabase with a human-readable reference and source page. Verified end to end through the real form: reference shown matches the row, timeline written. No path returns success without a committed row. |
| 3 | The photography is reference imagery | **Open.** 18 of 19 frames reviewed against the standard failed. Zero frames qualify for the hero tier. |
| 4 | Nobody is told an enquiry arrived | **Built, not switched on.** The whole delivery path exists and is verified — provider abstraction, retry queue, delivery log, timeline, Founder health card. It sends nothing until three environment variables are set and dealerships have addresses. See below. |

**Would I allow SURF4CARS to go live today? No.** Three things stand between here and yes, and only
one of them is work:

> **The delivery machinery is done and is not running.** An enquiry now produces a durable
> notification record, an immediate send attempt, a retry queue at 5 minutes / 30 minutes / 2 hours,
> an append-only timeline, and a card on the Founder dashboard that says plainly whether anything
> reached anyone. 65 automated checks drive real enquiries through the real route and read the rows
> back. What it does not have is a provider key, a scheduler, and dealerships with email addresses.
>
> Crucially, the platform now **tells the truth while that is the case.** A buyer whose enquiry could
> not be announced is told it was received, that the dealership can see it, and that ringing is worth
> it — not that the dealer has been notified. That is the difference between a launch that is
> incomplete and one that misleads people, and it is the change that makes the remaining gap
> survivable rather than disqualifying.

**The conditions under which I would launch:**

1. **`EMAIL_PROVIDER`, `EMAIL_API_KEY` and `EMAIL_FROM` set**, on a domain verified with the
   provider. Enquiries taken before that are held and sent on the first sweep afterwards — the
   backlog is not stranded, and that is verified.
2. **A scheduler calling `/api/v1/internal/notifications/retry` every five minutes**, with
   `NOTIFICATION_CRON_SECRET` set. Without it the first attempt is the only attempt. One `vercel.json`
   entry; see `docs/enquiry-notifications.md`.
3. **Dealerships with contact addresses.** None of the 128 has one; 51 have a staff account that can
   receive. The other 77 have nobody to email, and those enquiries are honestly recorded as
   `unroutable` rather than counted as delivery failures. **This is an onboarding task, and it is now
   the largest single obstacle to enquiries reaching anybody.**
4. **The founder-review items on the legal pages resolved** — company registration details and a
   named Information Officer. Both are facts the founder holds, not work.
5. Photography commissioned, or a conscious decision to launch without it. This is a brand risk
   rather than a functional one, and it is legitimately the founder's call.

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
| Terms of service | Ready | `/legal/terms`, written against what the code does, linked in the footer |
| Privacy policy | Ready | `/legal/privacy`. Names the data actually collected by the enquiry form |
| Cookie policy | Ready | `/legal/cookies` |
| Contact / company details | Ready | `/contact`. No form — the page exists to publish details, not to collect more |
| **Company registration, Information Officer** | **Needs work** | Rendered as visible amber "Founder review required" notes on the pages themselves, not code comments. Facts the founder holds |
| Attorney review | Needs work | Not done. Marked on the pages |
| Demonstration data labelled | Ready | `is_demonstration` carried and surfaced |

## Enquiry notifications (PCP-030)

| Item | Status | Evidence |
|---|---|---|
| Notification is recorded, never assumed | Ready | `enquiry_notifications`: provider, destination, status, attempts, provider response, `created_at` / `sent_at` / `failed_at`. Verified by reading rows back after real submissions |
| Persistence always precedes sending | Ready | Notification path returns outcomes and throws nothing into the request. Verified: enquiry persists through provider timeout and through outright rejection |
| Buyer is never told the dealer was notified unless true | Ready | Two confirmation wordings chosen by the server. Verified in a browser against both branches — the rendered text is in the run output |
| Provider is swappable, never hardcoded | Ready | `EMAIL_PROVIDER` / `EMAIL_API_KEY` / `EMAIL_FROM`. No key, sender or account in source. Resend and SendGrid implemented |
| Retry queue | Ready | Immediate, +5 min, +30 min, +2 h. Verified: each delay asserted from `next_attempt_at`, stops at 4 attempts, failed rows are never selected again |
| Permanent failures do not retry | Ready | Rejected address fails on attempt 1 with no retry scheduled |
| Duplicate prevention | Ready | Unique index on `(lead_id, channel)`. Verified: double submission yields one lead, one notification, one attempt |
| Append-only timeline | Ready | Queued → retrying ×3 → failed leaves six entries; nothing overwritten |
| Founder health card | Ready | On the operations dashboard, above Recent Activity. Sent / retrying / failed / nobody-to-email / average time to send |
| **Amazon SES** | **Needs work** | Not implemented. Refused at configuration time with a message naming the alternative, rather than failing at send time on a real enquiry |
| **Scheduler for the retry queue** | **Needs work** | Endpoint verified working and authorised; nothing calls it on a timer. One `vercel.json` cron entry — deliberately not written for a host that is not chosen |
| **Delivery confirmation** | **Needs work** | No provider webhook, so no row reaches `delivered`. The card shows "Sent" and says why, rather than showing a zero or copying the sent figure |
| **Dealership contact addresses** | **Blocked** | 0 of 128 dealerships have one; 51 have a staff account that can receive. 77 have nobody to email. Recorded as `unroutable`, counted separately from delivery failures |

---

## Not blockers — deliberately

Compare, saved-search alerts, campaign scheduling, error aggregation, image compression, the brand
name decision, the apple-touch icon. Each is real; none stops a launch, and listing them alongside
the ones that do would obscure them.

## What I would do first

1. **Collect dealership email addresses.** This is now the binding constraint on the platform's only
   conversion action, and it is an onboarding task rather than an engineering one. The delivery path
   is built and verified; for 77 dealerships it has nobody to deliver to. Nothing else on this list
   moves the number of enquiries that reach a human.
2. **Set the provider variables and point a scheduler at the retry endpoint.** Minutes of work, and
   until it happens the send path runs at one attempt with no second chance.
3. **Publish the company registration details and name an Information Officer.** Facts, not work,
   and they are the last thing standing between the legal pages and being finished.
4. **Book the photographer.** Twelve frames — see the brief at the foot of the readiness report.

In that order, because the first decides whether enquiries arrive at all, the second decides whether
they arrive reliably, the third is an obligation, and the fourth is the difference between good and
memorable.
