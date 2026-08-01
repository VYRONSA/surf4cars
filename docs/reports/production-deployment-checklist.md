# Production deployment checklist — PRP-006 Phase 1

Every item is **Ready**, **Needs configuration** or **Blocked**. Nothing is marked Ready on an
assertion: the evidence column names how it was checked, and anything checked by reading code rather
than by observing behaviour says so.

Machine-checkable items are re-runnable:

```bash
node scripts/verify-production-readiness.mjs     # 55 checks against a production build
node scripts/verify-enquiry-notifications.mjs    # 65 checks against the live database
```

Last run: **55 passed, 0 failed, 4 awaiting configuration** and **65 passed, 0 failed**.

**Definitions.** *Ready* — verified working, nothing left to do. *Needs configuration* — the software
is finished; a value must be supplied or an account set up. *Blocked* — cannot proceed, and the
reason is named.

---

## 1. Environment variables

| Item | Status | Evidence |
|---|---|---|
| No secret has a default in code | Ready | `resolveEmailProvider` returns "no provider" rather than falling back; grep confirms no committed keys |
| Configuration validated at startup and on `/api/health` | Ready | `validateEnvironment()`; health returns 503 with the offending variable named |
| Service key never reaches the browser | Ready | Production bundle scanned at request time for the literal key — 0 occurrences |
| `.env.example` documents every variable | Ready | Was matched by the `.env*` ignore rule and had never been committed; exception added |
| `.env.local` not tracked | Ready | `git ls-files` — not present |
| **Production values uploaded to Vercel** | **Needs configuration** | Nothing to verify locally. `docs/deployment.md` lists the seven variables |
| **`NEXT_PUBLIC_APP_URL`** | **Needs configuration** | Currently localhost. A production build with localhost fails its own config check by design |

## 2. Email provider

| Item | Status | Evidence |
|---|---|---|
| Provider abstraction, swappable by env | Ready | Resend and SendGrid implemented; 65-check suite exercises send, timeout, bounce, retry |
| Failure classification drives retries | Ready | Permanent failures stop at attempt 1; transient escalate 5 min → 30 min → 2 h → stop |
| Unconfigured deployments hold rather than drop | Ready | Verified: enquiry taken with no provider is sent on the first sweep after one is configured |
| No secret in source | Ready | `EMAIL_API_KEY` only |
| **Provider account and API key** | **Needs configuration** | `EMAIL_PROVIDER` unset. Enquiries recorded and held; nobody notified |
| **Sending domain verified with the provider** | **Needs configuration** | Cannot be checked from here. An unverified domain is accepted then silently dropped — the platform would record `sent` for messages nobody receives |
| **Amazon SES** | **Needs configuration** | Not implemented; refused at configuration time naming the alternative. Use Resend or SendGrid |

## 3. Cron configuration

| Item | Status | Evidence |
|---|---|---|
| Retry endpoint exists and is authorised | Ready | Constant-time comparison; refuses when the secret is unset; 401 on a wrong secret |
| Endpoint answers GET | Ready | Vercel's scheduler issues GET. A POST-only route would have returned 405 every five minutes while the dashboard reported success |
| Accepts Vercel's `CRON_SECRET` name | Ready | Vercel injects the header only for a variable of exactly that name |
| `vercel.json` declares the schedule | Ready | `*/5 * * * *` against the retry path |
| **`CRON_SECRET` set in Vercel** | **Needs configuration** | Unset — the endpoint refuses the scheduler, so the immediate attempt is the only attempt |
| **Vercel plan permits 5-minute crons** | **Needs configuration** | Hobby allows one invocation per day, which makes the retry schedule meaningless. Pro, or an external scheduler |

## 4. Supabase production settings

| Item | Status | Evidence |
|---|---|---|
| All 21 expected tables present | Ready | `/api/health` compares the live database against `REQUIRED_TABLES` |
| 17 migrations applied and manifested | Ready | Manifest head matches what was pushed |
| RLS on every table holding personal data | Ready | With the public key: leads, lead_timeline, buyer_profiles, saved searches/vehicles, staff, documents, audit, notifications and rate-limit windows all return **0 rows** |
| Public key cannot write | Ready | Inserts into `leads`, `dealerships`, `enquiry_notifications` all refused with 42501 |
| Marketplace data readable, unpublished withheld | Ready | 229 of 330 vehicles visible; 101 hidden |
| **Project region matches deployment region** | **Needs configuration** | `vercel.json` pins Cape Town. If the Supabase project is not `af-south-1`, match the database instead — the round trips that matter are server-to-database |
| **Connection pooling for serverless** | **Needs configuration** | Supabase defaults. Not load-tested; see Risks below |

## 5. Storage buckets

| Item | Status | Evidence |
|---|---|---|
| All four buckets provisioned | Ready | vehicle-media, dealer-branding, licence-discs, vehicle-documents |
| Licence discs private | Ready | `public=false` — these are identity documents |
| Vehicle documents private | Ready | `public=false` |
| Vehicle media public | Ready | `public=true`, as a marketplace requires |
| **Upload size and MIME restrictions** | **Needs configuration** | Not verified. Set in the Supabase dashboard |

