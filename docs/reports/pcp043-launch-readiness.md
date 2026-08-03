# PCP-043 — Launch readiness: what is blocking, what is not

**Date:** 3 August 2026
**Scope:** every open item known to the repository, classified into three categories that are not mixed.

## How this list was built

`src/` contains **zero** `TODO`, `FIXME` or `HACK` markers. That is worth stating plainly, because
"review every remaining TODO" would otherwise return an empty result and read as "nothing left".
The two matches in the tree are a lint pattern in `scripts/audit-data-quality.mjs` and a string in a
test fixture.

So this list is drawn from three real sources instead: the open decisions recorded at the end of
each programme report, the operational dependencies that no amount of engineering can close, and
what the launch walk in this sprint found.

Each item states **who** can close it, because most of these are not code.

---

## Launch blockers

Must be completed before a customer or a dealership sees this.

### 1. Nothing is approved for the homepage

**Owner: Founder.** The premium rails now render only photographs explicitly approved at
`/operations/photography`. Nothing is approved, so the homepage shows a hero, the marque wall, the
trust section and the dealer call to action — and no vehicles at all.

This is the intended state of the mechanism, not a defect, but it is a blocker: a vehicle
marketplace cannot launch with no vehicles on its front page. Approving frames takes minutes and the
page fills within one.

The honest constraint underneath it: across PCP-041A, PCP-042 and this sprint, **24 frames were
examined one at a time and 20 failed** — motor show stands, dealership forecourts, foreign street
furniture, third-party advertising, a fire-service vehicle, a concept car that was never sold, and
two liveried competition cars. The library is reference photography. Approving from it will produce
a thin homepage; see the Future Roadmap item on commissioning.

### 2. Rejection does not reach the search page

**Owner: Engineering. Small.** `media_reviews` gates the homepage. Search still applies the static
list in `src/config/media/vehicle-photography-policy.ts`. The two agree today because both were
updated together this sprint, and they will drift the first time somebody rejects a frame in the
console and it keeps appearing in search results.

A rejection is a safety decision — "this is not the car, or must not be published" — so it must be
absolute rather than homepage-only.

### 3. Email provider credentials and a verified sending domain

**Owner: Founder / operations.** Enquiry notifications, dealer invitations and password resets all
compose correctly and cannot be delivered. Nothing in the repository can close this.

### 4. Production environment configuration

**Owner: Founder / operations.** `NEXT_PUBLIC_APP_URL` must be set *at build time* — it is baked
into canonical URLs, the sitemap and every share card. The Supabase Auth redirect allow-list must
include the production domain or sign-in fails after the redirect.

### 5. A scheduler and its secret

**Owner: Founder / operations.** Scheduled work — quality snapshots, integrity re-runs, freshness
checks — has no cron in this environment. The integrity check is a button on the review console so
it cannot silently never run, which is a mitigation rather than a fix.

### 6. Real dealership contact details

**Owner: Founder / dealerships.** AGENTS.md permits exactly three states: genuine, verified, or
explicitly marked demonstration. Records are currently `NULL` or platform-owned demonstration
values, which is the correct interim state — but a dealership cannot be sold to a buyer who has no
way to contact them.

---

## Post-launch improvements

Important, and the platform works without them.

- **A dealer-facing form for cover photography and the promotional headline.** The schema, the
  provenance column and the rendering all exist; there is no screen where a dealership uploads a
  cover, so every spotlight renders the graphic panel. Operations can populate it directly today.
- **Scheduled integrity re-runs.** Currently a button on the review console.
- **Bulk approval in the photography console.** Reviewing 40 frames one at a time is workable and
  not pleasant.
- **A Lighthouse and Core Web Vitals pass.** `scripts/measure-web-vitals.mjs` exists and has not
  been run against the production build this sprint.
- **PWA manifest.** No install experience.
- **Duplicate-VIN constraint.** A product decision recorded and not taken: whether two dealerships
  may list the same VIN.
- **Media provenance for imported photographs.** Blocks the dealer photograph import pipeline; the
  import itself works.
- **`/design-system` in production.** It renders publicly. Harmless, and it is an internal reference
  page that probably belongs behind the operations gate.

---

## Future roadmap

Deliberately postponed. None of these is a gap; each is a decision to do something later.

- **Commission real South African photography.** The Founder's own instruction, and on the evidence
  of this sprint the single highest-value item on this page — see below.
- **Dealer Spotlight as a billed product.** The placement, the approval gate and the presentation are
  built. Pricing, inventory of slots and billing are not.
- **Pixel-level photograph analysis.** The integrity rules detect *disagreement between records* —
  one frame leading two body styles, or a Raptor and a base model. They cannot see that a frame shows
  a cabriolet. That limit is deliberate: the media scorer already rated a brick-shopfront photograph
  78 out of 100, and a confident wrong answer is worse than none.
- **The PCP-037 surfaces never attempted:** Notification Centre, Verification Workspace extensions,
  Quality Centre, Founder Dashboard, Operations Centre, Buyer Account, Dealer CRM, Marketplace
  Intelligence, and a full dead-code sweep.

---

## The photography commission

The Founder's closing note is, on this sprint's evidence, correct — and the evidence is unusually
concrete, so it is recorded here rather than argued.

Every frame in the demonstration library is reference photography: taken to identify a model, record
a trim and show a plate, in whatever light there was, wherever the car happened to be standing. Motor
show halls, dealership forecourts, petrol stations, suburban kerbs and industrial yards are not
accidents in that genre — they are the genre. Twenty of twenty-four failed, and the failures were not
marginal: a fire-service command vehicle, a concept car nobody can buy, a WRC rally car captioned as
a R95 000 hatchback.

No curation logic turns reference photography into a magazine cover, and none of the merchandising
built over the last three sprints can raise that ceiling. It can only choose the best of what exists,
which it now does, and refuse the rest, which it now also does.

What a commission would need to cover, in rough order of value to the marketplace:

1. **Vehicles on location.** Chapman's Peak, Franschhoek Pass, the Karoo, Cape Town at blue hour, the
   Highveld in late afternoon. Whole vehicle, clean background, confident stance.
2. **Real dealership premises.** The Dealer Spotlight is a commercial product and currently renders a
   graphic panel because no dealership has supplied a cover. A photographed forecourt is the
   difference between a placement worth paying for and a gradient.
3. **Lifestyle frames that are unmistakably South African.** The lifestyle tiles currently draw on a
   cinematic set; the tiles that had no stock behind them have already been removed.

A marketplace built for South Africa should look unmistakably South African, and at present it looks
like whatever Wikipedia had.
