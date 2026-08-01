# PCP-032A — Premium Hero Refinement

The supplied concept was the benchmark. This records what changed, what was measured, every issue
found along the way, and what remains a founder decision.

**Re-run the evidence:**

```bash
node scripts/verify-hero-premium.mjs       # 30 checks — contrast, grid, brand dominance, finish, CLS
node scripts/verify-search-experience.mjs  # 49 checks — every control, history, refresh, results
node scripts/verify-marketplace-trust.mjs  # 36 checks — nothing invented came back
node scripts/measure-web-vitals.mjs        # CLS
npx tsc --noEmit && npx eslint src/ && npm run build
```

Last run: **30 / 49 / 36 passed, 0 failed.** CLS **0.000** desktop and mobile. Contrast 35/35 AA.
Typecheck, lint and build clean.

---

## 1. Before and after

| | |
|---|---|
| Before (PCP-031) | `screenshots/pcp031/after-hero-desktop.png` |
| After | `screenshots/pcp032a/after-hero-desktop.png`, `after-hero-mobile.png` |
| Marque at 3× | `screenshots/pcp032a/marque-zoom.png` |
| Scrolled masthead | `screenshots/pcp032a/header-scrolled.png` |

---

## 2. Wordmark scaling

| | Before | After |
|---|---|---|
| Wordmark type size | 26px | **80px** (`clamp(2.25rem, 5.2vw, 5.25rem)`) |
| Lockup width at 1536px | 161px | **493px** — 32% of the viewport |
| Ratio to a navigation label | 2.2× | **6.7×** |
| Position | In the masthead row | **Top-left of the hero frame**, 29px from the top |

**The device was redrawn.** At masthead size a symmetric arc read fine. At display size it read as
exactly what it was — a curved line. It now carries its mass left of centre where a cabin would be
and tapers across the remaining two thirds, with the red waistline starting after the nose and
stopping before the tail so the two strokes never run parallel. Two parallel strokes read as an
underline; offset ones read as motion.

**Crispness is preserved** because nothing is scaled. The mark is type and vector at its final size —
no transform, no raster. Verified: the metallic gradient is still clipped to the glyphs, and the
device spans the wordmark to within 2px at every size.

**Responsive behaviour** is `clamp` against the viewport rather than breakpoint steps, because the
photograph behind it scales continuously and a mark that steps while the image glides looks pasted
on. The upper bound matters as much as the lower: past ~5.5rem it would collide with the navigation
at 1280px.

---

## 3. Hero spacing

Every gap in the stack opened up, roughly a third more throughout.

| Gap | Before | After |
|---|---|---|
| Brand → eyebrow | n/a (brand was in the masthead) | `justify-between` — the brand holds the top, the rest holds the bottom |
| Eyebrow → headline | 20px | **32px** (`mt-8` / `sm:mt-10`) |
| Headline → rule | 20px | **28px / 36px** |
| Rule → supporting copy | 20px | **28px / 36px** |
| Copy → statistics | 24px | **32px / 44px** |
| Statistics → search panel | 28px | **36px / 56px** |
| Stat card padding | 20×14px | **24×16px** |
| Hero height | 94svh | **100svh** |

---

## 4. Composition

The hierarchy the brief asked for, top to bottom: **SURF4CARS → FIND THE ONE → supporting copy →
statistics → search panel.** Verified on the rendered page rather than asserted:

- Brand, eyebrow, headline, rule, copy and search panel share one left edge to **0.00px**.
- The brand sits **29px** from the top of the frame, sharing a horizontal band with the navigation.
  They never collide — the mark is 493px wide, the navigation begins past 900px.
- The brand is **hidden in the masthead** while the hero shows its own, so it is never duplicated.

---

## 5. Navigation

Stepped back so the eye reaches the marque first: labels a size down (12px), lighter weight, tracked
out, in `--color-muted` rather than `--color-muted-foreground`; both pills reduced from 44px to 40px
with smaller type. All three destinations still resolve — verified by fetching each.

---

## 6. Photography

Unchanged, and deliberately less obscured on the right. The copy-column wash is confined to the left
82% of the frame at every stop, so **the mountain, the road and the car are exactly as photographed**.
Deepening the left side is what allowed the right side to be left alone.

---

## 7. Search verification — 49 checks, 0 failures

Not "results appeared" — **results were checked against what was asked for.**

| Case | Result |
|---|---|
| Make | 21 makes from live stock; all 24 results were the requested make |
| Model | Disabled until a make is chosen, then narrowed to that make's models; all results matched both |
| Price ceiling | Highest returned result R300 000 against a R300 000 ceiling |
| Body type / Location | Reach the query and return matching results |
| Describe It | Suggestion chips fill the field and return cars |
| One-tap chips | Body type, Make and Price all navigate with the right parameter and return results |
| Recent searches | Appear only after a real search; Clear all clears; survives reload |
| Sorting | Ascending genuinely ascends, descending genuinely descends, the two differ |
| Pagination | Page 2 is a different set |
| Empty results | Impossible filter returns 0 cards **and says so** |
| Invalid input | Script injection, non-numeric prices, negative pages, 600-character make, SQL-shaped sort — none 500s, nothing executes |
| **Deep link** | A URL with make + body type + sort returns exactly those vehicles |
| **Refresh** | Same results, same URL |
| **Browser Back** | Returns the previous search, not the homepage |
| **Browser Forward** | Returns the later search |
| **Back to the hero** | The homepage search is fully functional again |
| Keyboard | Tab runs the control row to the button; Enter fires; focus ring visible (4px, 0.55 alpha) |
| Mobile | No overflow, controls reachable, search returns results |
| Console | Zero errors across the whole run |

