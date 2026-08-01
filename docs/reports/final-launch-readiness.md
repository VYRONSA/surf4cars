# Final launch readiness — PRP-006 Phase 5

Four columns, deliberately separate, because they have different owners and only one of them can be
signed off by a machine.

- **Engineering** — software. Verifiable by running something. Marked complete automatically where a
  check proves it.
- **Operational** — accounts, keys, schedulers, domains. Nothing to build; someone must do it.
- **Business** — data, content and commitments the platform makes on the founder's behalf.
- **Founder** — decisions only the founder can take.

**No item outside Engineering is marked complete in this document, whatever its state.** A machine
that certified an operational or business item would be asserting something it cannot observe.

---

## The one-line verdict

**Engineering is complete. The platform is not ready to launch, and nothing standing in the way is
software.**

---

## Engineering

Verified by `node scripts/verify-production-readiness.mjs` (55 checks) and
`node scripts/verify-enquiry-notifications.mjs` (65 checks). Last run: **120 passed, 0 failed.**

| Area | Status | Evidence |
|---|---|---|
| Production build | **Complete** | Compiles clean; no type errors; 89 pages generated |
| Typecheck and lint | **Complete** | `tsc --noEmit` clean; `eslint src/` clean |
| Enquiry persistence | **Complete** | No path returns success without a committed row. Verified through the real form |
| Enquiry notification | **Complete** | Provider abstraction, retry queue, delivery log, append-only timeline, health card. 65 checks |
| Truthful buyer confirmation | **Complete** | Two wordings, chosen by the server. Both asserted against rendered text in a browser |
| Duplicate prevention | **Complete** | Unique index; double submission yields one lead, one notification, one email |
| Row-level security | **Complete** | With the public key: leads, timeline, buyer profiles, staff, documents, audit, notifications all return 0 rows. All writes refused |
| Secret handling | **Complete** | Service key absent from the production bundle. No credential has a default in code |
| Security headers | **Complete** | Were entirely absent. CSP, HSTS, frame, nosniff, referrer, permissions — verified on a production build with zero violations |
| Rate limiting | **Complete** | Durable across instances; personal data hashed; fails open |
| Dependency advisories | **Complete** | Nine high-severity Next advisories closed, including a proxy bypass affecting the auth gate. `npm audit --omit=dev`: 0 vulnerabilities |
| Authentication gate | **Complete** | Runs (it previously did not); protected routes 307 |
| Storage isolation | **Complete** | Licence discs and vehicle documents private; media public |
| Migrations | **Complete** | 17, manifested, applied; schema reproducible from an empty database |
| Health endpoint | **Complete** | Reports configuration, database, storage and auth separately |
| Deployment configuration | **Complete** | `vercel.json` declares the cron; endpoint answers the method the scheduler actually uses |
| Disaster recovery procedures | **Complete** | Documented. **The procedures are written; a restore has never been performed** — that is an operational item below |

### Engineering gaps I am choosing to name rather than close

| Gap | Why it is not blocking | What it would cost |
|---|---|---|
| `script-src 'unsafe-inline'` | The policy still blocks foreign scripts, framing, foreign form targets and plugins | Per-request nonces threaded through every rendered page |
| Amazon SES not implemented | Resend and SendGrid work; SES is refused at configuration time with a message naming them | SigV4 signing, untestable from here |
| No delivery-confirmation webhook | The card says "Sent" and explains that delivery is not claimed | A provider webhook endpoint |
| No `robots.txt` / `sitemap.xml` | Gated routes already carry `noindex` and return 307 | Two small files; excluded because this brief is not feature work |
| Authenticated APIs unlimited | They sit behind auth; rules already defined | Wiring existing rules to routes |
| No error aggregation | Logs reach Vercel's viewer | A Sentry-class integration |
| No load testing | Unknown | A test plan and a paid tool |
| `createDealerEnquiry` still writes to the local store | Unreachable from any route | Deleting it |

None of these prevents a launch. Each is written down so that "no engineering remains" means what it
says rather than meaning "nothing anybody wrote down".

---

## Operational

Not complete. Not startable by me.

