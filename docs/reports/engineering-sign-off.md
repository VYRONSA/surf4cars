# SURF4CARS — Final Engineering Sign-Off

**Date:** 2026-08-02 · **Basis:** 209 automated checks, all passing, run against the live database
and a production build immediately before signing.

```bash
npm run build && npx next start -p 3100
APP_URL=http://localhost:3100 node scripts/verify-production-smoke.mjs   # 46 ✓
APP_URL=http://localhost:3100 node scripts/verify-security-posture.mjs   # 45 ✓
node scripts/verify-import-execution.mjs   # 22 ✓   node scripts/verify-dealer-ownership.mjs  # 22 ✓
node scripts/verify-dealer-migration.mjs   # 38 ✓   node scripts/verify-marketplace-trust.mjs # 36 ✓
npx tsc --noEmit && npx eslint src/                                      # clean
```

---

## The correction that prompted this sign-off

PCP-038 recorded a Medium finding, "M1", as **blocked**, requiring the founder to run a policy
statement as `postgres`. It travelled into four documents in that form.

It was wrong, and the founder found it by checking the live database rather than the report:

> `dealership_field_provenance` is a **VIEW**, not a table. It selects from `verification_claims`.

Postgres rejects `CREATE POLICY` and `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on a view. The audit
observed exactly those two failures, observed the same statements succeed on a table, and inferred
the only difference it had thought to test — ownership. The real difference was the object kind.

**Worth stating plainly, because it is the more useful lesson than the fix:** that conclusion was
reached from real evidence, correctly gathered, and it was still wrong. Two observations and one
control felt like proof. It became a founder action nobody needed, in four documents, for two
programmes.

**The exposure was real, and it was still open.** Re-measured before touching anything: an anonymous
caller read 640 rows and 128 distinct dealership ids, 85 of them dealerships the marketplace does not
show. So the entry could not simply be deleted as retired — it had to be diagnosed properly and
closed.

**The first attempt at the real fix was also wrong**, and is recorded in the migration history rather
than rewritten out of it. Revoking `anon` from the view looked minimal and certain. It:

- broke the public dealer profile, which reads that view with the anon key and **fails closed** —
  silently suppressing a dealership's genuine telephone number and website the day one is supplied,
  invisible today only because none has supplied one; and
- did not close the leak, because `verification_claims` returned the same 128 ids to `anon` on its
  own `for select using (true)` policy.

**What closed it** — three parts, because fewer did not work:

1. Restore `anon`'s grant on the view; the dealer profile legitimately needs it.
2. `alter view … set (security_invoker = true)` — a view does not inherit its base table's RLS unless
   told to, so a policy underneath would have had no effect on an anonymous reader.
3. Scope `verification_claims_read` to claims whose subject is a dealership the caller can already
   see, deferring to `dealerships_public_read` rather than restating the visibility rule.

**Verified after:** 43 distinct dealership ids at both the view and the base table — exactly the
anon-visible set — and **0 hidden**. Service role still reads all 128 for the Quality Centre and
Verification Workspace. The dealer profile's provenance read still returns 200. Three regression
checks now assert all of it.

---

## Engineering sign-off

| Area | State |
|---|---|
| **Engineering** | ✅ Complete |
| **Security** | ✅ Complete — no open findings |
| **Data integrity** | ✅ Complete — correct; incomplete only in the sense of needing real data |
| **Infrastructure** | ⚠ Configuration outside this repository |
| **Operations** | ⚠ Configuration and people |

### What was verified, live, today

- **Access control** — 16 tenant tables invisible to anonymous callers; every anonymous write
  refused; every dealer and operations endpoint 401/403; every guarded page redirecting; `/admin` 404.
- **Data exposure** — `owner_user_id`, `verification_note`, `subscription_package`, `lead_count_30d`
  and `created_by` all refused to anon while the public marketplace still renders unchanged.
- **Unpublished stock** — anon sees 229 vehicles, every one published; drafts unreachable by id and
  by slug; the sitemap lists exactly 229, never one more.
- **Dealership enumeration** — closed at the view and its base table, asserted both ways.
- **Ownership** — claim, transfer, invite, accept, revoke, remove and audit, with every refusal
  asserted: transfer to a non-member, transfer by a non-owner, acceptance by the wrong account,
  replay of a used link, removal of the owner, rejection without a reason.
- **Import** — plan, execute, undo, publish and report, run against the real database with cleanup as
  the assertion.
- **Referential integrity** — no orphans, no broken references, no duplicate memberships, no vehicle
  on another dealership's branch (repaired, and now prevented by a composite foreign key).
- **Truthfulness** — no fabricated claims, no roadmap promises, no invented specifications.

---

## Genuine remaining launch blockers

Only these. Each is configuration or a business decision — none is missing engineering.

| # | Blocker | Who | Why it blocks |
|---|---|---|---|
| 1 | **Email provider + verified sending domain** | Founder | Without it an enquiry is recorded and shown to the dealer and **nobody is told**. The platform says so honestly to the buyer, which is correct behaviour while unconfigured and not a substitute for configuring it |
| 2 | **Cron scheduler + `NOTIFICATION_CRON_SECRET`** | Founder | A notification that fails its first attempt is never retried |
| 3 | **`NEXT_PUBLIC_APP_URL` at build time, and the Supabase Auth redirect allow-list** | Founder | It is baked into the bundle; a runtime-only value ships `localhost`. Without the allow-list entry, sign-in and password reset break after deploy |
| 4 | **Media provenance decision** | Founder | `provenance` allows `dealer \| library \| manufacturer`. A migrated photograph fits none cleanly. **The photograph pipeline is blocked on this**, and the wrong answer is invisible — it renders identically and misstates provenance on every migrated image |
| 5 | **Real dealer contact details** | Operational | 0 of 128 dealerships have a telephone number or email |
| 6 | **Real photography** | Operational | 80 published vehicles have no photograph |
| 7 | **Dealer onboarding and buyers** | Operational | The ownership path is built and proven; 4 of 269 accounts have ever signed in, and all 40 buyer accounts are seeded |

**Not blockers, recorded so they are not rediscovered as surprises:** two duplicate VINs (deliberately
unconstrained — a VIN legitimately reappears on resale); `owner_user_id` readable by any signed-in
account (closing it needs the ownership lookup moved to a `security definer` function, and a wrong
change locks every dealer out); dynamic pages uncached by design (freshness over speed, measured at
1.8–3.4s from a development machine, which does not predict production); no PWA manifest; legal
wording written by engineering and needing an accountable owner.

---

## Sign-off

**The platform is engineering-complete and safe to deploy.** There are no open security findings, no
known engineering defects, and no engineering work standing between the current state and a
production deployment.

Items 1–3 above are configuration and should be done before the first real enquiry. Item 4 is a
decision that unblocks the photograph pipeline. Items 5–7 are the operational work of launching a
marketplace.

### What this sign-off does not claim

It does not claim a 250-vehicle dealership should migrate on day one. PCP-036 answered that **NO**,
and four of its six reasons are cleared; the two that remain — no notifications configured, and no
buyer audience — are items 1 and 7 above. A dealership that moves its stock onto a marketplace with
no buyers has paid a switching cost for nothing, and no amount of engineering changes that.

It also does not claim the audits were right first time. Two findings in this programme were
initially misdiagnosed and one was a regression introduced by a correct security fix. Each was caught
by measuring again rather than by re-reading what had been written — including M1, which was caught
by the founder and not by me. The regression suites exist so the next such error is caught by a
command rather than by a person noticing.