---

## 8. Premium polish

Measured, not eyeballed:

- Six controls, **one corner radius** (12px), **one height** (68px), action button matching exactly.
- **Three icon sizes** across the whole panel (16px UI, 20px action, 12×8 chevron).
- Every interactive element carries a 0.2s transition; the page renders correctly under
  `prefers-reduced-motion`.
- One control disabled, honestly: Model, until a make is chosen.
- No dead or disabled control anywhere in the masthead.

---

## 9. Every issue found and fixed

| # | Issue | How it was found | Fix |
|---|---|---|---|
| 1 | Growing the masthead to hold the brand pushed the photograph down and left a dark band across the top | Screenshot | The hero's negative offset is a fixed 4.5rem; the bar stays 4.5rem and the brand lives in the hero |
| 2 | **Collapsing the brand on scroll cost the 0.000 CLS** — 0.011 desktop, 0.005 mobile | `measure-web-vitals` | Stopped changing geometry entirely. The large lockup scrolls away in normal flow; the masthead mark is a constant size and fades on opacity alone |
| 3 | Making the brand absolute-only-when-large took it in and out of the flex row, still shifting layout | `measure-web-vitals` — 0.011 persisted | Same fix as #2 |
| 4 | The absolutely-positioned brand aligned to the viewport (40px), not the content column (108px) | `verify-hero-premium` | Positioned against the container; verified 108.0 vs 108.0 |
| 5 | Sub-headline contrast fell to **3.75:1** when the taller hero moved it into the city-lights band | `verify-hero-premium` pixel sampling | Wash deepened to 0.96/0.945 across the copy column. Now **5.06:1** |
| 6 | Sub-headline fell again to 3.07:1 at an earlier stage of the same work | Same | Narrower measure plus a lighter tone |
| 7 | The search panel dropped below the fold once spacing increased | Bounding-box measurement | Hero to 100svh, padding rebalanced |
| 8 | The provinces stat used a shield icon | Review | `MapPin` — the icon should say what the number is |
| 9 | Stale duplicated comment blocks left the hero JSX malformed after repeated patching | Rendered page showed **one** marque, not two | Region rewritten cleanly |
| 10 | `networkidle` hung for the full 90s on a page that had rendered | Suite timeout | Navigations wait for the asserted element instead |
| 11 | Brand-dominance checks measured the hidden masthead mark (26px) instead of the hero lockup (80px) | Suite failure | Assertions retargeted |
| 12 | Forward-navigation assertion read the previous page's cards mid-swap | Intermittent failure whose own detail line showed the correct URL | Waits for the expected URL, then settles |
| 13 | Mobile screenshot captured mid-page — the browser restores scroll across reload | Screenshot review | Fresh context per capture |

---

## 10. Deviation from the concept

**One, deliberate.** The concept shows **"229+"** and **"43+"**. The platform renders **229** and
**43**.

PCP-032 established that no customer-facing number may be a marketing number, and "229+" is vaguer
than the truth without being more useful — at the moment of render there are exactly 229 vehicles, so
"more than 229" is the one reading that is not correct. A marketplace that knows its stock to the
unit should say so.

**This is a founder decision, not an engineering one.** If the "+" is wanted for visual parity it is a
two-character change, and I have not made it unilaterally because it is a claim rather than a style.

---

## 11. Remaining founder decisions

Carried forward from PCP-032, unchanged and still open:

| # | Decision |
|---|---|
| 1 | **"229+" vs "229"** — see above |
| 2 | Reinstate finance figures with a real partner rate and disclosure line |
| 3 | Build a verification workflow, or leave every dealership unverified |
| 4 | Collect reviews, or leave "No reviews yet" indefinitely |
| 5 | Capture trading-since dates and measure response times |
| 6 | Dealer contact details — still 0 of 128 |
| 7 | Photography commissioning — 18 of 19 reviewed frames fail the standard |
| 8 | Brand name: SURF4CARS or SURF FOR CARS (wordmark and metadata still disagree) |

---

## 12. Success criteria

| Criterion | Status |
|---|---|
| The wordmark is the unmistakable focal point | **Met** — 6.7× a navigation label, 32% of the viewport, top-left of the frame |
| The hero feels like a premium automotive brand, not a software landing page | **Met** — brand-first title-card composition, generous spacing, uninterrupted photography |
| The search experience is fully verified and production-ready | **Met** — 49 checks including history, refresh and deep links, all asserting on result contents |
| The homepage matches the concept without compromising architecture or introducing fake content | **Met** — one deliberate deviation, flagged above; no functionality removed; 36 trust checks still pass |
| No performance regression | **Met** — CLS 0.000, LCP unchanged, no JavaScript added to the hero's critical path |

### Would someone believe it was designed by the same studio?

The composition, the lockup, the proportions, the spacing rhythm, the glass panel and the colour
treatment all follow the concept. The differences that remain are the ones where the concept asserts
something the data cannot support — and those are the differences worth keeping.
