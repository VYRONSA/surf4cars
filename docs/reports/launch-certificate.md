# SURF4CARS — Launch Certificate

**Date:** 2026-08-02 · **Programme:** PCP-039 · **Basis:** 206 automated checks, all passing, plus
direct measurement against a production build and the live database.

```bash
npm run build && npx next start -p 3100
APP_URL=http://localhost:3100 node scripts/verify-production-smoke.mjs   # 46 ✓
APP_URL=http://localhost:3100 node scripts/verify-security-posture.mjs   # 42 ✓
node scripts/verify-import-execution.mjs   # 22 ✓   node scripts/verify-dealer-ownership.mjs  # 22 ✓
node scripts/verify-dealer-migration.mjs   # 38 ✓   node scripts/verify-marketplace-trust.mjs # 36 ✓
npx tsc --noEmit && npx eslint src/                                      # clean
```

---

## Engineering — **COMPLETE**

Every dealer-facing and customer-facing path a launch needs is built and verified.

- Import: engine, executor, undo, publish, CSV report, wizard. 60 checks across two suites, run
  against the real database because every failure mode here is a constraint and a mock cannot fail one.
- Ownership: claim, review, transfer, invite, accept, revoke, remove, audit. 22 checks, and the
  refusals are asserted as hard as the successes.
- Contact and branch management, including the refusal to close a branch while stock points at it —
  `branch_id` cascades, so the obvious implementation would have deleted the branch's inventory.
- Public marketplace: homepage, search, vehicle detail, dealer profile, enquiry — all render, no dead
  controls, no placeholder wording, no roadmap promises.
- robots.txt and sitemap.xml, the sitemap built from the published read path so it lists exactly 229
  vehicles against 229 published.

Not built, and deliberately: the photograph pipeline (blocked on a founder decision, below), PWA
manifest (a product decision), and the seven PCP-037 priorities recorded as not attempted in
`pcp037-engineering-complete.md`. None of them blocks a launch; all are named rather than implied.

## Security — **COMPLETE, less one statement**

PCP-038 found two Critical defects and both are fixed and regression-tested. PCP-039 found and fixed
a third that PCP-038's own fix had caused.

- **C1** — a dealer's photograph was reported as saved and silently discarded. `provenance` was
  omitted from the insert, every write failed, and a substring match on the error redirected it to a
  local file while returning success. Invisible in production by construction.
- **C2** — cross-tenant media write, unexploitable only because C1 broke every insert. Fixing either
  alone would have been worse than fixing neither.
- **PCP-039** — the health check read a 401 as a missing table and called `dealerships` and
  `inventory_vehicles` absent, taking the deployment to `unhealthy`. On a host that gates traffic on
  health, a correct security change would have taken the site down. Found only by building for
  production and calling the endpoint.

Verified sound: 16 tenant tables invisible to anonymous callers, all anonymous writes refused, every
dealer and operations endpoint 401/403, every guarded page redirecting, unpublished stock unreachable
by id and by slug, invitation tokens hashed and single-use, no secrets in the repository.

**One finding remains open: M1.** It is one SQL statement, it is written out in the checklist, and it
cannot be run from here — proven, not assumed: two ownership-requiring statements fail on that one
table while the identical statement succeeds on a control table in the same migration lineage.

## Infrastructure — **NOT COMPLETE** (outside this repository)

Complete here: production build, security headers verified off a real build, health endpoint,
robots, sitemap, static caching.

Outside here, and genuinely so: the Vercel project and its region, the production domain and DNS,
the Supabase Auth redirect allow-list, the cron scheduler, and edge compression. None of these can be
configured or verified from a repository, and none is an engineering gap.

## Data — **NOT COMPLETE** (needs real dealerships)

Integrity is sound: no orphans, no broken references, no duplicate memberships, and the
cross-dealership branch defect is repaired and now prevented by a composite foreign key.

