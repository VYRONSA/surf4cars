# SURF4CARS — Founder Operations Manual

**Version 1.0 · 3 August 2026**
For whoever is running SURF4CARS. Assumes no knowledge of how it was built.

---

## How to read this manual

Every instruction is marked with where the work happens, because that is the thing most likely to
waste your time:

| Mark | Meaning |
|---|---|
| **[Console]** | A screen in the platform. Sign in and click. |
| **[SQL]** | No screen exists yet. Run it against the database. |
| **[External]** | Outside the platform — Supabase, DNS, the email provider, a photographer. |
| **[Terminal]** | A command in the repository. |

If a section says **[SQL]**, that is not an oversight in this document. It means the button does not
exist, and pretending otherwise would send you looking for it.

**A note on the tone of this manual.** It states failure modes bluntly and names things that have
gone wrong. That is deliberate: everything in the *Common failure modes* section actually happened
during construction, and every one of them looked fine until somebody checked.

---

## 1. The daily checklist

Ten minutes, first thing. All of it lives on one screen.

**[Console]** Open **`/operations/founder`** — the Founder Dashboard.

1. **Read the amber numbers.** Amber means a queue with somewhere to go. Grey means a fact.
2. **Unassigned enquiries** — every one is a buyer waiting on a dealership. If this climbs day on
   day, the dealerships are not working their leads and that is a conversation, not a bug.
3. **Vehicles awaiting review** — the photography queue. See §5.
4. **Open integrity flags** — a photograph disagreeing with the listing it leads. See §6.
5. **Pending editorial approvals** — draft placements nobody published.
6. **Homepage health** — how many of the six merchandising bands can be dressed today. If this drops
   without you doing anything, stock has sold or been unpublished. Investigate before assuming a bug.
7. **Launch readiness** — should be static day to day. If a condition flips from green to amber, read
   §22 before anything else.

**Then look at the marketplace itself.** Open `/` in a private window. Thirty seconds. The dashboard
tells you what is countable; the homepage tells you what a buyer sees.

---

## 2. The weekly checklist

An hour, same day each week.

1. **[Console]** Clear the photography queue down (§5). Aim to leave nothing older than seven days.
2. **[Console]** Review open integrity flags (§6). Dismiss or act on each; do not let them accumulate,
   because a queue nobody clears becomes a queue nobody reads.
3. **[Terminal]** Run the full verification suite against a production build:
   ```bash
   npm run build && npx next start -p 3100
   # in a second terminal
   node scripts/verify-journeys.mjs
   node scripts/verify-founder-dashboard.mjs
   node scripts/verify-founder-curation.mjs
   node scripts/verify-approval-workspace.mjs
   node scripts/verify-back-navigation.mjs
   node scripts/verify-dealer-spotlight.mjs
   node scripts/verify-homepage-merchandising.mjs
   node scripts/verify-production-smoke.mjs
   node scripts/verify-security-posture.mjs
   node scripts/verify-marketplace-trust.mjs
   node scripts/verify-dealer-migration.mjs
   node scripts/verify-import-execution.mjs
   node scripts/verify-dealer-ownership.mjs
   ```
   All thirteen must pass. A single failure is worth stopping for — see §22, where the last three
   real outages were each caught by exactly one assertion.
4. **[Terminal]** `node scripts/audit-data-quality.mjs` — placeholder and polluted values in live data.
5. **[Console]** `/operations/quality-centre` — dealer readiness and completeness.
6. **[Console]** Walk one dealership's public profile end to end as a buyer would.

---

## 3. The monthly checklist

Half a day.

1. **[External]** Confirm the Supabase backup policy is still what you think it is (§13).
2. **[Terminal]** `node scripts/measure-web-vitals.mjs` — performance against the production build.
3. **[Console]** `/operations/audit-logs` — read the last month. You are looking for actions you do
   not recognise.
4. **[SQL]** Review demonstration data. Anything still flagged `is_demonstration` should be there on
   purpose:
   ```sql
   select id, business_name, is_demonstration from dealerships where is_demonstration = true;
   ```
5. **[Console]** Re-read the homepage as if you had never seen it (§18).
6. **Review this manual.** If you did something this month that is not written here, write it here.

---

## 4. Homepage curation workflow

The homepage shows **only** what a person has approved. Nothing reaches it by default, and new stock
cannot change it on its own. That is the design; an empty homepage means nobody has curated it, not
that something is broken.

### What determines what appears

Three gates, in order. A vehicle must pass all three:

