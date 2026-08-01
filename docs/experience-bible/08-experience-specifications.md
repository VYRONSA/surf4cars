# 08 — Experience Specifications

Surface-by-surface specification. Every section states **its purpose** — a section that cannot state
one does not ship.

---

## 1. Homepage

**Job:** get a buyer into a filtered result set in under ten seconds, and make them believe this is
the most serious car platform in South Africa within three.

**Density:** editorial. **Feeling:** arrival at a showroom after hours.

### 1.1 Hero — *purpose: establish the brand and start the search*

Full-bleed South African automotive photography (see [03](03-photography.md)), scrim from the bottom,
one display headline (`--text-display-xl`, the only use on the site), and **the search bar as the
focal point** — not a button leading to search.

**The hero image is the single highest-leverage asset in the product.** It currently underperforms
and needs art direction, not code.

Never: a carousel, an autoplaying video with sound, a countdown, or a newsletter overlay.

### 1.2 Search — *purpose: the primary conversion path*

`xl` search input on `.glass-hero-float`, with make, model, price range and province inline.
Live result count on the submit button: **"Show 1 284 vehicles"** — never a bare "Search". Below it,
3–5 popular searches as chips.

### 1.3 Featured vehicles — *purpose: prove inventory quality immediately*

6–8 `VehicleCard`s in a grid. **Genuinely the best stock**, not paid placement dressed as editorial.
If placement is paid, label it.

### 1.4 Categories — *purpose: serve browsers who don't know what they want*

6–8 photographic tiles (SUV, Bakkie, Hatchback, Sedan, Double Cab, Electric, Luxury, Family). Real
photography, never icons. Each carries a live count.

### 1.5 Popular searches — *purpose: reduce blank-page paralysis, and expose long-tail SEO*

Chips linking to pre-filtered result sets. Real demand data, not a hand-maintained list.

### 1.6 Latest arrivals — *purpose: give returning visitors a reason to return*

Newest published stock, newest first, with relative timestamps. This is the "what's new since I last
looked" section and should reward frequent visits.

### 1.7 Premium dealers — *purpose: build trust and serve the dealer side of the marketplace*

`DealerCard`s for verified/accredited dealers with the champagne mark. Real premises photography.

### 1.8 Finance — *purpose: convert browsers who assume they can't afford it*

A single calculator: vehicle price → deposit → term → **monthly estimate**. Every assumption stated.
Never presented as an approval or a quote. Links to a real application, never a lead-capture trap.

### 1.9 SURF Intelligence — *purpose: differentiate*

Show the product doing something no competitor can: a live market insight from real data. **Never a
chat bubble.** A card with a conclusion, its reasoning, and the data behind it.

### 1.10 Reviews — *purpose: social proof*

Real, attributed, specific. A named buyer, the vehicle, the dealer. Never anonymous five-star
generics — they read as fabricated and cost more trust than they earn.

### 1.11 Footer — *purpose: navigation, trust and SEO*

Full sitemap, legal, contact, popular searches by city and make. Dense, quiet, `--text-body-sm` in
`--color-muted-foreground`. The footer is where SEO lives; treat it as content.

---

## 2. Marketplace & Search

**Job:** narrow 2 000+ vehicles to a shortlist without the buyer ever feeling lost.

**Density:** marketplace. **Feeling:** in control, spoiled for choice.

**Layout:** persistent left filter rail (desktop) · results grid · sticky toolbar with count, sort
and view toggle. Below `lg`, filters become a bottom sheet.

**Search.** Free-text spans make, model, variant, body and dealer. Query persists in the URL — every
result set must be shareable and bookmarkable. Never clear the query on back-navigation.

**Filters.** Apply instantly, no "Apply" button. Each shows its result count *before* selection
(`Diesel (284)`). Zero-yield options are disabled, not hidden — hiding them makes the catalogue feel
smaller. Active filters appear as removable chips above the results, with a single "Start over".
Price and mileage use dual-handle sliders with numeric inputs.

**Cards.** `VehicleCard` in a responsive grid: 1 column mobile, 2 tablet, 3–4 desktop. Consistent
16:9 imagery, zero layout shift.

**Sorting.** Relevance (default) · Price low→high · Price high→low · Newest · Mileage · Year.
Relevance is our intelligence surfacing — it must be defensible.

**Pagination.** Numbered, URL-driven — never infinite scroll. Buyers compare, leave, and return;
infinite scroll destroys that and is bad for SEO.

