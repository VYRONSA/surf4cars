<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working on this codebase

## Design tokens do not hot-reload

**If you change a value in `src/styles/tokens/*.css` and the page looks unchanged, it *is* unchanged.**

Turbopack does not pick up edits to the token files imported by `src/app/globals.css`. Not on save, not
on a hard reload with cache disabled, and not on a plain dev-server restart. The browser keeps serving the
palette as it was when the server booted.

To apply a token change:

```bash
# stop the dev server, then
rm -rf .next && npm run dev
```

Verify it took effect before trusting anything you see:

```js
getComputedStyle(document.documentElement).getPropertyValue("--color-background").trim()
```

**Why this matters more than an ordinary caching annoyance.** It fails silently and it fails *plausibly* —
the page still renders, just with the previous palette. During a design review that means measuring one
palette while believing you are looking at another, and concluding that a change "had no effect" when it
was never applied. A tuning session was lost to exactly this: several rounds of screenshot measurements
returned byte-identical numbers, which read as "the change does nothing" rather than "the change is not
loaded". The tell is a measurement that does not move at all across edits that should obviously move it.

Anything that measures rendered colour — `scripts/audit-design-contrast.mjs` reads the source files and is
unaffected, but Playwright/sharp screenshot measurement is not — must run against a freshly booted server.

## Customer-facing contact information

Every website, email address, telephone number, WhatsApp number and social profile shown to a customer must
be one of exactly three things:

1. **Genuine** — supplied by the dealership.
2. **Verified** — checked by SURF4CARS.
3. **Explicitly marked as demonstration data** — platform-owned, and obviously ours.

There is no fourth category. `NULL` is preferred in development *and* in production; "Not provided" is a
finished state, not a gap to be filled.

**Never derive a contact detail from a business name.** Not websites, not email addresses, not handles. The
seed did exactly this — generating `atlanticauto.co.za` from "Atlantic Auto" — and three of those generated
domains resolved to live third-party businesses. Two of them were on dealer profiles with live inventory,
labelled "Provided by the dealer". Deriving an identifier does not create a placeholder; it creates a
plausible claim about somebody else.

Demonstration values must be incapable of reaching an unrelated organisation:

```
demo@surf4cars.co.za        +27 10 000 0000        demo.surf4cars.co.za
```

Records that exist to demonstrate the product carry `dealerships.is_demonstration`. They are excluded from
production quality metrics and listed explicitly in the Founder Quality Centre — excluded from the score,
never hidden from view. A fixture nobody can see is how a test record became the largest dealership on the
platform.

### The principle underneath it

> **An obviously fake placeholder gets fixed. A convincing one gets trusted.**

Poor dummy data is easy to spot and therefore self-correcting. Convincing fabricated data is dangerous
precisely because it is believed — `4200000273` looks exactly like a real VAT number, and nobody checks.

Always prefer an honest "Not provided" over a believable fiction. This is as fundamental to the platform as
provenance itself, and it applies to our own reference data too: `src/services/quality/south-africa-geography.ts`
returns `null` for postal-code bands it cannot attribute rather than guessing, because a quality rule that
fires wrongly destroys more trust than the defect it was written to catch.

## Two architectural principles

### 1. Different views should not require different truth

One readiness engine, many presentations. The onboarding journey, the dealer health score, the inventory
pipeline, the verification queue and the Founder's action list are the same question — *what does this record
have, what is missing, who can supply it* — asked with different filters.

Never duplicate scoring, weighting or readiness logic to serve a new screen. Derive the screen from
`src/services/quality/`.

The cost of ignoring this is already recorded here twice: two spellings of `onboarding_status` left 50
dealerships invisible to every consumer that compared against `completed`, and two copies of the slug builder
produced a Founder report in which all 76 dealer links returned 404. Neither was wrong on the day it was
written.

### 2. Missing provenance is different from missing data

Do not suppress information because it cannot yet be trusted. Model *why* it cannot be trusted.

Opening hours were reported as a missing column. They were not missing — `dealership_branches.business_hours`
is populated on all 128 branches. What was missing was any way to tell a dealer's answer from our seed, so
the read path fell back to a hardcoded `null`. That suppression was behaviourally right and structurally
wrong: it would equally have withheld a real dealer's genuine hours the day they supplied them.

A hardcoded `null` is invisible to the Founder, uncountable by the Quality Centre, and blocks good data along
with bad. `dealership_field_provenance` replaced it with a rule that can be measured, reported and cleared.

**When something cannot be published, record the reason in the data model rather than in an `if` statement.**

### A corollary, learned building the time series

History is only comparable within a stable rule set. Every snapshot records a `rule_set_fingerprint`; two
runs may be compared only when the fingerprints match, and a change is rendered as a break in the series, not
a movement in it.

Without this, adding a rule makes completeness fall and the chart shows a marketplace going backwards on a
day nothing about the marketplace changed — and every answer the data can give to "why is growth slowing?"
is wrong. `RULE_SET` is enforced at runtime: emitting a finding whose rule is not registered throws, because
a fingerprint computed from a stale list would certify two incomparable runs as comparable.