1. **Merchandising** — the vehicle falls into one of six bands (§17).
2. **Photography** — its lead photograph is `approved_homepage` (§5).
3. **Editorial** — where the Founder has published a `homepage-featured` slot, that slot wins outright
   and replaces the algorithmic lead rail.

### To dress the homepage

1. **[Console]** `/operations/photography` — approve photographs (§5). This is the only step that is
   strictly required.
2. **[Console]** `/operations/editorial` — optionally publish collections and a Dealer Spotlight.
3. Wait up to **60 seconds**. The homepage is revalidated, not rendered per request. If a change has
   not appeared after two minutes, it is not a caching problem — go and check the decision saved.

### To take something off the homepage

Set its photograph to **Approved for search only** (§5). The vehicle stays listed, stays searchable
and stays reachable; it simply stops representing the marketplace. Never delete a listing to remove
it from the homepage.

---

## 5. Photography approval workflow

**[Console]** `/operations/photography`

### The four states

| State | Where the photograph may appear |
|---|---|
| **Approved for homepage** | Everywhere, including the homepage rails. |
| **Approved for search only** | Search, vehicle page, dealer page. Never the homepage. |
| **Rejected** | Nowhere. |
| **Needs review** | Nowhere on the homepage. This is the default and it is never treated as approval. |

"Needs review" is the *absence* of a decision, not a stored value. A photograph nobody has looked at
is by definition unreviewed.

### The workflow

1. Open the queue. It sorts flagged first, then unreviewed, then reviewed — and within that, most
   expensive first, because approving one photograph of a two-million-rand car does more for the shop
   window than six of a hatchback.
2. Click a vehicle. The workspace shows what it is, what it costs, who is selling it, and **every**
   photograph it has — not just the one currently leading.
3. For each photograph, look at all four previews before deciding: **homepage lead card, vehicle page
   hero, search card, dealer page card**. They are the real components at their real sizes. A frame
   that reads well at 890px can be unusable at 430px, and the crop differs between them.
4. Set a state per photograph. Write a note where the reason is not obvious.
5. **Save review.** One submit records every decision and the note together.

### Two things that will surprise you

- **One photograph serves many listings.** The demonstration library keys a frame per model, so
  approving one can light up a dozen cars. Each photograph says how many other listings it leads.
  Read that line before approving on a flagship.
- **Approving does not guarantee appearance.** The vehicle still has to fall into a band and survive
  deduplication. One frame appears once on the homepage, however many vehicles share it.

---

## 6. Vehicle / photograph integrity

**[Console]** `/operations/photography` → **Re-run integrity checks**

Three rules, all of which detect *disagreement between records* rather than looking at pixels:

| Flag | Meaning |
|---|---|
| **Different model** | The file is filed under another model than the listing claims. |
| **Two body styles** | One frame leads listings of two different body styles. Both cannot be right. |
| **Performance model shares this frame** | One frame leads a genuine performance derivative and an ordinary car of the same model. |

A flag is information, not a verdict. The Ranger fording a river is a fine photograph of a Ranger and
a poor one of a Raptor; which matters depends on which listing is in front of you.

**Dismiss** a flag once considered. It will not be raised again.

**What it cannot see.** It does not know a frame shows a cabriolet, a pre-facelift car or the wrong
generation. Those are your eyes, in the workspace. Do not treat an unflagged photograph as verified.

---

## 7. Dealer onboarding workflow

### What the dealership does

1. Signs up at **`/auth/sign-up/dealer`**.
2. Completes onboarding in the dealer portal. This creates the `dealerships` row.
3. Adds stock — one at a time at `/dealer/inventory/new`, or in bulk at `/dealer/inventory/import`.

### What you do

1. **[Console]** `/operations/onboarding-centre` — watch progress. **Read-only.**
2. **[Console]** `/operations/dealer-management` — the dealership record. **Read-only.**
3. **[SQL]** Contact details. Per the platform's contact rule (§20), a dealership's telephone, email
   and website must be genuine, verified, or explicitly demonstration. There is **no screen** for
   this yet:
   ```sql
   update dealerships
      set telephone = '+27 21 555 0100',
          email     = 'sales@theirrealdomain.co.za'
    where id = '<dealership-id>';
   ```
   **Never derive an email address or a website from the business name.** The seed did exactly that
   and three generated domains resolved to live third-party businesses.
4. **[SQL]** Cover photograph and branding — see §14.

### Known gap