What is missing is real data, not correct data. 0 of 128 dealerships have supplied a telephone
number or an email address. 80 published vehicles have no photograph. 40 buyer accounts exist and
every one is seeded on `surf4cars-demo.co.za`. Two duplicate VINs remain, deliberately unconstrained
because the same VIN legitimately reappears when a car is resold.

## Operations — **NOT COMPLETE** (needs configuration and people)

The notification engine, retry queue and honest buyer messaging are built and tested. No email
provider is configured, no sending domain is verified, and no scheduler drains the retry queue — so
today an enquiry is recorded and shown to the dealer, and nobody is told. The platform says exactly
that to the buyer rather than claiming otherwise, which is the correct behaviour while unconfigured
and not a substitute for configuring it.

Error reporting and uptime monitoring have integration points and no provider.

---

## Remaining founder decisions

Only decisions engineering cannot make.

1. **Media provenance for an imported photograph.** `inventory_vehicle_media.provenance` allows
   `dealer | library | manufacturer`, with no default, because PCP-015D decided that writing an image
   requires deciding where it came from. A migrated photograph fits none: the dealer supplied it, via
   a third-party feed nobody has verified. Writing `'dealer'` slightly overclaims; adding `'imported'`
   is honest and needs a fourth gallery label. **The photograph pipeline is blocked on this**, and the
   wrong answer is invisible — it renders identically and misstates provenance on every migrated image.

2. **Duplicate VINs.** One pair is two published listings at one dealership: two adverts for one car.
   A global unique index would reject honest data, because a VIN legitimately reappears on resale.
   Enforce a partial unique index (at most one published listing per VIN per dealership), or accept
   and report.

3. **Freshness versus speed on dynamic pages.** `/vehicle`, `/dealers` and `/search` are
   `force-dynamic`, so a buyer never sees a stale price and every view costs a database round trip
   (1.8s–3.4s measured from a development machine; production will differ). Trading some freshness for
   ISR is a business call about what a wrong price costs.

4. **Whether to ship a PWA manifest.** Absent today, referenced by nothing, breaking nothing. Adding
   it changes product behaviour.

5. **Legal wording.** The terms, privacy and cookie pages were written by engineering and need
   someone accountable for them.

6. **Support destination.** `/contact` renders; where those messages go is undecided.

---

## Recommendation

# READY AFTER FOUNDER ACTIONS

Not *ready for production*, because one security finding is open and no dealership can be notified of
an enquiry. Not *not ready*, because neither is an engineering defect and both have a defined,
short path.

**The blocking actions, in order:**

1. **Run the M1 policy statement** as `postgres` in the Supabase SQL editor
   (`docs/reports/launch-checklist.md`, Security), then `node scripts/verify-security-posture.mjs`.
2. **Configure email** — `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`, and verify the sending
   domain with the provider. Without this an enquiry reaches nobody.
3. **Set `NOTIFICATION_CRON_SECRET`** and point a scheduler at
   `/api/v1/internal/notifications/retry` every five minutes, or a first-attempt failure is permanent.
4. **Set `NEXT_PUBLIC_APP_URL` at build time** to the production origin, and add that origin to the
   Supabase Auth redirect allow-list, or sign-in and password reset break after deploy.
5. **Decide the media provenance question**, which unblocks the photograph pipeline.

**Everything after that is operational, not engineering:** onboarding real dealerships, collecting
real contact details, commissioning photography, and acquiring buyers.

### One thing this certificate does not claim

It certifies that the platform is safe and correct to deploy. It does not claim anyone should
migrate a 250-vehicle dealership onto it on day one. PCP-036 answered that question **NO**, and four
of its six reasons are now cleared; the two that remain — no notifications configured, and no buyer
audience — are the two this document lists as founder actions and operational work. A dealership that
moves its stock onto a marketplace with no buyers has paid a switching cost for nothing, and no amount
of engineering changes that.
