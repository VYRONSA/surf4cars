# SURF4CARS — Final Founder Deployment Certificate

**Audit date:** 3 August 2026
**Build:** production (`npm run build`), served by `next start`, audited against the live Supabase project
**Method:** 77 adversarial probes written to succeed at things they should not be able to do, plus 14
verification suites (486 checks), plus four persona walkthroughs and measured performance.

**This audit was instructed to prove the platform is not ready.** What follows is what it found.

---

## Verdict by area

| Area | Result |
|---|---|
| Engineering | **PASS** |
| Security | **PASS** |
| UX | **PASS** |
| Mobile | **PASS** |
| Performance | **PASS** |
| Trust | **PASS** |
| Operations | **FAIL** |
| Documentation | **PASS** |
| Commercial Readiness | **FAIL** |

---

## Recommendation

**I do not recommend deploying SURF4CARS to production.**

---

## Launch blockers

Six. **None of them is an engineering defect.** All six are configuration or content, and all six are
closeable in a day or two by somebody with the right credentials.

### 1. The homepage has no vehicles on it

Measured: **0 photographs approved**, therefore 0 vehicle rails, on a build serving 229 published
vehicles from 43 dealerships.

The page is not broken and does not look broken — hero, working search with live facets, a marque
wall with real counts, a trust section, a dealer call to action, footer. It is handsome. It is also a
car marketplace whose front page contains no car.

This is the approval gate working exactly as designed. It is still a blocker: nobody should see this
page before somebody has curated it. **Fix:** `/operations/photography`, approve frames, one minute
to appear.

### 2. Every canonical URL published to the world points at `localhost`

Measured: `NEXT_PUBLIC_APP_URL = http://localhost:3003`, and consequently **278 of 278 `<loc>` entries
in `/sitemap.xml`** point at localhost, as does the sitemap reference in `/robots.txt`.

This is the most damaging single item in the audit. If this ships, Google indexes 278 unreachable
URLs, every share card is broken, and every canonical tag is wrong. It must be set **at build time** —
setting it afterwards does nothing, because it is compiled in.

### 3. No dealership is ever told about an enquiry

Verified end to end: a buyer's enquiry submits, `POST /api/v1/marketplace/enquiries` returns 200, the
lead persists with the correct dealership and vehicle, status `new`, and the buyer sees a confirmation
with a reference number.

No email is sent, because no provider is configured. The platform is honest about it — the
confirmation reads *"the dealership can see it in their dashboard. We are still working on getting a
notification through to them."* That is the right behaviour and it is not a substitute for the
notification.

A marketplace whose dealers must remember to log in to discover their leads will lose leads.

### 4. `/api/health` reports **unhealthy**

Measured. Database, storage and auth are all healthy; `configuration` is not, for the reason in
blocker 2. A production orchestrator reading this endpoint will refuse to route traffic to the
instance — correctly.

### 5. No scheduler

No `CRON_SECRET`, no scheduled jobs. Quality snapshots, integrity re-runs and freshness checks are
manual. The integrity check is a button rather than a silent no-op, which is a mitigation, not a fix.

### 6. Not one dealership can be contacted

Measured: **0 of 126** non-demonstration dealerships carry a telephone number or an email address.

This is correct under the platform's own contact rule — `NULL` is preferred over a guess — and it
means a buyer who finds a car cannot reach the seller by any route except the enquiry form, which
(blocker 3) nobody is notified about.

---

## What I could not break

Recorded because a security section that only lists failures tells you nothing about the attempts.

**Authorisation — 34 probes, 0 successes.**

- Every protected route returns 307 to anonymous requests (10 routes).
- A buyer session reaching dealer or operations routes lands on `/unauthorized`; a dealer session
  reaching operations or buyer routes lands on `/unauthorized` (6 probes).
