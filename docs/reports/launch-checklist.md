# SURF4CARS — Launch Checklist

Three states only, as specified: **✅ Complete** · **⚠ Founder action required** · **⛔ Blocked**.

"Complete" means verified by a command in this repository, not believed. Every ⚠ names the exact
action. Every ⛔ names what is blocking it and who can unblock it.

**Verification:**

```bash
npm run build && npx next start -p 3100
APP_URL=http://localhost:3100 node scripts/verify-production-smoke.mjs   # 46
APP_URL=http://localhost:3100 node scripts/verify-security-posture.mjs   # 42
node scripts/verify-import-execution.mjs   # 22    node scripts/verify-dealer-ownership.mjs  # 22
node scripts/verify-dealer-migration.mjs   # 38    node scripts/verify-marketplace-trust.mjs # 36
```

---

## Infrastructure

| | Item | Evidence |
|---|---|---|
| ✅ | Production build succeeds | 101 static pages generated, tsc and eslint clean |
| ✅ | Health endpoint reports honestly | Returns 200 configured / 503 with the failing variable named. Reports "All 25 expected tables present" |
| ✅ | Security headers | CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — all read off a production build |
| ✅ | CSP drops `unsafe-eval` in production | Present in dev only; production `script-src 'self' 'unsafe-inline'` |
| ✅ | robots.txt | Serves, disallows `/api/ /dealer/ /operations/ /buyer/ /auth/`, points at the sitemap |
| ✅ | sitemap.xml | 278 URLs — 6 static, 229 vehicles, 43 dealers. Exactly matches the published count; names no guarded path |
| ✅ | Static page caching | `/` and `/sitemap.xml` served from cache (`s-maxage`), 16ms and 12ms median |
| ⚠ | `NEXT_PUBLIC_APP_URL` must be set **at build time** | It is a `NEXT_PUBLIC_` variable and is baked into the bundle. Setting it only as a runtime variable ships a build containing `localhost`. Vercel sets build-time env by default — confirm it is present there before the first deploy |
| ⚠ | Compression | Not verifiable locally; `next start` does not compress. Vercel compresses at the edge. Confirm `content-encoding: br` on the deployed origin |
| ⚠ | Vercel project settings | Region, Node version and build command are outside this repository. Choose a region close to Supabase (`eu-west-1`) — see Performance below |
| ⚠ | Cron scheduler | `vercel.json` cron or an external scheduler must POST `/api/v1/internal/notifications/retry` every 5 minutes with the secret. Not configured |
| ⛔ | PWA / manifest | Deliberately absent. Nothing references a manifest, so nothing 404s. Adding one changes product behaviour (install prompts) — a founder decision, not an engineering gap |

## Security

| | Item | Evidence |
|---|---|---|
| ✅ | Anonymous reads of tenant data | 16 tables probed — leads, buyer profiles, staff, ownership, imports, notifications, audit — all return nothing |
| ✅ | Anonymous writes | POST to 5 sensitive tables — all refused |
| ✅ | Column exposure | `owner_user_id`, `verification_note`, `subscription_package`, `lead_count_30d`, `created_by` all 401 to anon; public columns still readable |
| ✅ | Unpublished stock invisible | anon sees 229 vehicles, every one `published`. Drafts unreachable by id and by slug |
| ✅ | Dealer and operations APIs | Every endpoint 401/403 unauthenticated |
| ✅ | Page guards | `/dealer/*`, `/operations/*`, `/buyer` redirect; `/admin` 404 |
| ✅ | Ownership model | Claim reviewed by a human, transfer restricted to active team members, invitation tokens hashed and single-use, every refusal asserted |
| ✅ | Secrets | `.env*` gitignored, only `.env.example` tracked, no key patterns in tracked source |
| ✅ | Cross-tenant media write | Fixed and asserted (PCP-038 C2) |
| ✅ | Dealership enumeration (PCP-038 "M1") | **Closed in PCP-039.** Was: anon read 640 rows exposing all 128 dealership ids, 85 of them hidden. Now 43 — exactly the anon-visible set — and 0 hidden, at both the view and its base table. See below |
| ⚠ | Residual: `owner_user_id` readable by any signed-in account | Closing it needs the ownership lookup moved to a `security definer` function. Recorded in PCP-038 M4; a wrong change locks every dealer out |

