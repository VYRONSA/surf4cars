# Disaster recovery — PRP-006 Phase 4

What to do when something has gone wrong in production, written to be followed by someone who is
tired and under pressure.

**One thing to read first.** The most valuable data on this platform is `leads` — enquiries from real
buyers to real dealerships. Everything else can be rebuilt: vehicles can be re-uploaded, editorial
placements re-curated, the application redeployed from git. A lost enquiry is a person who contacted
a dealership and never heard back, and there is no way to reconstruct it. **Every procedure below is
ordered to protect `leads` first.**

---

## 1. Backup strategy

### What is backed up, and by whom

| Data | Where | Backed up by | Status |
|---|---|---|---|
| Database (all 21 tables) | Supabase Postgres | Supabase automated backups | **Needs configuration** — retention depends on plan |
| Uploaded media and documents | Supabase Storage, 4 buckets | Supabase | **Needs configuration** — verify storage is included in the plan's backup |
| Application code | GitHub | git | Ready |
| Schema | `supabase/migrations/` in git | git | Ready — the schema is reproducible from an empty database |
| Environment variables | Vercel | Nothing | **Needs configuration** — see below |

### The gap nobody notices until it matters

**Environment variables are not backed up anywhere.** They exist only in Vercel's dashboard. If that
project is deleted, the Supabase keys can be regenerated but the *set of variables and their values*
is gone, and reconstructing it under pressure is how a service key ends up in a Slack message.

Keep a copy in a password manager, not a file. `.env.example` records which variables exist; it must
never record what they are.

### Retention: what to actually choose

Supabase's free tier keeps daily backups for a short window and offers no point-in-time recovery.
For a marketplace taking real enquiries that is the difference between **losing a minute** and
**losing a day**. Point-in-time recovery is the single most valuable paid feature for this platform,
because the realistic disaster is not the database exploding — it is a bad `delete` or a bad
migration at 15:00 that nobody notices until 17:00.

---

## 2. Restore procedure

### Before you restore anything

1. **Stop writes.** Put the site into maintenance, or remove the Vercel deployment's environment
   variables so it fails closed. Restoring underneath a live application means the restore races with
   new writes and you end up with neither state.
2. **Take a backup of the broken state.** It is evidence, and occasionally the broken state contains
   rows the backup does not.
3. **Write down the target timestamp** before you open the restore dialogue. Choosing it in the
   dialogue, under pressure, is how people restore to the wrong hour.

### Restoring the database

Supabase dashboard → Database → Backups. Restore to a **new project** rather than over the top of the
live one whenever the fault is not total: it lets you compare, and it keeps the broken state
available. Then either repoint `NEXT_PUBLIC_SUPABASE_URL` and the keys at the restored project, or
export the specific tables and copy them back.

Order to verify after any restore:

1. `leads` and `lead_timeline` — row counts against what you expected
2. `enquiry_notifications` — any row in `pending`, `retrying` or `not_configured` will be picked up
   by the next sweep, so a restore can cause a **re-send** of notifications already delivered. If the
   restore rolls back past a send, set those rows to `sent` manually or accept the duplicates
3. `dealerships`, `inventory_vehicles` — the marketplace
4. `/api/health` — table and bucket presence

### Restoring into an empty database

The schema is fully reproducible:

```bash
npx supabase db push --include-all
```

17 migrations, listed in `src/config/migrations.ts`. This gives you the structure, not the data.

### Restoring storage

Buckets and their public/private settings are created by migration. Their **contents** are not in
git. If media is lost and the backup does not include storage, listings lose their photographs and
dealers must re-upload — recoverable, embarrassing, not fatal. Licence discs and vehicle documents
are **not** recoverable this way, and they are identity documents, so confirm storage is in the
backup plan before launch rather than after.

---

## 3. Rollback plan

### Application rollback — the easy case

Vercel keeps every previous deployment. Dashboard → Deployments → the last known-good one →
**Promote to Production**. Takes under a minute and needs no build.

Do this **first** whenever the fault appeared with a deploy. Diagnose afterwards. The instinct to
find the bug before rolling back is the reason outages last hours instead of minutes.

### The thing that does not roll back

**Migrations.** Promoting an old deployment reverts the code and leaves the schema where it is. That
asymmetry is the sharp edge in this system:

- **Additive migrations** — new table, new nullable column — are safe. Old code ignores them.
  Every migration in this repository so far is additive.
- **Destructive migrations** — dropping or renaming a column, tightening a constraint — are not.
  Old code queries a column that no longer exists and every request fails.

So: **a rollback is only safe if the migrations since the bad deploy were additive.** Check
`supabase/migrations/` for anything since the last good deploy before promoting. If a destructive migration
is involved, you are doing a database restore, not a rollback — go to section 2.

The practical rule for the future: never combine a destructive migration with an application change
in one deploy. Ship the code that tolerates both shapes, deploy it, then migrate.

### Rolling back configuration

Changing an environment variable in Vercel requires a redeploy to take effect. The exception worth
knowing: **removing `EMAIL_PROVIDER` stops all sending immediately at the next request** and
enquiries are held rather than lost, then delivered when it is restored. That is the correct lever
to pull if the platform starts sending something wrong — it degrades honestly instead of failing.

---

## 4. Failed deployment recovery

| Symptom | Most likely cause | Action |
|---|---|---|
| Build fails on Vercel, succeeds locally | A missing environment variable, or a case-sensitive import path — Windows is case-insensitive, Vercel's Linux is not | Read the build log; the failing module is named |
| Deploy succeeds, every page 500s | `SUPABASE_SECRET_KEY` missing or wrong | `/api/health` names it. Fix and redeploy |
| Deploy succeeds, pages render, no data | Migrations not applied to the production project | `npx supabase db push`. Health reports "reachable but not migrated" |
| Static assets 404 or execute as `text/plain` | Stale or partial build output | Redeploy with the build cache cleared. This exact symptom was produced during PRP-006 by a server serving old HTML against a new build |
| Everything works, nobody gets email | `EMAIL_PROVIDER` unset, or the sending domain is unverified | Founder dashboard card names which. Enquiries are held, not lost |
| Cron shows success, queue never drains | Job pointed at the wrong method or the secret is unset | Response code 405 or 401 respectively |

**If a deployment cannot be fixed in fifteen minutes, promote the last good one.** The enquiry path is
the thing to protect, and it is better served by yesterday's code than by an hour of debugging.

---

## 5. Database recovery scenarios

### Accidental deletion of rows

The realistic one. `leads` rows deleted by a bad query or an over-broad cleanup script.

1. Do **not** write anything else to the table.
2. Point-in-time recovery to just before the deletion, into a new project.
3. Export the affected rows and copy them back into production.

Restoring the *whole database* to that point would also roll back every legitimate enquiry received
since, which for this platform is usually a worse outcome than the original deletion. **Restore the
rows, not the database.**

### A bad migration

Every migration here is additive, so the usual answer is a corrective migration forward rather than a
restore. Write it, test it against a restored copy, then apply it. Rolling the schema backwards while
a live application depends on it is more dangerous than the fault usually is.

### Corruption or total loss of the Supabase project

1. New project, same region.
2. `npx supabase db push --include-all` — the schema returns from git.
3. Restore data from the most recent backup.
4. Update the Supabase URL and keys in Vercel; redeploy.
5. Re-verify with `/api/health`, then run `docs/reports/production-smoke-test.md` in full.

Recovery time is dominated by step 3. Everything else is minutes.

### Losing the notification queue

`enquiry_notifications` is derived state — the enquiries themselves are in `leads`. If the
notification table is lost, no enquiry is lost; what is lost is the record of what was already sent.
Re-queueing would email dealerships about enquiries they have already received, which is annoying but
not harmful; doing nothing means recent enquiries are never announced.

Prefer re-queueing only rows for leads created in the last 24 hours, and tell the dealerships
concerned. This is the one place where a duplicate is better than a silence.

---

## What has and has not been tested

| Procedure | Tested |
|---|---|
| Schema reproduction from migrations | **Yes** — 17 migrations applied to the live project during development |
| Application rollback | No — no previous production deployment exists yet |
| Database restore | **No** |
| Storage restore | **No** |

An untested restore is a belief, not a backup. Before public launch, restore one backup into a
scratch project and confirm the row counts. It takes half an hour and it is the only way to find out
whether the backup plan you are paying for includes the things you assumed it did.