The operations screens for onboarding, verification and dealer management are **read-only**. Every
change to a dealership record is currently made in the database. That is recorded as a post-launch
improvement, not as a workaround you have invented.

---

## 8. Dealer verification workflow

Verification is a claim the marketplace makes on a dealership's behalf, so the bar is evidence.

1. **[Console]** `/operations/verification` — the workspace. **Read-only.**
2. **[External]** Check the documents the dealership supplied: company registration, dealer licence,
   VAT registration where claimed, proof of address.
3. **[SQL]** Record the outcome. There is no button:
   ```sql
   update dealerships
      set verification_status = 'verified'   -- or 'pending', 'rejected'
    where id = '<dealership-id>';
   ```

**The rule:** a dealership is verified only when a person has seen the documents. The "Verified
dealer" badge appears on their profile, their vehicles and the Dealer Spotlight. It previously
rendered for anybody who had finished onboarding — which was all of them — and that was a defect,
not a policy.

---

## 9. Spotlight publication workflow

The Dealer Spotlight is a **commercial placement**. No approval means no section; a dealership is
never substituted.

1. **[SQL]** Confirm the dealership has what the section needs: a logo, a cover photograph with
   provenance (§14), and published stock. Without a cover the section renders a graphic panel — which
   is deliberate and handsome, but it is not what a paying dealership is buying.
2. **[Console]** `/operations/editorial` → the `dealer-spotlight` slot.
3. Add a placement with **subject kind `dealership`** and the dealership's id.
4. Write the **story** — this is the speciality line shown on the homepage. 40–80 words, editorial,
   written by a person. Never generated, and never inferred from their stock: "mostly sells bakkies"
   is a statistic about a forecourt, not a speciality a business would claim.
5. Publish the placement **and** the slot. Both are required.
6. Confirm on `/` within a minute.

**To withdraw:** unpublish the placement. The section disappears. It does not fall back to another
dealership.

---

## 10. Founding Dealer onboarding workflow

The Founding Dealer programme is presented at **`/pricing`**.

1. Enquiry arrives via `/contact?enquiry=founding-partner`.
2. **Check the count.** The programme is limited to **100 dealerships**. That number is a commitment
   published on the page; it is in `src/features/pricing/config/founding-programme.ts`.
3. Onboard as §7.
4. Record the founding status. **[SQL]** — there is no subscription management screen yet.
5. **What was promised, and nothing more:** free until **31 July 2027**, after which standard pricing
   applies. There is **no lifetime discount** — the page says so explicitly. Do not offer one in a
   sales conversation; the page is the contract.

---

## 11. Launch checklist

Work top to bottom. Nothing below the line matters until everything above it is done.

### Blocking

- [ ] **[Console]** Photographs approved for the homepage. Until this is done the shop window is dark.
- [ ] **[External]** Email provider credentials configured, and the sending domain verified in DNS.
      Until this is done no enquiry notification, invitation or password reset is delivered.
- [ ] **[External]** `NEXT_PUBLIC_APP_URL` set **at build time** to the production domain. It is baked
      into canonical URLs, the sitemap and every share card. Setting it after the build does nothing.
- [ ] **[External]** Production domain added to the Supabase Auth redirect allow-list, or sign-in
      fails after the redirect.
- [ ] **[External]** `CRON_SECRET` set and a scheduler configured.
- [ ] **[SQL]** Real dealerships carry genuine contact details (§7).
- [ ] **[Terminal]** All thirteen verification suites pass against a production build.
- [ ] **[Console]** `/operations/founder` → Launch readiness. Every condition green except those
      marked as unverifiable from inside the application, which you confirm by hand.

### Before announcing

- [ ] **[Console]** At least one Dealer Spotlight published (§9).
- [ ] **[Console]** `/api/health` returns `healthy`.
- [ ] **[Console]** `/robots.txt` and `/sitemap.xml` resolve and list real vehicles.
- [ ] **[Console]** Walk the homepage on a phone (§18).

---

## 12. Production deployment checklist

1. **[Terminal]** `npm run type-check` — clean.
2. **[Terminal]** `npm run lint` — no errors.
3. **[Terminal]** `npm run build` — clean.
4. **[Terminal]** Verification suites against the production build (§2).
5. **[External]** Confirm environment variables in the deployment target. Remember that
   `NEXT_PUBLIC_*` values are baked in at build time.
6. **[Terminal]** Apply migrations **before** the deploy goes live:
   ```bash
   npx supabase db push
   ```