### The M1 entry was wrong, and how

PCP-038 reported this as blocked, needing the `postgres` owner. The founder checked it against the
live database and found the reason it could not be fixed:

> `dealership_field_provenance` is a **VIEW**, not a table. It selects from `verification_claims`.

Postgres rejects `CREATE POLICY` and `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on a view. PCP-038 saw
those two failures, saw the same statements succeed on a table, and concluded "different owner". The
real difference was the object kind. That inference then travelled into three documents as a founder
action that was never needed.

**The exposure was real, and closing it took three parts** — the first attempt was also wrong:

- Revoking `anon` from the view broke the public dealer profile, which reads it with the anon key and
  fails closed, silently suppressing dealer contact details. And it did not work: the base table
  returned the same 128 ids on its own `using (true)` policy.
- The fix restores the grant, sets `security_invoker = true` on the view so it applies the caller's
  permissions rather than its owner's, and scopes `verification_claims_read` to claims about
  dealerships the caller can already see.

**Verified:** 43 ids visible, 0 hidden, at the view *and* the base table; service role unaffected;
dealer profile provenance read still 200. Three regression checks in `verify-security-posture.mjs`.

## Data

| | Item | Evidence |
|---|---|---|
| ✅ | Referential integrity | 0 orphaned media, 0 leads pointing at missing dealerships or vehicles, 0 import rows without a batch, 0 duplicate staff memberships, 0 vehicles with two primary photographs |
| ✅ | Branch/dealership integrity | Was 10 vehicles on another dealership's branch (8 published). Repaired; composite foreign key now prevents it |
| ✅ | Migrations in sync | Local and remote both 38, no drift |
| ⚠ | 2 duplicate VINs | One pair is two *published* listings at one dealership — two adverts for one car. Not constrained deliberately: the same VIN legitimately reappears when a car is resold. Enforce a partial unique index, or accept and report — founder decision |
| ⚠ | 80 published vehicles have no photograph | Photography programme, not engineering |
| ⚠ | 3 published vehicles have photographs but no primary | They render "Photographs to follow" while the gallery is full |
| ⚠ | Demonstration records | 2 dealerships flagged `is_demonstration`; their owner accounts sit on `capemotors.co.za`, a domain SURF4CARS does not own. Move to `demo.surf4cars.co.za` before production credentials are issued |

## Email & notifications

| | Item | Evidence |
|---|---|---|
| ✅ | Provider abstraction | resend / sendgrid / mock, one API key variable; `mock` refused when `NODE_ENV=production` |
| ✅ | Retry queue | Immediate, +5 min, +30 min, +2 h; permanent failures stop |
| ✅ | Honest buyer messaging | The confirmation never claims a dealer was notified unless delivery succeeded |
| ✅ | Enquiries survive being unconfigured | Held and sent on the first sweep after a provider is set |
| ⚠ | `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` | Not set. Enquiries are recorded and visible to dealers; nobody is notified |
| ⚠ | Sending domain verification | Must be verified with the provider or messages are accepted and silently dropped |
| ⚠ | `NOTIFICATION_CRON_SECRET` (or `CRON_SECRET`) | Unset — a notification that fails its first attempt is never retried |

## Domains, legal, support

| | Item | Evidence |
|---|---|---|
| ✅ | Legal pages exist and render | `/legal/terms`, `/legal/privacy`, `/legal/cookies` |
| ⚠ | Legal wording review | Written by engineering. Needs a person who can be accountable for it |
| ⚠ | Production domain and DNS | Outside this repository |
| ⚠ | Cookie domain and auth redirect URLs | Supabase Auth redirect allow-list must include the production origin, or sign-in and password reset fail after deploy |
| ⚠ | Support channel | `/contact` renders. Where enquiries to SURF4CARS itself go is undecided |

## Backups & recovery

| | Item | Evidence |
|---|---|---|
| ✅ | Schema is reproducible | 38 migrations in git; an empty database can be rebuilt from them |
| ✅ | Migration drift detectable | `npx supabase migration list` compares local and remote |
| ⛔ | Database backup/restore **demonstrated** | **Not done.** Supabase provides automated backups on paid plans; verifying a restore requires a second project and the dashboard. Cannot be demonstrated from this repository |
| ⛔ | Storage backup/restore demonstrated | Same — bucket contents are not in git |
| ⚠ | RTO / RPO | **Undefined.** Cannot be stated honestly without knowing the Supabase plan's backup frequency and retention. Anything written here without that would be a guess |
| ⚠ | Environment recovery | `.env.example` documents every variable; the values live only in the deployment platform. Confirm they are recorded somewhere a person can reach in an incident |

## Performance

Measured against a production build on a development machine to Supabase `eu-west-1`. **These
numbers do not predict production** — network distance to the database dominates — but the shape is
informative.

| Route | Median | Cacheable |
|---|---|---|
| `/` | **16ms** | Yes — `s-maxage=31536000` |
| `/sitemap.xml` | **12ms** | Yes |
| `/vehicle/[slug]` | **1 766ms** | No — `force-dynamic`, `no-store` |
| `/dealers/[slug]` | **1 821ms** | No — `force-dynamic` |
| `/search` | **3 409ms** | No |

| | Item | Evidence |
|---|---|---|
| ✅ | Static routes are fast and cached | 16ms and 12ms |
| ⚠ | Dynamic routes are uncached by design | `force-dynamic` means every view hits the origin and the database. That is a deliberate freshness choice — a buyer never sees a stale price — and its cost is the figures above. Whether to trade some freshness for ISR is a founder decision |
| ⚠ | Co-locate the deployment with the database | The single largest available improvement. Deploy to a Vercel region matching Supabase's `eu-west-1` |
| ⛔ | Production timings | Cannot be measured until deployed |

## Dealer onboarding & import

| | Item | Evidence |
|---|---|---|
| ✅ | Import engine | 38 checks — mapping, parsing, validation, duplicates, scale to 1 000 rows |
| ✅ | Import execution, undo and publish | 22 checks against the real database, including cleanup |
| ✅ | Import wizard reachable | `/dealer/inventory/import`, in the navigation |
| ✅ | Ownership claim, transfer, invite, accept | 22 checks, every refusal asserted |
| ✅ | Contact and branch management | Dealers manage phones, emails, websites, WhatsApp and branches without SQL |
| ⛔ | Media provenance for imported photographs | **Founder decision.** `provenance` allows `dealer \| library \| manufacturer`. A migrated photograph fits none cleanly. The wrong choice is invisible — it renders identically and misstates provenance on every migrated image. **The photograph pipeline is blocked on this** |
| ⚠ | No dealership has credentials | The path exists and is proven; nobody has used it. 4 of 269 accounts have ever signed in |

## Analytics & monitoring

| | Item | Evidence |
|---|---|---|
| ✅ | Structured logging | `createLogger` with levels; `LOG_LEVEL` documented |
| ✅ | Health endpoint suitable for uptime checks | Returns 503 with a named reason |
| ⚠ | Error reporting | No Sentry or equivalent wired. Integration points exist; the provider is a founder choice |
| ⚠ | Uptime monitoring | Point a monitor at `/api/health` |
| ⚠ | Product analytics | None. A deliberate absence — PCP-032 removed fabricated metrics rather than inventing a source |

---

## Summary

| State | Count |
|---|---|
| ✅ Complete | 34 |
| ⚠ Founder action required | 24 |
| ⛔ Blocked | 5 |

**No ⛔ is a security finding.** The remaining five are a founder decision (media provenance), a
product decision (PWA), and three things that cannot be demonstrated without production
infrastructure (backup restore, storage restore, production timings).
