# PCP-031 — Premium Hero Transformation

The supplied concept was the benchmark. This records what was built, what was measured, where the
result deviates from the concept and why, and what the audit found along the way.

**Re-run the evidence:**

```bash
node scripts/verify-search-experience.mjs   # 43 checks — every control, every mode, real results
node scripts/verify-hero-premium.mjs        # 24 checks — contrast over photography, grid, finish
node scripts/measure-web-vitals.mjs         # CLS
npx tsc --noEmit && npx eslint src/ && npm run build
```

Last run: **43 passed / 0 failed**, **24 passed / 0 failed**, **CLS 0.000 on every page**, typecheck
clean, lint clean, build clean.

---

## 1. Before and after

| | |
|---|---|
| Before | `screenshots/pcp031/before-hero-desktop.png`, `before-hero-mobile.png` |
| After | `screenshots/pcp031/after-hero-desktop.png`, `after-hero-mobile.png` |
| Marque | `screenshots/pcp031/marque-zoom.png` (4× scale) |

**What changed structurally.** The old hero put a display-scale wordmark in the middle-left of the
frame and hid the masthead's own mark to avoid showing the brand twice. The concept resolves that
differently: the marque lives in the masthead permanently and the hero's largest element is the
statement. That also fixed an inconsistency the old arrangement had — the brand was absent from the
first screen of every interior page and reappeared on scroll.

---

## 2. The wordmark

A marque is a lockup, not a word in a typeface. Four things were added and three deliberately were
not.

**Added:** a drawn device (a car's roofline in profile, opening from a fine point into a full stroke,
with the performance red trailing beneath as a second, faster line); a brushed-metal surface; optical
spacing that gives the numeral its own margins; a locality line.

**Not added, because the brief forbids them and each is a way to look cheap while trying not to:**
no glow, no bevel, no two-stop grey fade. The metal has exactly one specular band — real chrome has
one, and a second destroys the illusion instantly.

Verified: the device spans the wordmark to within 2px, the surface is a gradient clipped to the
glyphs, there is no blur filter anywhere on the mark, and the whole lockup announces once as
"SURF4CARS" rather than as "surf four cars".

---

## 3. Search — the part that had to keep working

**Nothing on the panel is decorative.** Every option in every dropdown is derived from the published
stock the search will actually look through. A hardcoded make list is a promise the marketplace
cannot keep: offer a marque with no stock behind it and the visitor's first action returns an empty
page, on the hero, before they have seen a car. Models are keyed by make for the same reason.

Five modes, each a genuinely different way people arrive:

| Mode | What it is | Verified |
|---|---|---|
| Search vehicles | Six controls → `/search` | make, model, price floor/ceiling, body type, province all reach the query and filter correctly |
| Describe it | Natural language + example chips | Chips fill the input; sentences now return cars (see §6) |
| Body type | One tap per body style, with live counts | Navigates and returns results |
| Make | One tap per marque, with live counts | Navigates and returns results |
| Price | One tap per band | Navigates and returns results |

**Results are checked for contents, not just for existence.** Selecting Toyota must return Toyotas
and a R300 000 ceiling must return nothing above it — a search page that silently ignores a
parameter returns a beautiful grid of the wrong cars, and that is indistinguishable from working
unless somebody looks.

### Search verification — 43 checks, 0 failures

| Area | Result |
|---|---|
| Make | 21 makes from live stock; all 24 results matched the requested make |
| Model | Disabled until a make is chosen, then narrowed to that make's 6 models; all results matched both |
| Price | Ceiling reached the query; highest result R300 000 against a R300 000 ceiling |
| Body type / location | Both reach the query and return results |
| Free text | Suggestion chip fills the input, submits, and returns cars |
| Suggestions | All four chips populate the field |
| One-tap modes | All three navigate with the right parameter and return results |
| Recent searches | Appear only after a real search; "Clear all" clears; survives reload |
| Sorting | Ascending is genuinely ascending, descending genuinely descending, the two differ |
| Pagination | Page 2 returns a different set |
| Empty results | An impossible filter returns 0 cards **and says so** |
| Invalid input | Script injection, non-numeric prices, negative pages, a 600-character make, a SQL-looking sort — none 500s, nothing executes |
| Keyboard | Tab order runs through the controls to the button; Enter fires the search; focus is visible |
| Mobile | No horizontal overflow, controls reachable, search returns results |
| Console | Zero errors across the whole run |

---

## 4. Composition, typography and finish

Measured rather than eyeballed:

- **One visual grid** — eyebrow, headline, rule, sub-headline and search panel share a left edge to
  **0.00px**. The masthead marque now shares it too; it was 8px out, which reads as a mistake rather
  than a decision.
- **Controls** — six selects, one corner radius, one height (68px), and the action button matches
  that height exactly.
- **Icons** — three sizes across the whole panel (16px UI, 20px action, 12×8 chevron).
- **Motion** — every interactive element carries a 0.2s transition; the page renders correctly under
  `prefers-reduced-motion`.
- **Nothing disabled except one thing, honestly** — the Model control, until a make is chosen. A
  select whose only option is "Any…" cannot do anything, and saying so is better than opening an
  empty list.

