# PCP-038 — Security, Data Integrity & Production Audit

**Re-run the evidence:**

```bash
npm run dev                                  # the HTTP checks need a running server
node scripts/verify-security-posture.mjs     # 42 — RLS, column exposure, route auth, integrity
node scripts/verify-import-execution.mjs     # 22    node scripts/verify-dealer-ownership.mjs   # 22
node scripts/verify-dealer-migration.mjs     # 38    node scripts/verify-marketplace-trust.mjs  # 36
npx tsc --noEmit && npx eslint src/ && npm run build
```

All green at the time of writing. Everything below was measured against the live database or the
running application. Where something could not be verified, it says so.

---

## Critical

### C1 — A dealer's photograph was reported as saved and silently discarded — **FIXED**

`addVehicleMedia` omitted the `provenance` column. That column is `not null` with no default,
deliberately: PCP-015D removed the default so that writing an image forces a decision about where it
came from. So **every insert through that path failed**.

The failure was then swallowed. `isMissingInventoryTableError` returned true for any message
containing `inventory_vehicle_`, and Postgres names the relation in every constraint violation:

```
null value in column "provenance" of relation "inventory_vehicle_media" violates not-null constraint
```

The service read that as "the database has not been migrated", fell back to a local JSON file, and
returned success. **A dealer added a photograph, was told it worked, and it was never stored.** On a
serverless deployment the local file does not survive the request.

This breaks both rules the platform is built on — *never claim success*, *never silently discard
customer data* — through a substring match.

That predicate guarded **19 call sites** across the inventory service, so the same swallow applied to
RLS denials, unique violations and foreign-key violations. Narrowed to genuinely missing relations,
with constraint violations excluded first so they reach the caller.

*Proof:* a raw insert reproducing the exact payload returned `23502 null value in column "provenance"`,
and that message satisfies the old predicate.

### C2 — Cross-tenant write on vehicle media — **FIXED**

`addVehicleMedia(dealershipId, vehicleId, …)` never checked that the vehicle belonged to the
dealership. The route authorises the caller for `dealershipId`; the vehicle id arrives in the URL
path and was trusted. An authenticated dealer could attach a photograph to **any** vehicle on the
platform.

It was not exploitable when found — only because C1 meant every insert failed. **Fixing C1 without
fixing C2 would have opened it**, which is why they are reported together. An ownership lookup now
precedes the write.

*Proof:* attempted live against another dealership's published vehicle; the write is now refused with
"That vehicle does not belong to this dealership."

---

## High

### H1 — A vehicle could sit on another dealership's branch — **FIXED**

`inventory_vehicles` has two independent foreign keys — `dealership_id` and `branch_id` — and nothing
required them to agree.

**10 vehicles were listed under one dealership while assigned to a branch owned by another. Eight
were published and customer-visible.** A branch carries a telephone number, an email address and a
physical address, so a buyer enquiring about one dealership's car could be shown another
dealership's contact details — the failure AGENTS.md is about, arriving through a foreign key rather
than a seed.

Repaired (each vehicle moved to a branch of its own dealership), and a composite foreign key now
makes the pairing checkable by the database rather than by every writer remembering.

### H2 — Anonymous callers could read columns the marketplace never needed — **FIXED**

RLS is row-level. `dealerships_public_read` correctly limits *which* dealerships anon may read, then
exposed all 33 columns of them:

| Column | Why it should not be public |
|---|---|
| `dealerships.owner_user_id` | A live `auth.users` UUID |
| `dealerships.verification_note` / `verification_checked_by` | Internal review commentary and the reviewer's account |
| `dealerships.subscription_package` | The dealership's commercial tier with us |
| `inventory_vehicles.lead_count_30d` | How many enquiries a rival's listing drew |
| `inventory_vehicles.estimated_days_to_sell`, `created_by` | Internal estimate; actor identifier |

**The first fix was a no-op, and the re-probe caught it.** Column privileges in Postgres are additive
to table privileges — revoking a single column leaves a table-wide grant intact and the column
readable. Corrected by removing the table grant and granting an explicit allow-list, which also means
a column added in future is not public until somebody adds it there.

Public marketplace verified unaffected: homepage, `/search` and vehicle detail all render, same 24
cards on the first search page.

---

## Medium

### M1 — Anonymous callers could enumerate every dealership — **FIXED in PCP-039** ⚠ *this entry was wrong twice*

**The exposure was real.** `dealership_field_provenance` returned 640 rows to an anonymous caller,
exposing the ids of all 128 dealerships — including the 85 the marketplace deliberately does not
show. No names, contact details or stock leaked, and the dealership rows themselves stayed correctly
hidden (0 of 15 hidden dealerships were reachable directly by id).

**Both the diagnosis and the proposed fix in this report were wrong.** Corrected in PCP-039 after the
founder checked it against the live database:

> `dealership_field_provenance` is a **VIEW**, not a table. It selects from `verification_claims`.

That single fact invalidates everything this section originally concluded:

| This report said | Actually |
|---|---|
| `CREATE POLICY` fails because the migration role does not own the table | It fails because Postgres rejects `CREATE POLICY` on a **view** |
| A control statement succeeding elsewhere proves an ownership difference | It proved an **object-kind** difference. The control was a table |
| The fix is a policy on `dealership_field_provenance` | A view cannot carry a policy |
| Blocked — needs the `postgres` owner in the SQL editor | Not blocked at all. It was applied from this repository |

The "ownership" conclusion was reached by observing two failures and one success and inferring the
only difference I had thought to test. It was a plausible reading of real evidence, and it was wrong,
and it then propagated into three other documents as a launch blocker requiring founder action.

**And the first attempt at the real fix was also wrong.** Revoking `anon`'s access to the view looked
minimal and certain. It was neither:

- It broke the public dealer profile. `loadPublishableFields` reads the view through
  `createSupabaseServerClient()` with no token — the anon key — and **fails closed**. A dealership's
  genuine telephone number and website would have been silently suppressed the day one was supplied.
  Invisible today only because 0 of 128 dealerships have supplied any.
- It did not close the leak. `verification_claims`, the base table, returned the same 640 rows and the
  same 128 ids to `anon` on its own `for select using (true)` policy. Closing the view alone moves a
  leak; it does not remove one.

**What actually fixed it** (`20260811091000_pcp039_scope_verification_claims`), three parts because
fewer would not have worked:

1. Restore `anon`'s grant on the view — the dealer profile legitimately needs it.
2. `alter view … set (security_invoker = true)` — a view does not inherit its base table's RLS unless
   told to; by default it runs with its owner's privileges, so a policy underneath it would have had
   no effect on an anonymous reader.
3. Scope `verification_claims_read` to claims whose subject is a dealership the caller can already
   see, deferring to `dealerships_public_read` rather than restating the visibility rule.

**Verified after the change:** the view and the base table each expose 43 distinct dealership ids —
exactly the anon-visible set — and **0 hidden**. The service role still reads all 128 for the Quality
Centre and Verification Workspace, and the public dealer profile's provenance read still returns 200.
Asserted by three checks in `verify-security-posture.mjs` so neither half can regress.

### M2 — Two unauthenticated endpoints accept a dealership id — **NOT FIXED, low impact confirmed**

`/api/v1/market/daily-brief` and `/api/v1/market/dashboard` take a `dealershipId` and perform no
authorisation. Both return HTTP 200 for any dealership.

**They do not leak unpublished data.** They call `createSupabaseServerClient(token)`, which falls back
to the **anon** key when there is no token, so RLS applies in full. Measured against two dealerships
holding draft stock: the endpoints reported 8 listings / R 2 335 000 and 6 / R 2 585 000 — exactly the
published-only figures, not the 11 / R 3 370 000 and 8 / R 4 960 000 that include drafts.

So the disclosure is an aggregate of already-public listings, obtainable by browsing the marketplace.
The reason to fix it is convenience-of-scraping, not confidentiality. Combined with M1, an attacker
can enumerate all 128 dealerships and query both endpoints for each.

### M3 — Rate limiting is applied to exactly one route

`/api/v1/marketplace/enquiries` is rate limited. The other **17 unauthenticated POST endpoints** are
not.

Impact is currently limited because none of them do expensive work: every `/api/v1/intelligence/*`
handler is an honest stub returning "pending", and **no route in the application calls an external AI
provider** (verified — no `fetch` to any provider, no API key read). They do reach the database, so
they remain an amplification surface.

### M4 — `owner_user_id` is still readable by any signed-in account

H2 revoked the column from `anon` only. `verifyDealershipOwnershipWithSupabase` runs
`where owner_user_id = $1` on the caller's own session, and a WHERE clause requires SELECT on that
column, so narrowing `authenticated` would break every dealer ownership check.

Closing it properly means moving that lookup to a `security definer` function. Recorded rather than
attempted, because a wrong change here locks every dealer out of their own dealership.

### M5 — Duplicate VINs

Two VINs appear on two vehicles each. One pair is **two published listings at the same dealership
with the same VIN** — two adverts for one physical car. The other pair is one published and one
deleted, which is benign.

Not constrained, and deliberately not constrained by this audit: the same VIN legitimately reappears
when a car is sold and re-listed by another dealership, so a global unique index would reject honest
data. The narrow correct rule — at most one *published* listing per VIN per dealership — is a
partial unique index, and it is a founder decision whether to enforce or merely report it.

---

## Low

### L1 — Unknown vehicle URLs return HTTP 200

`/vehicle/<anything>` renders a "Vehicle Not Found" page with status **200**, not 404. Unknown
non-vehicle paths correctly return 404. This is a soft 404: search engines index the not-found page,
and monitoring cannot distinguish a broken link from a working one.