7. Deploy.
8. **[Console]** `/api/health` — expect `healthy`. `503` means the instance cannot serve traffic.
9. **[Console]** Load `/`, `/search`, one vehicle page, one dealer profile.
10. **[Console]** `/operations/founder` — the numbers should match what they were before the deploy.

### The trap that has caught this project

**Adding a column to `dealerships` or `inventory_vehicles` does not make it readable.** The anon role
holds an explicit column allow-list, deny-by-default. A query asking for an ungranted column is
refused *in its entirety*, and the affected page fails closed — which renders as "not found", not as
an error.

This took out every dealer profile on the marketplace once. The build was clean, the types were
clean, eleven suites were green, and one assertion in one suite caught it. **If you add a column that
a public page reads, grant it:**

```sql
grant select (new_column) on public.dealerships to anon;
```

---

## 13. Backup and restore checklist

**[External]** — all of it. There is nothing in the repository that backs anything up.

### What to confirm, monthly

- [ ] **[External]** Supabase project → Database → Backups. Confirm the plan's retention and whether
      point-in-time recovery is enabled. **Confirm this rather than assume it**; the free and pro
      tiers differ, and nobody in the application can see the setting.
- [ ] **[External]** Note the recovery point objective you are actually buying, and write it here:
      `RPO: ______  ·  RTO: ______`

### Before anything destructive

Take a manual backup first. "Anything destructive" includes: applying a migration that drops a
column, bulk-updating dealership or vehicle records, and deleting a dealership.

### Restore rehearsal, once a quarter

A backup nobody has restored is a hypothesis. Restore to a **new** Supabase project, point a local
build at it, and load the homepage, a vehicle page and a dealer profile. Then delete it.

Record the date of the last successful rehearsal: `________`

---

## 14. New dealership checklist

For each dealership joining the marketplace:

- [ ] **[SQL]** Contact details are genuine or explicitly demonstration (§7, §20).
- [ ] **[SQL]** Logo supplied by the dealership — `dealerships.logo_data_url`. Never generate one; a
      monogram we invent is us inventing their branding.
- [ ] **[SQL]** Cover photograph **with provenance**:
      ```sql
      update dealerships
         set cover_data_url = '<their photograph>',
             cover_image_provenance = 'dealer'   -- or 'surf4cars-verified'
       where id = '<dealership-id>';
      ```
      **Provenance is what publishes it, not the presence of a value.** 78 records once carried
      values nobody had checked — stub strings, the literal text `ui-uploaded`, generated imagery —
      and every one was rendering as a page hero. A cover with no provenance is not published.
- [ ] **[SQL]** Optional `promotional_headline` — one line, written by the dealership.
- [ ] **[Console]** Verification status set on evidence (§8).
- [ ] **[Console]** Their profile at `/dealers/<slug>` renders, and states the real verification state.
- [ ] **[Console]** Their stock appears in `/search`.

---

## 15. New vehicle quality checklist

Mostly the dealership's job. What you check:

- [ ] **[Console]** Make, model, **variant** and body type are correct. Merchandising reads all four, and a wrong
      body type files the vehicle in the wrong band — a Land Cruiser recorded as "Double Cab" appears
      under Bakkies & commercial.
- [ ] **[Console]** Price and mileage are real.
- [ ] **[Console]** At least one photograph is of **this** vehicle, not the model in general.
- [ ] **[Console]** The vehicle appears in the photography queue and gets a review (§5).
- [ ] **[Console]** No integrity flags, or flags considered and dismissed (§6).

---

## 16. Photography standards

The standard, applied literally.

### Reject

Parking lots · dealership forecourts and showrooms · motor show and brand stands · crowds and
bystanders · identifiable faces · moving traffic · road signs, shop signs and advertising boards ·
third-party dealership branding · security gates · construction · low light · poor crops · vehicles
small in frame · background clutter · foreign number plates and street furniture · **any vehicle that
is not the one for sale** — a different generation, a different derivative, a concept car, a
competition car.

### Accept

The whole vehicle · good light · premium composition · clean background · confident stance · the
vehicle dominating the frame.

### What this means in practice

Of 24 frames examined one at a time during construction, **20 failed**. The demonstration library is
*reference* photography — taken to identify a model and record a trim, wherever the car happened to
be standing. Motor show halls and forecourts are not accidents in that genre; they are the genre.