| # | Item | State | Consequence if skipped |
|---|---|---|---|
| O1 | Upload production environment variables to Vercel | Not done | Nothing works |
| O2 | Set `NEXT_PUBLIC_APP_URL` to the production domain | Not done | Canonical URLs, Open Graph and the dealer link inside every notification email point at a developer's machine. The build fails its own config check |
| O3 | Create an email provider account; set `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` | Not done | Enquiries are recorded and held; no dealership is told |
| O4 | Verify the sending domain (SPF, DKIM, DMARC) | Not done | Messages accepted then silently dropped, or delivered to spam. **An enquiry in a junk folder is an enquiry nobody answered** |
| O5 | Set `CRON_SECRET` in Vercel | Not done | The retry endpoint refuses the scheduler; one delivery attempt, no second chance |
| O6 | Confirm the Vercel plan allows 5-minute crons | Not done | Hobby permits one per day, which makes the retry schedule meaningless |
| O7 | Register the domain; point DNS at Vercel; confirm TLS | Not done | No site. HSTS is inert until TLS is live |
| O8 | Set Supabase auth redirect URLs to the production domain | Not done | **Every confirmation and password-reset link 404s.** The most likely production-only fault on this list — configured in Supabase, invisible to every local test |
| O9 | Confirm the Supabase region matches the deployment region | Not done | Avoidable latency on every server-rendered page |
| O10 | Enable backups with point-in-time recovery | Not done | The difference between losing a minute and losing a day |
| O11 | **Perform one restore into a scratch project** | Not done | An untested backup is a belief. Half an hour, and the only way to learn whether storage is included |
| O12 | Store the environment-variable set in a password manager | Not done | They exist only in Vercel. Nothing backs them up |
| O13 | Run `docs/reports/production-smoke-test.md` against the live site | Not done | The checks that matter most are the ones no local suite can perform |

---

## Business

Not complete. These are the ones that decide whether the platform *works as a business* on day one,
and they are the largest remaining obstacle.

| # | Item | State | Why it matters |
|---|---|---|---|
| B1 | **Collect dealership contact addresses** | **0 of 128 have one** | 51 dealerships have a staff account that can receive; **77 have nobody to email at all.** The delivery machinery is built, verified and has nowhere to deliver. This is the binding constraint on the platform's only conversion action |
| B2 | Decide what happens to demonstration data | 128 dealerships and 330 vehicles are seeded | Launching with seeded stock means buyers enquire about cars that do not exist. `is_demonstration` marks some records; the rest is a decision |
| B3 | Commission photography | 18 of 19 reviewed frames fail the standard; zero qualify for hero tier | Brand risk, not a functional one |
| B4 | Confirm real dealerships have agreed to be listed | Unknown | Publishing a business's stock and contact details without consent is a legal and reputational exposure, not a technical one |
| B5 | Decide who answers `/contact` | Page publishes details; no form by design | A published contact route nobody monitors is worse than none |

---

## Founder

Decisions. Nobody else can take them.

| # | Item | State |
|---|---|---|
| F1 | Company registration number and registered address for the legal pages | Rendered as visible amber "Founder review required" notes on the pages themselves |
| F2 | Name a POPIA Information Officer | Same |
| F3 | Data retention period | Same |
| F4 | Attorney review of Privacy, Terms and Cookies | Not done |
| F5 | Brand name: SURF4CARS or SURF FOR CARS | `docs/brand-naming-audit.md` — the wordmark and the metadata still disagree |
| F6 | Launch with current photography, or wait | B3 |
| F7 | Launch with demonstration data visible, or clear it | B2 |

---

## What launching without each column looks like

**Without Operational** — the site does not exist, or exists and tells nobody anything. Not a launch.

**Without Business** — the site works perfectly and enquiries go nowhere, because 77 dealerships have
no address and the buyer was told someone would be in touch. The software will do exactly what it
promised and the business will still fail the customer. **This is the column that matters most and
the one most likely to be underestimated, because everything in it looks like admin.**

**Without Founder** — the site works, takes real enquiries, and publishes legal pages carrying visible
"Founder review required" notices. Survivable for a soft launch; not for a public one.

---

## The honest answer to "is it ready?"

The software is ready. It has been built to fail honestly rather than quietly: an enquiry is never
confirmed unless it is stored, a dealership is never claimed to be notified unless a provider
accepted the message, a dealership with no address is reported as an onboarding gap rather than
counted as a delivery failure, and a dashboard that cannot see delivery says so instead of showing a
comfortable number.

That property is what makes the remaining gaps survivable. A platform that overstated its own state
would need every one of these items closed before it could be trusted in front of a customer. This
one can be launched incrementally — configure the provider, collect addresses dealership by
dealership — and it will tell you the truth at every stage about what is and is not working.

**The last piece of software engineering is done. What remains is a business to launch.**

---

### Re-running the evidence

```bash
node scripts/verify-production-readiness.mjs    # 55 checks, production build
node scripts/verify-enquiry-notifications.mjs   # 65 checks, live database
npx tsc --noEmit && npx eslint src/ && npm run build
npm audit --omit=dev
```

Both suites start and stop their own servers and restore every row they touch.