*This corrected an earlier reading in this audit.* An initial probe recorded six draft vehicles as
"served publicly" on the strength of their 200s. Checking the response bodies showed all six were
not-found pages — and so was the *published* control, because the guessed slug format was wrong.
Re-tested with real slugs taken from `/search`: **0 of 5 drafts reachable**. No leak.

### L2 — PostgREST discloses function signatures

Calling an RPC with a wrong parameter name returns `Perhaps you meant to call the function
public.has_dealership_access(p_dealership_id)`. Standard PostgREST behaviour, no action proposed.

### L3 — Request bodies are parsed before authorisation on some routes

e.g. the vehicle media route calls `parseMediaCreateRequest` before `authorizeDealerApiRequest`.
Authorisation still runs before any write, so this is not a bypass — it is a small amount of work
done for unauthenticated callers.

---

## Verified sound — no action

Reported so the absence of a finding is not mistaken for an absence of checking.

| Area | Evidence |
|---|---|
| **Anonymous reads of tenant data** | 16 tables probed with the anon key: `leads`, `lead_timeline`, `buyer_profiles`, `buyer_saved_*`, `dealership_staff_memberships`, ownership claims and events, import batches and rows, notifications, vehicle documents/audit/history, analytics, rate limits — **all return nothing** |
| **Anonymous writes** | POST as anon to `dealerships`, `inventory_vehicles`, `leads`, `dealership_staff_memberships`, ownership claims, import batches, `buyer_profiles` — **all 401** |
| **Unpublished stock** | anon sees 229 vehicles, every one `published`. Drafts unreachable by id and by slug |
| **Dealer API authorisation** | 6 endpoints probed unauthenticated — all 401 |
| **Operations API** | 5 endpoints probed unauthenticated — 401/403 |
| **Page guards** | `/dealer/*`, `/operations/*`, `/buyer` all 307 to sign-in or `/unauthorized`; `/admin` 404 |
| **Ownership model** | PCP-037 suite, 22 checks, asserts every refusal: transfer to a non-member, transfer by a non-owner, acceptance by the wrong account, replay of a used link, removal of the owner, rejection without a reason |
| **Invitation tokens** | Stored as SHA-256 digest, never raw; cleared on acceptance so a used link cannot be replayed |
| **Secrets** | `.env*` gitignored, only `.env.example` tracked, no key patterns in tracked source. The one `sb_secret_` match is a comment |
| **External AI cost/DoS** | No route calls any external provider |
| **File upload** | **No server-side upload endpoint exists.** Media is added by URL. Phase 5 had nothing to audit — recorded as absent rather than passed |
| **Referential integrity** | 0 orphaned media, 0 leads referencing missing dealerships or vehicles, 0 import rows referencing a missing batch, 0 duplicate staff memberships, 0 vehicles with two primary photographs, 0 accounts owning two dealerships, 0 active staff rows without a user id |
| **Truthfulness** | `verify-marketplace-trust.mjs` 36/36. PCP-037 removed the last roadmap promise and a VIN decoder that fabricated specifications |

---

## Known-but-not-security

Surfaced by the integrity sweep; they belong to the photography programme, not this audit.

- **80 published vehicles have no photograph at all.**
- **3 published vehicles have photographs but no primary**, so every card renders "Photographs to
  follow" while the gallery is full — exactly the defect `quality.rules.ts` describes.

---

## Phases that could not be completed

| Phase | Status |
|---|---|
| 5 — File upload security | **Nothing to audit.** No upload endpoint exists; media arrives as URLs. Will need auditing when the photograph pipeline is built |
| 9 — Production failure simulation | **Partially done.** Missing email provider and missing cron are covered by `validateEnvironment()` and were read, not simulated. Missing database, missing storage and expired session were **not** simulated — doing it safely needs a staging environment, which is infrastructure outside this repository |
| 11 — Performance safety | **Not done.** Not measured, so nothing is reported. The one known figure is pre-existing: `/search` server timing is dominated by ~360ms database round trips (PCP-034). No optimisation should be attempted without measurement, per the brief |

---

## Would I deploy to production today?

**On the security posture: yes.** M1 — the last open finding — was fixed in PCP-039 once the founder
established that the object was a view. There is no outstanding security work.

C1 and C2 were the findings that mattered, and both are fixed and asserted by a regression suite. C1
in particular would have been invisible in production: dealers uploading photographs, the interface
confirming success, nothing stored, and no error anywhere to investigate. It is the exact failure
mode AGENTS.md warns about — silent, plausible, and discovered only by someone measuring rather than
trusting.

**On production readiness generally: the blockers are unchanged from PCP-037** and none of them are
security. No email provider configured, no dealer contact details, 80 published vehicles with no
photograph, and no buyer audience. Those decide whether onboarding a dealership is a good idea; this
audit only establishes that doing so would be safe.