Two frames reached the homepage before being caught: a **Hyundai Motorsport WRC car** captioned
"2019 Hyundai i20 1.0T Fluid — R95 000", and a **Group 5 BMW 320i race car** on a circuit. Both were
technically eligible because nobody had objected to them yet. That is why approval is now explicit.

**No curation logic turns reference photography into a magazine cover.** Commissioning real South
African photography is the only thing that raises the ceiling.

---

## 17. Homepage merchandising standards

Six bands, in this order. A vehicle is offered to each in turn and kept by the **first** that claims
it, so no car appears twice.

| Band | Claims a vehicle when |
|---|---|
| **Sports & performance** | Aspirational marque, **or** a genuine performance designation, **or** a sporting body. |
| **Luxury vehicles** | A premium marque, any body. |
| **Premium SUVs** | An SUV in the upper price band. |
| **Executive sedans** | A saloon in the upper price band. |
| **Family vehicles** | MPV, estate or remaining SUV. |
| **Bakkies & commercial** | Double cab, panel van, bakkie. |

### Rules that must not be broken

- **A trim is not a performance car.** "AMG Line", "M Sport", "S line", "R-Dynamic", "GT-Line",
  "N Line" and "F Sport" are bumpers and badges. A C200 AMG Line is a four-cylinder saloon; a C63 AMG
  is not. Designations are scoped per marque — "RS" on an Audi is Quattro GmbH, on a Toyota Hilux
  Legend RS it is a decal.
- **Price is a percentile of the live marketplace**, never a fixed rand figure. A threshold rots.
- **A band renders only when it has stock.** Fewer, better cards beat a full grid.
- **A rail below the first never stands on a single card** — a plural heading over one card reads as
  a section that failed to load.
- **Vehicles before editorial, always.** If nothing is approved, the editorial does not run either.

---

## 18. Editorial standards

**[Console]** `/operations/editorial`

- Everything is **draft by default**. Nothing reaches a customer until both the placement and its
  slot are published.
- **A story is written by a person.** 40–80 words. Never generated, never inferred from data.
- **A rail may only claim what its cards support.** "These are genuine performance models" must be
  true of every card, not most of them. This has been got wrong three times: once with `some()`, once
  with a majority rule that broke at two cards, and once by calling price-led mainstream marques
  "premium marques".
- **Unpublish rather than delete.** A deleted placement loses its ordering, its story and the reason
  it was chosen.

---

## 19. Trust standards

These are not style preferences. Each was written after something went wrong.

1. **An obviously fake placeholder gets fixed; a convincing one gets trusted.** Prefer an honest "Not
   provided" over a believable fiction. `4200000273` looks exactly like a real VAT number.
2. **Never derive a contact detail from a business name.** Not websites, not emails, not handles.
3. **Demonstration data is labelled**, on the customer-facing page, before any claim it makes.
4. **No invented numbers.** No ratings, no review counts, no "dealerships already joined", no fake
   urgency, no market-leadership claims.
5. **Missing provenance is not missing data.** Record *why* something cannot be published in the data
   model, not in an `if` statement — a hardcoded `null` is invisible, uncountable, and blocks good
   data along with bad.
6. **One engine, many presentations.** Never duplicate scoring, readiness or slug logic to serve a new
   screen. Two spellings of `onboarding_status` hid fifty dealerships; two slug builders produced
   seventy-six dead links; two "cover image" columns produced two answers to one question.

---

## 20. Content standards

Every website, email address, telephone number, WhatsApp number and social profile shown to a
customer must be **one of exactly three things**:

1. **Genuine** — supplied by the dealership.
2. **Verified** — checked by SURF4CARS.
3. **Explicitly marked as demonstration** — platform-owned and obviously ours.

There is no fourth category. `NULL` is preferred over a guess, in development *and* in production.
"Not provided" is a finished state, not a gap to fill.

Demonstration values must be incapable of reaching an unrelated organisation:

```
demo@surf4cars.co.za        +27 10 000 0000        demo.surf4cars.co.za
```

---

## 21. Operational KPIs to monitor

All on `/operations/founder` unless stated.

### Daily

| Metric | Watch for |
|---|---|
| Unassigned enquiries | Climbing day on day — dealerships not working leads. |
| New enquiries today | Zero on a weekday once you have traffic is a signal, not a quiet day. |
| Vehicles awaiting review | Growing faster than you clear it. |
| Open integrity flags | Any increase after a stock import. |

### Weekly