**Comparison.** Select up to 4 vehicles into a persistent tray, then a side-by-side table where
**differences are highlighted and identical rows de-emphasised**. This is the one place a buyer sees
a table.

**Saved vehicles / saved searches / alerts.** Save is one tap from a card, optimistic, and never
opens a dialog. Saved searches notify on new matches. *(Not currently implemented — see
[09](09-rollout-plan.md).)*

**Dealer interaction.** Dealer name and verification on every card; the dealer is never anonymous.
Contact happens on the vehicle page, not the grid.

**Recommendations & AI.** "You might also like" after the first screen of results, based on what the
buyer has actually viewed. If the query is unusual or yields nothing, SURF Intelligence offers the
smallest useful relaxation: *"Nothing under R300 000 with under 60 000 km. Widening to R320 000 finds
14."*

---

## 3. Vehicle Detail

**Job:** answer every question a buyer would ask a salesperson, in the order they would ask it,
before they have to ask. **This is the emotional peak of the product.**

> **Blocked by PCP-001K2.** Do not redesign until the publish and read paths are certified.

**Feeling:** certainty.

**Order matters** — it mirrors how someone inspects a car in person:

1. **Gallery** — full-bleed, 3:2, keyboard navigable, full-screen with pinch-zoom. Thumbnail strip.
   Photo count visible. **The largest element on the page.**
2. **Identity & price** — year, make, model, variant. Price at `--text-h2`+, `--color-foreground`,
   never red. Beside it, **market context**: "R12 000 below similar vehicles" — price alone invites
   suspicion; price with context builds trust.
3. **Key specifications** — mileage, fuel, transmission, body, colour, engine. Scannable, six items,
   not a 40-row table.
4. **Primary CTA block** — sticky on desktop, fixed bottom bar on mobile. Hierarchy: **Message
   Dealer** (primary) · Call Dealer · Arrange a Viewing · Save. Exactly one primary.
5. **Dealer** — name, verification, location, photograph of real premises, response time, link to
   their other stock. The buyer is buying from a person.
6. **What to know** — honest defect disclosure with photographs. Respectfully labelled. **This
   section is a differentiator, not a liability.**
7. **Full specifications** — progressively disclosed. Complete, but not in the way.
8. **History & inspection** — service history, previous owners, inspection report, roadworthy
   status. Verified facts must be visually distinct from dealer-supplied claims.
9. **Finance** — monthly estimate from this vehicle's actual price, with assumptions stated. Trade-in
   valuation and insurance quote as calm, non-intrusive options.
10. **Market intelligence** — where this price sits, days listed, comparable sales. **Show this even
    when unflattering.** A platform that only shows good news is not trusted.
11. **AI summary** — 2–3 sentences of what matters about *this* vehicle, including the negative.
    Never generic. If there is nothing specific to say, show nothing.
12. **Related vehicles** — 4–6 `VehicleCard`s: same segment, similar price, alternatives from the
    same dealer.

**Never:** a price behind a form. An anonymous seller. Fewer than 6 photographs. Stock manufacturer
imagery in place of the actual car. Fake urgency.

---

## 4. Dealer Experience

**Job:** an executive cockpit — the dealer's morning briefing and their working surface.

**Density:** cockpit. **Feeling:** command, clarity, momentum.

**Shell:** persistent `.glass-sidebar`, dense header with dealership switcher, global search scoped
to their stock.

### Dashboard — *purpose: what needs attention today*

Not a wall of metrics. Ordered by urgency: **enquiries awaiting response** (with elapsed timers) →
**stock needing attention** (incomplete listings, ageing stock, low photo counts) → **performance
at a glance** (4 `MetricCard`s with deltas and direction arrows) → **market movement** → **activity
feed**.

Every metric answers "compared to what?" — a number without a baseline is decoration.

### My Stock — *purpose: manage the floor*

Table with thumbnail, vehicle, price, status, days listed, views, enquiries, completeness. Sortable,
filterable, bulk-selectable. Ageing stock flagged in `--color-warning`. Inline price edit. Bulk
actions: publish, unpublish, reprice, export.

### Publishing — *purpose: the dealer's creative act*

Stepped, autosaving, with a **live preview of the buyer-facing `VehicleCard` as they type**. This
single feature converts form-filling into craft. Completeness score that rewards. Photos step is
prominent — drag-and-drop, reorderable, with the front three-quarter designated as hero. Guidance
inline, in the dealer's language ("Add a dashboard photo with the odometer visible").

