# 07 — Brand Governance

Rules that hold the language together as the team and codebase grow. These are **not** style
preferences — breaking one produces a defect, not a difference of opinion.

---

## 1. Hard rules

Violating any of these blocks a pull request.

### Colour

1. **Never hardcode a colour.** No hex, `rgb()`, `hsl()`, or Tailwind palette class (`bg-blue-500`)
   in application code. Every colour is a `var(--color-*)` token.
2. **Never introduce a blue primary action.** No blue button, link, focus ring, or gradient. Blue is
   informational only.
3. **Never add a second accent colour.** Red (`--color-primary`) and champagne
   (`--color-accent`) are the only decorative colours. Adding a third breaks the system.
4. **Never add a colour token without a contrast check.** New tokens must be added to
   `scripts/audit-design-contrast.mjs`.
5. **Never reintroduce a light theme.** No `prefers-color-scheme: light` block, no theme toggle.
6. **Never use `--color-primary` for small text.** Use `--color-primary-text`.
7. **Never use `--color-border` on a form control.** Use `--color-border-interactive`.

### Type, space, shape

8. **Never a font size outside `typography.css`.** No arbitrary `text-[17px]`.
9. **Never a spacing value outside the 4px scale.**
10. **Never a second typeface.** One family, including for dealer branding.
11. **Never more than one `<h1>` per page**, and never skip heading levels for visual reasons.

### Components

12. **Never duplicate a component.** Check `src/components/ui/index.ts` and `/design-system` first.
    Extend with a variant; do not fork.
13. **Never build a bespoke vehicle or dealer card.** Use `VehicleCard` / `DealerCard`.
14. **Never define component-local durations or easings.** Use the `.motion-*` classes so
    reduced-motion keeps working.
15. **Never use inline `style` for anything the token system covers.** Permitted only for genuinely
    dynamic values (a progress width, a chart geometry).
16. **Never remove a focus ring** without an equally visible replacement.

### Content & imagery

17. **Never mix icon sets.** One library, one weight, one grid.
18. **Never use illustrations, mascots, 3D renders or vector scenes.** Photography or nothing.
19. **Never use emoji in product UI.**
20. **Never let a dealer's branding introduce a colour into the interface.**
21. **Never ship a screen without empty, loading and error states.**
22. **Never use a banned term from [05](05-writing-style.md)** in user-visible copy.

### Trust

23. **Never present computed or estimated data with the same weight as verified fact.**
24. **Never label something AI-generated when it is a static rule** — or the reverse.
25. **Never use dark patterns.** No fake scarcity, no countdown timers, no pre-ticked consent, no
    disguised advertising, no obstructed unsubscribe.

---

## 2. What is enforced automatically

| Rule | Enforced by | Status |
| --- | --- | --- |
| Contrast of all token pairings | `scripts/audit-design-contrast.mjs` | **Active** — exits 1 on failure |
| Schema/domain drift | `scripts/audit-vehicle-schema.mjs` | **Active** |
| Type safety | `tsc --noEmit` | Active |
| Lint | `npm run lint` | Active |
| Reduced motion | Centralised in `motion.css` | Active |

### Recommended additions

These are **not yet built**. They are the highest-value governance work available, because every
rule below is currently enforced by review alone — and review does not scale.

| Proposed gate | Catches |
| --- | --- |
| **Hardcoded-colour lint** — fail on hex/`rgb()`/Tailwind palette classes in `src/` (allow `src/styles/tokens/`) | Rules 1, 2 |
| **Arbitrary-value lint** — fail on `text-[…px]` and off-scale spacing | Rules 8, 9 |
| **Duplicate-component audit** — flag new files whose exported name resembles an existing primitive | Rule 12 |
| **Banned-terms lint** — scan JSX text and string literals for the [05](05-writing-style.md) left column | Rule 22 |
| **Visual regression** on `/design-system` | Silent drift in the primitive layer |

The showcase at `/design-system` already renders every primitive in every variant, which makes it a
ready-made visual-regression target. That is the cheapest next gate to add.

---

## 3. Review checklist

Copy into any UI pull request.