| Metric | Watch for |
|---|---|
| Homepage health (of 8) | Falling without a curation change — stock has sold. |
| Vehicles published | Flat means no dealership added stock. |
| Vehicles approved for the homepage | Should track the queue you cleared. |
| Dealerships without contact details | Must trend to zero before launch. |
| Dealerships without a cover photograph | The Dealer Spotlight is unsellable while this is high. |

### Monthly

| Metric | Where |
|---|---|
| Launch readiness (of 7) | Founder Dashboard. |
| Dealer readiness and completeness | `/operations/quality-centre`. |
| Web vitals | `node scripts/measure-web-vitals.mjs`. |
| Data quality defects | `node scripts/audit-data-quality.mjs`. |

**A metric that does not move is a metric to distrust.** During construction, several rounds of
screenshot measurement returned byte-identical numbers; the correct reading was not "the change does
nothing" but "the change is not loaded".

---

## 22. Common failure modes and their remedies

Every one of these has happened.

### "The homepage has no vehicles on it"

**Almost certainly correct behaviour.** Nothing is approved. Open `/operations/photography` and
approve something. The dashboard says so explicitly when the count is zero.

If photographs *are* approved and the rails are still empty, check `/api/health` — the review table
read **fails closed**, so an unreadable database yields no approvals rather than letting everything
through.

### "I approved a photograph and nothing changed"

Wait 60 seconds; the homepage is revalidated, not rendered per request. If it is still absent after
two minutes: the vehicle may not fall into any band, or its photograph may be shared with a vehicle
already shown — one frame appears once.

### "A dealer profile says 'dealership not found'"

Almost certainly a **column grant**. A query asking for a column `anon` cannot read is refused
entirely and the page fails closed. See §12. Check the server log for a PostgREST error, then grant
the column.

### "A page looks unchanged after a design token edit"

Turbopack does not reload `src/styles/tokens/*.css`. Stop the dev server, `rm -rf .next`, restart.
Verify before trusting anything you see:

```js
getComputedStyle(document.documentElement).getPropertyValue("--color-background").trim()
```

### "A verification suite fails on something unrelated to its name"

Read it anyway. The last three real outages were each caught by a single assertion that was testing
something else. A trust assertion caught every dealer profile 404ing; a merchandising assertion
caught a race car on the homepage.

### "The numbers on two screens disagree"

One of them is computing its own version. Find the duplicate and delete it — do not reconcile them.
This is the failure that has cost this project the most.

### "HTTP 200 means the page works"

It does not. A not-found body returns 200. Six draft vehicles were once reported as "served
publicly" on that basis. **Read the page, not the status code.**

### "A photograph looked fine at full size"

Then it was judged at the wrong size. Use the workspace previews (§5) — a frame that reads at 890px
can be unusable at 430px, and the crops differ.

### "A test passes, so the feature works"

Check what the test asserts. A suite reported green while two screens had no Back control, because it
checked twelve paths somebody had chosen rather than every route the application declares.

---

## 23. Where the write surfaces are

The complete list of places an operator can change what customers see:

| Surface | Route | What it changes |
|---|---|---|
| Editorial Console | `/operations/editorial` | Slots, placements, stories, publication. |
| Photography Review | `/operations/photography` | Photograph states, notes, integrity flags. |
| Creative Review | `/admin/creative/*` | Premium media library. **Local only** — absent from deployed builds. |
| Ownership claims | API | Dealership ownership decisions. |

Everything else in `/operations` is **read-only**. If you need to change a dealership record, a
verification status or a subscription, it is **[SQL]** today.

---

## 24. What is deliberately not built

So you do not go looking:

- No screen for dealership contact details, verification status, or cover photography.
- No bulk approval in the photography console.
- No scheduled integrity checks — it is a button.
- No pixel-level photograph analysis. The integrity rules detect *disagreement between records* and
  nothing else, deliberately: a scorer once rated a brick-shopfront photograph 78 out of 100.
- No billing for the Dealer Spotlight. The placement and approval exist; pricing does not.
- No trend arrows on the Founder Dashboard. There is no history to draw, and an invented "+12% this
  week" in the one place you are most likely to trust a number would be worse than nothing.

---

## 25. The one thing that matters most

The platform will not stop you publishing a bad marketplace. It will stop you publishing a
*dishonest* one — it refuses invented ratings, derived contact details, unapproved photography and
claims the inventory cannot support.

Everything else is judgement, and the judgement is yours. When in doubt, the question that has
resolved every hard call in this codebase is:

> **If a customer knew how this number was produced, would they still trust it?**

If the answer is no, show nothing. A shorter page is not a cost.