- A forged `surf4cars-auth-user-type=platform-owner` cookie with no token behind it: refused.
- A structurally valid token belonging to a **deleted** user: refused.
- A malformed token: refused.
- **Tenant crossover.** The dealer API takes `dealershipId` as a query parameter, which is the obvious
  attack. A signed-in dealer supplying another dealership's id gets `403 You are not authorized for
  this dealership` on dashboard, leads, inventory and profile. Anonymous gets `401`.
- Anonymous reads of `leads`, `vehicle_reviews`, `media_integrity_flags`, `dealer_onboarding_drafts`
  and `dealership_ownership_claims`: 0 rows.
- Anonymous reads of `dealerships.owner_user_id`, `.verification_note`, `.subscription_package`:
  denied at the column.
- An anonymous attempt to approve a photograph for the homepage: denied.
- Six unauthenticated API endpoints: 400/401/403/405, none served data.

**Hostile input — 11 probes, 0 successes.** Path traversal, encoded traversal, script injection in a
slug, SQL in a dealer slug, a 4 000-character query value, negative and absurd page numbers, a null
byte. No 500s, no stack traces, no leaked internals.

**State and navigation.** Deep link plus refresh, browser back then forward, two tabs at once, empty
result sets, the full 229-vehicle set — all correct. Unmatched URLs return a real 404 carrying site
navigation.

**Search filters are honest.** `?make=Ferrari` and `?fuel=Electric` return zero cards with the copy
*"Nothing matching Ferrari on the marketplace today"* and a suggestion link. I initially recorded
`?minPrice=5000000` as a broken filter; it is not — the parameter is in cents, so I was asking for
R50 000, and 228 of 229 vehicles qualify. `?minPrice=190000000` correctly returns 1.

---

## Measured performance

Localhost, production build, Chromium. **These are a floor, not a prediction** — there is no network
between client and server here, so real-world TTFB and LCP will be higher.

| Route | TTFB | LCP | CLS | Transfer |
|---|---|---|---|---|
| `/` | 5 ms | 164 ms | 0 | 292 kB |
| `/search` | 10 ms | **2 372 ms** | 0 | 41 kB |
| `/vehicle/[slug]` | 10 ms | 1 304 ms | 0 | 23 kB |
| `/pricing` | 11 ms | 148 ms | 0 | 139 kB |

- **Client JavaScript on disk:** 1 971 kB across 55 chunks; largest three 224 kB, 222 kB, 134 kB.
- **Database round trip:** 249 ms median of 5 (count query, remote Supabase).
- **Homepage on emulated 3G at 390 px:** 2 740 ms to load event.
- **Dealer dashboard:** populates between 2.5 s and 5.0 s after navigation — measured by the same
  probe returning 443 characters at 2.5 s and 3 495 at 5 s.

`/search` at 2 372 ms LCP is 128 ms inside the 2 500 ms "good" threshold **on localhost**. It is the
one number in this table I would not bet on surviving contact with a real network.

---

## Trust audit

Every customer-facing surface scanned for over-promising: `/`, `/search`, `/pricing`, `/contact`,
`/legal/terms`, `/legal/privacy`. Thirteen risk patterns — guarantees, best-price claims, market
leadership, ratings, review counts, lifetime offers, certification, warranties, finance
pre-approval, urgency, placeholders.

**Nothing to remove.** Three matches, all false positives on inspection:

- "Free State" on the homepage is a province in a location dropdown.
- "no lifetime discount and no permanently reduced rate" on `/pricing` is the disclaimer itself.
- "We do not guarantee that a vehicle is available" in the terms is a disclaimer pointing the right
  way.

The hero's statistics are exact: **229 vehicles, 43 dealerships, 7 provinces** — and 43 is the number
of dealerships with *published stock*, not the 128 on file. That is the harder and more honest number.

---

## UX and mobile

One defect found.

**The dealer portal's landing page has a Back button that links to itself.** `/dealer/dashboard`
resolves its fallback to `/dealer/dashboard`, labelled "Back to dashboard". With history behind it,
it works. Opened cold — from a bookmark or an email — it reloads the page and appears to do nothing.

It is the only route of 59 with this property. The component's own documentation says *"a control
that sometimes does nothing is worse than no control"*, which is exactly right and exactly this.
**Post-launch**, not a blocker: one line in `resolveFallback`.

Everything else held. 36 back-navigation checks across every route signed in, ≥44 px targets,
keyboard-activated, consistent placement. No horizontal overflow at 390 / 834 / 1440. Accessibility
basics clean on `/`, `/search`, `/pricing`: document titles, `lang="en"`, exactly one `h1`, zero
images without `alt`, zero unnamed controls.

---

## Operations — FAIL

The question asked was whether another person could operate SURF4CARS using **only** the Operations
Manual, Founder Dashboard, Editorial Console, Photography Console and Dealer Portal.

They could keep the marketplace running: curate the homepage, approve photography, publish
collections and a Dealer Spotlight, watch the queues. That part is genuinely operable and documented.

They could **not** onboard a dealership to the documented standard, because four operator tasks have
no screen:

- setting a dealership's contact details,
- setting verification status after checking documents,
- recording a cover photograph and its provenance,
- recording founding-dealer status.

All four are database writes. The manual documents them honestly as `[SQL]`, which is why
Documentation passes and Operations does not — the manual is accurate about a gap that still exists.

**This is why Operations is marked FAIL rather than passed with a note.** The brief asked a specific
question and the honest answer is no.

---

## Commercial Readiness — FAIL

Put myself behind the counter of a dealership being asked to move 250 cars across.

*Would I trust it?* Yes. The dealer dashboard is professional and its numbers are correct — I verified
7 published against 7 in the database. Tenant isolation is genuinely enforced. The listing pages are
better than what most South African dealers currently get.

*Would I move my inventory?* **Not this week.** Three reasons, in order:

1. **My cars would not appear on the front page.** Nothing is approved, so the homepage shows no
   vehicles at all.
2. **I would not be told when somebody enquired.** The lead lands in a dashboard I have to remember
   to open.
3. **A buyer could not phone me.** No dealership on the platform has a contact number.

*Would I proudly show it to my customers?* The vehicle page and search, yes. The homepage, not until
it has cars on it.

None of that is a criticism of the software. All three are the marketplace not yet being switched on.

---

## Post-launch improvements

Valuable, and not blocking.

- **Analytics and error monitoring.** Neither is configured. Launching without error monitoring means
  the first production incident is reported by a customer.
- **Dealer dashboard Back button self-links** (above).
- **Dealer dashboard takes 2.5–5 s to populate.** Measured; not investigated.
- **`/search` LCP is 2 372 ms on localhost.** Worth measuring again from a real client.
- **Client JS is 1 971 kB across 55 chunks.** Not analysed for what is in it.
- **Backup and restore has never been rehearsed.** I cannot see your Supabase retention settings from
  inside the application. A backup nobody has restored is a hypothesis.
- **Screens for the four SQL-only operator tasks** (see Operations).
- **A console rejection still does not reach `/search`** unless the static policy file is edited too.
  They agree today only because both were updated by hand. The Founder Dashboard detects the drift —
  proved by introducing some — but the fix is manual.
- **`/design-system` is publicly reachable** in production. Harmless, and it is an internal reference.

---

## One thing I fixed during the audit

`verify-dealer-spotlight.mjs` publishes a temporary editorial slot and removes it in a `finally`. When
an earlier run was killed by a command timeout, the `finally` never fired and a **published
dealer-spotlight slot was left in the live database** — and the suite then failed permanently on a
duplicate key, poisoning itself.

I removed the residue, audited the database for other test data (none), and made the suite clear its
own leftovers before starting. A verification suite the manual tells an operator to run weekly must
survive having been interrupted, because sooner or later it will be.

That is the only change this audit made to the codebase.

---

## Verification status

All fourteen suites pass against this build: **486 checks.**

| Suite | Checks |
|---|---|
| homepage-merchandising | 78 |
| production-smoke | 46 |
| security-posture | 45 |
| journeys | 40 |
| dealer-migration | 38 |
| back-navigation | 36 |
| marketplace-trust | 36 |
| founder-dashboard | 33 |
| founder-curation | 27 |
| approval-workspace | 27 |
| import-execution | 22 |
| dealer-ownership | 22 |
| dealer-spotlight | 20 |
| operations-manual | 16 |

TypeScript clean. ESLint: 0 errors, 8 warnings (all unused-variable, none in application code paths).
Production build clean.

---

## What would change the verdict

Not engineering work. In order:

1. Set `NEXT_PUBLIC_APP_URL` to the production domain and rebuild. *(30 minutes)*
2. Configure an email provider and verify the sending domain — SPF, DKIM, DMARC. *(a few hours,
   mostly DNS propagation)*
3. Approve photographs until the homepage has cars on it. *(an hour at the console)*
4. Set contact details for the dealerships you are launching with. *(SQL, minutes)*
5. Set `CRON_SECRET` and schedule the jobs. *(30 minutes)*
6. Confirm `/api/health` returns `healthy`, and rehearse one restore. *(an afternoon)*

Then re-run this audit. I would expect it to pass.

---

## The personal question

**"If this were your life's work, would you be proud to launch SURF4CARS tomorrow?"**

Tomorrow, no — and I would be the one stopping it, over the sitemap alone. 278 canonical URLs pointing
at localhost is the kind of mistake that is invisible for a fortnight and then costs six months of
search ranking, and it is thirty minutes to fix. Launching into that would be choosing to be
embarrassed on purpose.

But that is a question about tomorrow, not about the platform. So let me answer the one underneath it.

Am I proud of the thing itself? Yes — and specifically of the parts nobody will ever see. The
marketplace refuses to publish a photograph nobody approved. It refuses to call a dealership verified
because they finished a form. It says "we are still working on getting a notification through to
them" instead of pretending an email was sent. It shows an empty homepage rather than a WRC rally car
captioned as a R95 000 hatchback — and it does that because somebody chose the harder behaviour every
single time the easier one would have looked identical from the outside.

That is rare, and it is worth more than any feature on the roadmap. Most marketplaces are built the
other way round and nobody notices until the trust is gone.

What I am not proud of is that three of the last four defects were found by luck rather than by
design. Every dealer profile on the platform 404'd, and it was caught by one assertion in a trust
suite testing something else entirely. A duplicate column, an ungranted grant, a race car on the
front page — each was invisible to the build, invisible to the types, invisible to eleven passing
suites. The tests are now good enough that I trust them, and honest enough that I do not trust them
completely, and I would rather say that plainly than sign a certificate implying otherwise.

So: I would not launch tomorrow. I would launch on Thursday, after somebody spends a day on six
things that need credentials rather than code — and I would be proud to put my name on what goes out.

The platform is finished. The marketplace is not switched on. Those are different problems, and only
one of them was ever mine to solve.