## 6. Authentication

| Item | Status | Evidence |
|---|---|---|
| Auth service reachable | Ready | `/api/health` |
| Gate actually runs | Ready | `src/proxy.ts`. It previously sat at the repo root while the app lives under `src/`, so it never ran and every protected route answered 200 unauthenticated |
| Protected routes redirect | Ready | `/dealer/*`, `/buyer/*`, `/operations/*` return 307 |
| Known proxy-bypass advisory closed | Ready | Next 16.2.9 → 16.2.12 |
| All auth screens exist | Ready | Sign in, sign up (buyer and dealer), forgot password, reset password, verify email |
| **Email templates and redirect URLs in Supabase** | **Needs configuration** | Confirmation and reset emails are sent by Supabase, not this codebase. Redirect URLs must list the production domain or every link 404s |
| **Password policy and session length** | **Needs configuration** | Supabase defaults |

## 7. Domain configuration

| Item | Status | Evidence |
|---|---|---|
| Canonical URL derives from one variable | Ready | `env.appUrl`; used by metadata, Open Graph and the dealer link inside notification emails |
| **Domain registered and pointed at Vercel** | **Needs configuration** | Nothing to verify from here |
| **TLS certificate issued** | **Needs configuration** | HSTS is inert until the site is served over TLS |
| **`robots.txt` and `sitemap.xml`** | **Needs configuration** | Neither exists. Not a launch blocker — gated routes already carry `robots: {index:false}` and return 307 — but a marketplace with no sitemap is harder to find. Deliberately not built: this programme's brief excludes feature work |

## 8. Security headers

| Item | Status | Evidence |
|---|---|---|
| Content-Security-Policy | Ready | Verified against a production build: zero violations across ten routes |
| X-Frame-Options / `frame-ancestors 'none'` | Ready | Was absent |
| X-Content-Type-Options | Ready | Was absent. Applies to API responses too |
| Referrer-Policy | Ready | Was absent. Also stops search query strings leaking to third parties via `Referer` |
| Permissions-Policy | Ready | Camera, microphone, geolocation, payment, USB all denied |
| HSTS | Ready | Two years, subdomains. `preload` deliberately omitted — hard to reverse, and a decision for once the domain is settled |
| Server does not advertise itself | Ready | `poweredByHeader: false` |
| **`script-src` retains `unsafe-inline`** | **Needs configuration** | A real weakening, documented in `next.config.ts`. Removing it needs per-request nonces threaded through every rendered document. The policy still blocks scripts loaded from unnamed origins, framing, foreign form targets and plugins |

## 9. CORS

| Item | Status | Evidence |
|---|---|---|
| No permissive CORS anywhere | Ready | No `Access-Control-Allow-Origin` is set by any route. Browsers therefore apply same-origin by default, which is the correct posture — every consumer of these APIs is this application |
| No public API surface intended for third parties | Ready | `api-strategy.ts` describes a partner API; none is implemented, so none is exposed |

## 10. Rate limiting

| Item | Status | Evidence |
|---|---|---|
| Enquiry endpoint limited | Ready | 10 per 10 minutes per address. Verified: 10 admitted, 11th refused with `retry-after`, other callers unaffected |
| Limit is durable across instances | Ready | Counted in one SQL statement. The in-memory default would have permitted 10 *per instance* |
| No personal data retained | Ready | Keys hashed before storage; no readable address in the table |
| Fails open | Ready | A store outage allows the request. The limiter guards a secondary risk; the endpoint is the platform's only conversion action |
| **Authenticated endpoints unlimited** | **Needs configuration** | Dealer and buyer APIs sit behind auth and are not limited. Rules are defined in `RATE_LIMIT_RULES`; wiring them is a small change if abuse appears |

## 11. Backups

| Item | Status | Evidence |
|---|---|---|
| Restore procedure documented | Ready | `docs/disaster-recovery.md` |
| **Backups enabled and retention set** | **Needs configuration** | Supabase defaults. Free tier retains little; a paid tier with point-in-time recovery is the difference between losing a day and losing a minute |
| **A restore has been performed** | **Blocked** | Never tested. An untested backup is a belief, not a backup — and this is the only Blocked item on this list that is genuinely engineering-adjacent. It requires a scratch project to restore into, which is an account action |

---

## Risks I am not able to close from here

1. **No load testing.** The platform has never served concurrent traffic. Serverless plus Supabase's
   default pooling is the usual first thing to break under a launch-day spike.
2. **No error aggregation.** The logger writes to stdout. In production that means Vercel's log
   viewer and no alerting — a failure at 02:00 is discovered by a dealer, not by us.
3. **The database is seeded with demonstration data.** 128 dealerships and 330 vehicles, of which a
   known subset carry `is_demonstration`. Going live means deciding what stays.
4. **An untested restore.** See above.

None of these is software to write. All four are decisions or account actions.
