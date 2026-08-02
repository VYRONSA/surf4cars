# What stands between SURF4CARS and a dealership leaving AutoTrader

A founder report, not an engineering plan. Nothing here has been built.

The question asked was: *what is still preventing a real South African dealership from abandoning
AutoTrader or Cars.co.za and using SURF4CARS as its primary listing platform?*

The honest answer has three parts, and only the first is about features.

---

## The uncomfortable framing

A dealership does not leave AutoTrader because a competitor's software is nicer. It leaves when the
competitor **produces enquiries**. Everything below is scored against that, not against feature
parity.

Today SURF4CARS has **229 vehicles, 128 dealerships, 0 buyers, and no way for a dealership to sign
in**. A dealer evaluating it would not reach the listing wizard — which is the best part of the
product — because there is no account to reach it with.

That is the shape of the problem: the platform is far more built than it is *usable*, and the gap is
almost entirely in access, supply and delivery rather than in the marketplace itself.

---

## Launch blockers

Must exist before a real dealership can use the platform at all.

| # | What | Why it blocks | Effort | Dealer value |
|---|---|---|---|---|
| **B1** | **A way to give an existing dealership working credentials** | 98 seeded staff rows have no auth accounts. Registration creates a dealership; nothing issues credentials to one that already exists, and no dealer can sign in today | Low | Absolute |
| **B2** | **Email notification of enquiries** | Built and verified in PCP-030; needs a provider key, a verified sending domain and a scheduler. Until then a lead sits in a dashboard nobody is told to open | Low (configuration) | Absolute |
| **B3** | **Dealer contact details** | 0 of 128 dealerships have a telephone number. A buyer cannot ring anyone, and the enquiry form is the only route | Low (data) | Absolute |
| **B4** | **Photograph capacity** | 57 of 229 published vehicles have no photographs. A dealership's stock is invisible without them, and bulk upload from a phone is how dealers actually work | Medium | Absolute |
| **B5** | **Legal pages completed** | Company registration and a named POPIA Information Officer are still marked "founder review required" on live pages | Low (facts) | Compliance |

**B1 is the true blocker.** Everything else on this list can be worked around by a motivated founder
onboarding dealers by hand. B1 cannot: there is no door.

---

## Competitive advantages

Not needed to launch. These are what make a dealer *choose* SURF4CARS over the incumbent once both
work.

| # | What | Why it wins | Effort | Dealer value |
|---|---|---|---|---|
| **C1** | **Listing readiness, surfaced in inventory** | Built in PCP-035, not yet shown. AutoTrader tells a dealer nothing about why one listing outperforms another. "This car is missing 3 things buyers filter on" is a reason to log in daily | Low | High |
| **C2** | **Bulk import from an existing DMS or spreadsheet** | The single largest switching cost. A dealership with 80 cars will not retype them. This is the difference between "I'll try it" and "I moved" | High | Very high |
| **C3** | **Real enquiry response measurement** | The platform already writes an append-only lead timeline. Measuring first-response time turns it into the metric dealers compete on — and into the verified badge the platform cannot currently justify | Medium | High |
| **C4** | **View and enquiry telemetry per listing** | Dealers make pricing decisions on it. Currently marked "not connected yet" and honestly so. Incumbents sell this as a premium tier | Medium | High |
| **C5** | **Dealer verification workflow** | The state machine exists and is empty. A verified badge nobody can buy is worth more than one everybody has | Medium | High |
| **C6** | **Price positioning for dealers** | The buyer-facing version shipped in PCP-034. Turning it around — "your Hilux is R40 000 above the eight comparable listings" — is pricing intelligence dealers currently pay for separately | Low (engine exists) | High |

**C2 is the one that decides the business.** Every other item improves a dealership's experience once
they have moved. C2 is what determines whether they move.

---

## Future enhancements

Real value, no urgency.

| # | What | Note |
|---|---|---|
| F1 | Reviews and ratings | Currently "No reviews yet" everywhere, honestly. Needs a collection mechanism and moderation policy |
| F2 | Finance integration | Removed the invented estimate in PCP-032. A real partner rate turns it into a conversion tool |
| F3 | Multi-branch stock management | Branches exist in the schema; the portal treats a dealership as one place |
| F4 | Trade-in valuation | A page exists; there is no valuation model and inventing one would be the worst thing this platform could do |
| F5 | Saved searches and buyer alerts | Tables exist and are unused. Drives return visits, which drives enquiries |
| F6 | Syndication to other portals | Dealers rarely leave one platform outright; they add. Being easy to *add* is a faster route in than demanding exclusivity |

---

## If I had to sequence it

1. **B1** — issue credentials. Nothing else can be evaluated until a dealer can sign in.
2. **B2 + B3** — configure the provider, collect telephone numbers. Together these make an enquiry
   reach a human, which is the platform's only purpose.
3. **C1** — surface listing readiness. Cheap, already built, and it gives a dealer a reason to return.
4. **B4** — photograph capacity, probably as bulk upload from a phone.
5. **C2** — bulk import. The largest piece of work on this list and the one that decides whether
   dealerships actually switch.
6. **C3/C4** — measurement. These make the verified badge defensible and give dealers the numbers
   they currently buy elsewhere.

---

## One thing worth saying plainly

The product is in better shape than the platform is. The listing wizard is genuinely good — seven
steps, photographs first, autosave, live preview, per-step guidance. The marketplace, vehicle page
and intelligence layer are strong and honest.

What is missing is almost entirely **supply-side plumbing**: accounts, contact details, photographs,
notification configuration, and a route in for stock that already exists somewhere else. None of it is
hard. All of it is unglamorous, and none of it can be skipped.
