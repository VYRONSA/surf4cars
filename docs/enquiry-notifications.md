# Dealer enquiry notifications

How an enquiry becomes something a dealership actually knows about, and what to do when it does not.

## The rule everything else follows

**Persistence first, notification second, and the buyer is told only what is true.**

The lead is committed to `leads` before any of this runs. Nothing in the notification path can fail
an enquiry — every function returns an outcome and none of them throw into the request. A provider
outage produces a recorded enquiry that has not been announced yet. It never produces a lost one.

The buyer's confirmation has two wordings and the server decides which:

| Condition | What the buyer reads |
|---|---|
| A provider accepted the message | "The dealership has been sent your details and will be in touch." |
| Anything else | "Your enquiry has been received and the dealership can see it in their dashboard. We are still working on getting a notification through to them, so it is worth calling if you would like an answer today." |

The second wording exists because the first one, said falsely, is worse than saying nothing. A buyer
who believes a dealer was told stops chasing and waits for a call nobody was asked to make.

## Configuration

All of it is environment. There are no keys, senders or accounts in the source.

| Variable | Effect if absent |
|---|---|
| `EMAIL_PROVIDER` | Nothing is sent. Enquiries are recorded, held, and delivered on the first sweep after a provider is set. |
| `EMAIL_API_KEY` | Provider resolution fails; same as above, with the reason on the Founder card. |
| `EMAIL_FROM` | As above. |
| `NOTIFICATION_CRON_SECRET` | The retry endpoint refuses everything. **A notification that fails its first attempt is never retried.** |
| `NOTIFICATION_MAX_ATTEMPTS` | Defaults to 4. |

`resend` and `sendgrid` are implemented. `ses` is **not** — it needs SigV4 request signing that has
never been run against AWS, and it is refused at configuration time rather than failing at send time
on a real buyer's enquiry. `mock` simulates outcomes for the verification suite and is refused when
`NODE_ENV=production`.

## The retry schedule

| Attempt | When |
|---|---|
| 1 | immediately, inside the enquiry request |
| 2 | +5 minutes |
| 3 | +30 minutes |
| 4 | +2 hours |
| — | permanent failure; the row is never selected again |

A **permanent** provider error — a rejected address, a bad API key — skips all of that and fails on
the first attempt. Retrying it would produce three more identical errors and hide the real ones.

## The scheduler is not wired — this is the open gap

`POST /api/v1/internal/notifications/retry` drains the queue and is verified working. **Nothing calls
it on a timer.** Until something does, the immediate attempt is the only one that happens
unprompted, and the queue drains only when somebody asks it to:

```bash
curl -X POST https://<host>/api/v1/internal/notifications/retry \
  -H "Authorization: Bearer $NOTIFICATION_CRON_SECRET"
```

On Vercel, a `vercel.json` entry closes it:

```json
{ "crons": [{ "path": "/api/v1/internal/notifications/retry", "schedule": "*/5 * * * *" }] }
```

That file does not exist in this repository. It is not written speculatively because the hosting
platform is not chosen, and a cron declaration for a host we do not deploy to is a line that looks
like coverage and provides none.

## Sent is not delivered

`sent_at` is a provider accepting the message. `delivered_at` is a provider confirming a mailbox
received it, which arrives on a webhook this platform does not have — so no row ever reaches
`delivered`, and the Founder card shows **Sent**, never **Delivered**, and says why underneath.

Collapsing the two would produce a dashboard certifying deliveries nobody observed. That is the same
class of mistake as a fabricated VAT number and harder to spot, because it is a green number rather
than a wrong one.

## Today's dominant failure is not a delivery failure

Of 128 dealerships, **none has a contact address** and **51 have a staff account**. Recipients
resolve `dealerships.email` first, then the oldest active staff membership. For the other 77
dealerships there is nobody to email, and those enquiries are recorded as `unroutable` — counted
separately from `failed`, with the remedy named on the card and in the lead timeline.

The empty `dealerships.email` column is not a bug. It is `AGENTS.md` working: contact details were
never derived from business names, after three derived domains resolved to live third-party
businesses. The fix is onboarding — asking dealerships for an address — not code.

## Reading the record

Two tables, with different jobs.

- **`enquiry_notifications`** — one row per lead, current state: provider, destination, status,
  attempts, provider response, timestamps. A unique index on `(lead_id, channel)` is what guarantees
  a dealership is never emailed twice about the same enquiry, including when the sweeper and a live
  request race.
- **`lead_timeline`** — append-only. A notification that was queued, retried three times and then
  failed leaves six entries, not one that changed its mind.

## Verifying it

```bash
node scripts/verify-enquiry-notifications.mjs
```

Starts its own dev servers, drives real enquiries through the real route, reads the rows back, and
restores every fixture it touched. 65 checks across ten cases: successful send, unconfigured
backlog recovery, provider timeout, retry escalation and its stopping point, rejected address,
dealership with no recipient, duplicate prevention, timeline ordering, endpoint authorisation, and
the wording the buyer actually sees in a browser.