Never lose work. Never validate before the user has finished a field. "Preparing your listing…"

### Enquiries — *purpose: convert*

List ordered by **age, not arrival** — the oldest unanswered is the most urgent. Buyer name,
vehicle, message, elapsed time. One-tap call and message. Response time shown against the dealer's
own average. Status through to sold.

### Performance & Market Intelligence — *purpose: decide*

Views, enquiries, conversion, days-to-sell — always against a benchmark. Market intelligence answers
"what should I buy and what should I reprice?" with specific, actioned recommendations.

### Media — *purpose: bulk work*

Grid, bulk upload, drag reorder, per-vehicle assignment, quality warnings (low resolution, too few
images, missing required shots).

---

## 5. Buyer Experience

**Job:** support a months-long decision across sessions and devices.

**Discovery:** homepage → search → detail, with recently viewed persisting.
**Comparison:** up to 4 side-by-side, differences highlighted.
**Saved vehicles & searches:** one tap, optimistic, synced. Saved searches produce alerts on new
matches and price drops — the strongest retention mechanic available. *(Not implemented.)*
**Finance:** consistent calculator everywhere, assumptions always stated, never a bait-and-switch.
**AI assistant:** answers in the buyer's language — "reliable family car under R350 000 in Cape
Town" — and returns vehicles with reasoning.
**Alerts:** email and push, batched, never more than one per day by default.

---

## 6. SURF Intelligence

**Job:** be the reason someone chooses SURF4CARS. **It must not resemble a chatbot.**

**A chatbot** is a text box that waits, replies in bubbles, has a personality, and pretends to type.
**SURF Intelligence** is an analyst embedded in the product that produces **structured, cited,
actionable output**.

**Layout:** responses are **rich cards, not messages** — a conclusion in `--text-body-lg`, the
reasoning beneath it, a chart or `VehicleCard`s where relevant, and the data provenance in
`--text-caption`. No bubbles. No avatar. No typing indicator. No "Hi! How can I help you today?".

**Tone:** conclusion first, then reasoning. Always cite the data set and period. Honest about
confidence — **when confidence is low, say less.** Never "As an AI". Never speculate about a
specific vehicle's mechanical condition. Volunteers the negative.

**Surfaces:** buyer discovery (natural-language search with reasoning) · vehicle explanation (why
this car, at this price, now) · dealer insight (what to reprice, what to buy) · market intelligence
(segment movement) · listing assistance (how to improve this listing).

**Visual identity:** `--color-primary` at low emphasis — a hairline, a small mark. **AI gets no
colour of its own.** It is part of the product, not a bolt-on.

**Hard rule:** never dress a static rule as AI, and never present model output as verified fact.

---

## 7. Mobile

Most buyer traffic is mobile. Mobile is not a compressed desktop — it is the primary buyer surface.

**Navigation:** bottom bar, max 5 items, thumb-reachable, **icons with labels**. Search is centre and
prominent. Never a hamburger for primary navigation.

**Search:** full-screen on focus. Filters in a bottom sheet with a sticky "Show 284 vehicles". Never
a modal that hides the result count.

**Cards:** single column, full-width photography, price and key facts only. Larger touch targets
(≥44px). Save is a tap on the card, never a long-press.

**Gallery:** swipe horizontally, pinch to zoom, tap for full screen. Position indicator always
visible.

**Gestures:** swipe is always additive — never the *only* way to do something. No swipe-to-delete
without a visible alternative. Pull-to-refresh on feeds only.

**Quick actions:** sticky bottom CTA on vehicle detail (Message · Call · Save). Tap-to-call is a
native `tel:` link. Never a form where a phone call would be faster.

**Performance:** photography is the payload. Responsive sizes, lazy loading below the fold, fixed
ratios so nothing shifts. **Zero cumulative layout shift is a requirement, not a target.**

---

## 8. Tablet

Primarily a **dealer** device — used on the floor, beside the car, usually landscape.

**Landscape workflow:** two-pane. List or grid left, detail or editor right. No navigation away to
edit a single field.

**Inventory editing:** tap a row, edit in the right pane, save without losing scroll position. Inline
price and status editing directly in the table.

**Media management:** this is the tablet's strongest use case — a dealer standing beside a car,
photographing and uploading. Large drop targets, drag-to-reorder with generous handles, immediate
thumbnails, upload progress per file, and graceful recovery on a dropped connection.

**Touch:** all targets ≥44px even in cockpit density. Hover states must have tap equivalents. Never
require a right-click.