**Navigation: three destinations, not the concept's six.** `/dealers` exists only as `[slug]` so its
index 404s; `/sell-my-car` and `/about` do not exist. Rule 7 — "every navigation item must have a
destination, nothing decorative" — outranks matching the picture, and this codebase has spent
several programmes removing dead links. Every remaining item was fetched and returns < 400.

---

## 5. Performance

| Metric | Before | After |
|---|---|---|
| CLS (home, desktop) | 0.000 | **0.000** |
| CLS (home, mobile) | 0.000 | **0.000** |
| LCP (home, desktop, dev server) | 1844ms | 1844ms |
| Build | clean | clean |
| Typecheck / lint | clean | clean |

**No JavaScript was added to the hero's critical path.** The hero is a server component: headline,
marque, stat cards and scrims are static markup. The only client island is the search panel, which is
the one part that has to be interactive. Recent searches are read through `useSyncExternalStore`
rather than an effect, so there is no second render and no flash of a row appearing late.

---

## 6. What the audit found

Three defects surfaced that were not part of the brief. Two were fixed; one is reported.

### Fixed — described searches returned nothing

Free text was matched as a **single substring** against a vehicle's document, so any sentence
returned zero results. Measured: `"Toyota Hilux"` → 9 results, `"Family SUV under R500 000 in Cape
Town"` → **0** — and that string is one of the four example chips printed on the hero to teach people
that describing works.

Fixed in two halves: descriptions are parsed into the filters the search already supported (budget,
body style, fuel, gearbox, province, year, mileage), and the residual text now matches by token
instead of as one phrase. Explicit URL parameters always win, so a saved or shared link is never
overruled by a sentence. It does not guess — every rule matches an explicit word or number.

### Fixed — the hero's own contrast, after the composition moved

Lifting the statement into the middle of the frame moved it out of the scrim tuned for a headline at
the bottom. Measured **2.40:1** on the headline and **2.06:1** on the sub-headline, against 3:1 and
4.5:1. Neither was visible to `audit-design-contrast.mjs`, which reads token pairings and cannot see
a photograph. Retuned and re-measured to **3.14:1** and **4.62:1** by sampling rendered pixels.

### Reported, not fixed — dealer trust data is fabricated

`src/services/vehicle-engine/vehicle-platform.repository.ts` sets, for **every dealership on the
platform**:

```
verified: true          rating: 4.8          reviewCount: 24
responseTime: "within 15 minutes"            yearsInBusiness: 8
```

None of it is measured from anything, and there is no verification column in the database to measure
it from. Every dealer page therefore shows a 4.8-star rating from 24 reviews for a business that has
never been reviewed, and the search page's own header reads "Every listing verified".

This is the exact failure AGENTS.md is written about: *an obviously fake placeholder gets fixed, a
convincing one gets trusted.* `4.8 ★ (24)` looks precisely like real data, and nobody checks.

It is reported rather than fixed because removing it changes what every dealer page and listing card
displays across the platform — a product decision about what the marketplace claims, not a hero
change, and this brief explicitly excludes redesigning functionality.

**What it cost this hero:** the concept's "Verified Dealers", "Trusted Marketplace" and "Local
Support" cards could not ship, and the previous sub-headline "Every vehicle. Every verified dealer."
had to go. The three stats that did ship — 229 vehicles, 43 dealerships, 7 provinces — are each
countable, and each card renders only when its number is real.

**Recommended next:** either build a verification workflow that sets a real status, or strip the
rating, review count, response time and years-in-business from the projection until they can be
measured. Until one of those happens the platform is publishing believable fiction about other
people's businesses.

---

## 7. Deviations from the concept, and why

| Concept | Shipped | Reason |
|---|---|---|
| Six nav items | Three | `/dealers`, `/sell-my-car`, `/about` have no destination. Rule 7 |
| "229+ Vehicles" | "229 Vehicles" | A marketplace that knows its stock to the unit should say so |
| "Verified Dealers" card | "43 Dealerships" | No verification data exists — see §6 |
| "Trusted Marketplace" card | "7 Provinces" | An adjective, not a figure |
| "Local Support" card | *(omitted)* | Would promise a support function that does not exist |
| "South Africa's trusted car marketplace" | "South Africa's dealership marketplace" | "Trusted" asserts a reputation not yet earned; "dealership" is verifiable from the data model |
| Bottom assurance strip | *(omitted)* | "Quality guaranteed", "All dealers are verified", "Best prices" — three claims the platform cannot substantiate |
| Pre-filled "Recent searches" | Renders only when real | A first-time visitor has no history; four plausible entries presented as theirs is fabrication |
| "Advanced search" tab | "Describe it" tab | The natural-language search is an existing working feature and the brief forbids removing one; "Advanced search" is `/search` itself, reachable from Marketplace |

Everything else — full-bleed photography, blue-hour lighting, floating navigation, the two-line
uppercase statement with the accent word, the rule beneath it, the stat row, the glass search panel
with mode tabs and six controls, the red action button carrying the live count — follows the concept.