**Visual**
- [ ] Zero hardcoded colours; all via tokens
- [ ] Exactly one `variant="primary"` button in view
- [ ] No blue used as a primary or brand colour
- [ ] Surface elevation follows the ramp, no skipped steps
- [ ] Correct density tier (editorial / marketplace / cockpit)
- [ ] Glass only on genuinely floating surfaces
- [ ] Type sizes from the scale only

**Content**
- [ ] No banned vocabulary
- [ ] Buttons are verb + noun and name the outcome
- [ ] Errors say what happened and what to do next
- [ ] No exclamation marks, no emoji, no "Oops"
- [ ] South African English, `R 449 900` price format

**States**
- [ ] Empty, loading (skeleton), error, partial states all designed
- [ ] Zero-result search shows active filters
- [ ] Disabled controls explain why

**Interaction**
- [ ] Uses `.motion-*` classes, no local durations
- [ ] Visible focus ring on every interactive element
- [ ] Keyboard reachable; card click targets included
- [ ] Verified under `prefers-reduced-motion: reduce`
- [ ] No hover-only essential information

**Media**
- [ ] Fixed aspect-ratio containers; zero layout shift
- [ ] Scrim behind any text over photography
- [ ] Image failure falls back to a matte surface, never a broken glyph

**Components**
- [ ] No new component that duplicates an existing one
- [ ] Specialist cards used where they exist
- [ ] Buyer browsing uses cards, not tables

---

## 4. Changing this document

The Bible is versioned with the code. To change a rule:

1. Open a pull request against `docs/experience-bible/` **before** the implementation.
2. State the rule, why it fails, and what replaces it.
3. Changes to §1 Hard rules require explicit sign-off — they are load-bearing.
4. If a rule is broken more than three times by good engineers, the rule is probably wrong. Fix the
   rule, not the people.

**Token values are owned by `colors.css`, not by this document.** Never restate a hex value here;
reference the token name so there is exactly one source of truth.

---

## Illustrative content must never be indistinguishable from actual content

A permanent rule, and one of the platform's strongest differentiators.

If something is **illustrative, estimated, calculated, simulated or generated**, SURF4CARS says so — clearly,
in the place the customer forms their judgement, not in fine print they read afterwards.

This applies without exception to:

| Content | Must declare |
| --- | --- |
| Vehicle photographs | `dealer` (the actual car) · `library` / `manufacturer` (labelled "Illustrative image") · none ("Photographs coming soon") |
| Dealer logos and imagery | Supplied, or absent. Never generated from a name |
| Dealership information | Provenance on every field — `dealer`, `verified`, `platform`, `calculated` |
| Maps and locations | Derived from recorded coordinates, or omitted |
| Pricing and valuations | Whether a figure is asked, calculated, or estimated |
| Finance illustrations | Assumptions stated — rate, term, deposit |
| Market insight | Counted from platform data, or modelled |
| AI-generated summaries | Labelled as generated, never presented as editorial |

### Why this is a brand rule and not a legal one

A disclaimer exists to protect the seller. This exists to protect the buyer's judgement, which is why
placement matters as much as wording. The "Illustrative image" label sits *on* the photograph, because the
decision it qualifies — colour, trim, condition — is made while looking at the picture. The same disclosure
in a caption below the fold has disclosed nothing.

### The reasoning behind it

> **An obviously fake placeholder gets fixed. A convincing one gets trusted.**

Poor dummy data is self-correcting; somebody spots it. Convincing fabricated data is dangerous precisely
because it is believed. The platform has now been bitten twice — dealer websites generated from business
names that resolved to real unrelated companies, and 1 000 stock photographs presented as the vehicles for
sale. Neither looked like a placeholder. That was the problem.

Always prefer an honest "Not provided" over a believable fiction.

### What this changes about measurement

Honesty and completeness are related but they are not the same thing, so the Founder Quality Centre scores
them separately:

- **Platform integrity** — is what we show true and properly labelled? Owned by engineering. Never soften it.
- **Marketplace completeness** — is there enough content to trade? Owned by onboarding, and improves as
  dealers arrive.

A platform can legitimately be **100% honest and 25% complete**. That is a young marketplace, not a broken
one — and a single blended score would hide which of the two needs the next hire.
