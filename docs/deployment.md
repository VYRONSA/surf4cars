# Deploying SURF4CARS

What `vercel.json` says and why, plus everything that must be true before a deploy is a launch
rather than a publish.

## `vercel.json`

```json
{
  "regions": ["cpt1"],
  "crons": [{ "path": "/api/v1/internal/notifications/retry", "schedule": "*/5 * * * *" }]
}
```

**`regions: ["cpt1"]`** — Cape Town. Every buyer, every dealership and the Supabase project are in
South Africa. Serving from Washington adds a round trip to every server-rendered page for no benefit.
If the Supabase project is **not** in `af-south-1`, this is the wrong region and should match the
database instead: the round trips that matter are server-to-database, not browser-to-server.

**`schedule: "*/5 * * * *"`** — drains the notification retry queue. **This requires a Vercel Pro
plan.** Hobby permits one cron invocation per day, which would turn a five-minute retry into a
next-day retry and make the 5 min / 30 min / 2 h schedule meaningless. If the account is on Hobby,
either upgrade or point an external scheduler at the same URL — the endpoint has no Vercel-specific
dependency.

## The cron secret

Vercel injects `Authorization: Bearer $CRON_SECRET` into scheduled requests **only** when an
environment variable named exactly `CRON_SECRET` exists. The endpoint accepts either that or
`NOTIFICATION_CRON_SECRET`.

Set `CRON_SECRET` in Vercel and the built-in authentication works with no further wiring. Set neither
and the endpoint refuses every request — including the cron's — so the queue never drains and the
first delivery attempt becomes the only one.

The endpoint answers GET as well as POST, because the scheduler issues GET. A cron pointed at a
POST-only route returns 405 every five minutes while the Vercel dashboard reports the job as
succeeding.

## Environment variables to set in Vercel

Copy from `.env.example`. Production values only; nothing has a default in code.

| Variable | Scope | Consequence if missing |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all | Nothing works |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | all | Nothing works |
| `SUPABASE_SECRET_KEY` | server | Every server read fails; enquiries are refused with an honest error |
| `NEXT_PUBLIC_APP_URL` | all | Canonical URLs, Open Graph and the dealer link inside notification emails fall back to localhost |
| `EMAIL_PROVIDER` / `EMAIL_API_KEY` / `EMAIL_FROM` | server | Enquiries recorded and held; nobody notified. Sent on the first sweep once configured |
| `CRON_SECRET` | server | Retry endpoint disabled — one delivery attempt only |
| `NOTIFICATION_MAX_ATTEMPTS` | server | Optional; defaults to 4 |

`NEXT_PUBLIC_APP_URL` must be `https://` and must not contain `localhost`, or the production build
fails its own configuration check — see `validateEnvironment()` and `/api/health`.

## Before the first deploy

1. **Run the migrations against the production database.** `npx supabase db push`. The build does not
   run them, and `/api/health` reports a database that is reachable but not migrated.
2. **Verify the sending domain with the email provider.** An unverified domain is accepted by the
   API and then silently dropped — the platform would record `sent` for messages nobody receives.
3. **Point the production domain at Vercel and confirm TLS.** HSTS is sent with a two-year max-age;
   browsers ignore it over plain HTTP, so it only takes effect once TLS is live. It is deliberately
   sent **without** `preload`, which is hard to reverse and is a decision to take once the domain is
   settled.
4. **Check `/api/health`.** It reports configuration issues, missing tables and missing buckets.

## After the first deploy

Work through `docs/reports/production-smoke-test.md`. It is written to be executed by a person
against the live site, because the failures that matter after a deploy — a wrong environment
variable, a missing bucket policy, a domain that does not resolve — are precisely the ones no test
run against localhost can see.
