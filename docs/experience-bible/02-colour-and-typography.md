# 02 — Colour & Typography

Design System V2 is retained unchanged. This chapter does not redefine values — it assigns **jobs**.
Values live in `src/styles/tokens/colors.css` and `typography.css` and are verified by
`scripts/audit-design-contrast.mjs`.

> **Design System 1.0 — frozen.** The customer-facing visual language is signed off. Visual consistency is
> now worth more than incremental styling improvements. Change these values only to correct a genuine
> defect, or as a deliberate product evolution — not as continuous tuning.
>
> Editing tokens? Read the hot-reload warning in `AGENTS.md` first. Token changes do not appear without
> clearing `.next`, and the failure is silent.

---

## 0. The brightness ceiling

The page background sits at its maximum permissible luminance. This is measured, not chosen, and it is
worth understanding before anyone proposes lightening the page again.

`--color-primary` (`#e10600`) is a dark red — relative luminance `0.16`. A primary button is a **solid fill
with no border**, so the fill *is* the control's boundary, and WCAG 1.4.11 requires that boundary to clear
3:1 against whatever surrounds it. On the brightest page background the platform actually renders
(`#202731`, measured on screen across both `/` and `/search`) it measures **3.03:1**.

There is no headroom. Lightening the base, the wash in `globals.css`, or any translucent section surface
breaks the primary button.

Two things would raise the ceiling, and both are product decisions rather than tuning:

1. **Give filled red controls a lighter boundary.** `--color-primary-glow` is already reserved for borders
   and would free roughly 60% more luminance. Rejected at sign-off: the button treatment is clean and
   consistent, and should only be redesigned if that improves the product — not to permit a brighter page.
2. **Move to a light theme.** A different product, not an adjustment.

Accessibility takes precedence over a brightness target. The equilibrium is deliberate.

---

## 1. Colour: when each colour is used

### Primary — `--color-primary`

**Means:** the one action we want taken on this screen. Or the brand mark.

| Use | Do not use |
| --- | --- |
| The single primary button in view | A second primary button |
| Active navigation indicator | "Featured" or "New" labels |
| Selected filter chip | Section headings |
| Focus/hover accents on interactive cards | Large filled areas |
| Chart series 1 (the user's own data) | Body text (fails 4.5:1 — use `--color-primary-text`) |

**Variants:** `--color-primary-hover` (darker, keeps label contrast) · `--color-primary-active`
(pressed) · `--color-primary-glow` (`#ff2b2b` — glow, focus, borders only, never a text-bearing fill)
· `--color-primary-muted` (14% tint for backgrounds) · `--color-primary-text` (`#ff6b66` — small red
text on dark) · `--color-primary-foreground` (labels on a red fill).

### Danger — `--color-danger`

**Means:** destructive, irreversible, or genuinely urgent. Note `--color-danger-foreground` is
**dark** (`#080808`) — white on this red measured 3.55:1 and failed AA.

Use for: delete/remove/unpublish, validation errors, expired or failed states, a lead breaching its
response SLA. Never for: an ordinary warning, an unread count, or emphasis.

### Success — `--color-success`

**Means:** completed, verified, healthy, positive movement. Use for published status, verified
dealers, positive deltas, upload complete. Never for a primary button — success is a *result*, not
an action.

### Warning — `--color-warning`

**Means:** needs attention, not yet a failure. Use for incomplete listings, ageing stock, low photo
count, approaching limits. Never for errors.

### Informational — `--color-info` / `--color-secondary`

The same blue. **Never a primary action, never a brand surface.** Use for neutral system messages,
"how this works" notes, and neutral chart series. If you are reaching for blue to make something
look clickable, you want `--color-primary` or an underline.

### Interactive states

| Token | Applies to |
| --- | --- |
| `--color-hover` | Row, list-item and ghost-button hover (5% white) |
| `--color-active` | Pressed state (9% white) |
| `--color-focus` / `--color-focus-ring` | Focus ring — **always visible, never removed** |
| `--color-disabled` / `--color-disabled-bg` | Disabled text and fill |

**Focus is non-negotiable.** Every interactive element shows a visible focus ring on keyboard
focus. `outline: none` without a replacement is a defect.

**Disabled means genuinely unavailable.** Prefer showing *why* an action is unavailable over
disabling it silently. A disabled primary button with no explanation is a dead end.

### Charts — `--color-chart-1..6`

Ordered by importance, and separable by **luminance as well as hue**, so they survive greyscale and
colour-vision differences.

| Series | Token | Conventional meaning |
| --- | --- | --- |
| 1 | `--color-chart-1` (red) | The user's own data — always series 1 |
| 2 | `--color-chart-2` (amber) | Comparison / market average |
| 3 | `--color-chart-3` (champagne) | Premium or benchmark segment |
| 4 | `--color-chart-4` (green) | Positive outcome (sales, conversions) |
| 5 | `--color-chart-5` (blue) | Neutral volume (views, impressions) |
| 6 | `--color-chart-6` (grey) | Other / remainder |

Never more than four series in one chart. Never a series without a legend or direct label. Never a
rainbow palette.

### Badges

| Meaning | Variant |
| --- | --- |
| Neutral metadata | `default` |
| Brand / featured | `primary` |
| Published, verified, sold | `success` |
| Incomplete, ageing, draft | `warning` |
| Expired, rejected, failed | `danger` |
| Neutral system info | `info` |
| Low-emphasis category | `outline` |

Maximum **two** badges per card. Three is clutter and destroys the premium read.

### Dealer verification

Verification is the trust spine of the marketplace and has its own vocabulary:

| Level | Colour | Mark |
| --- | --- | --- |
| Verified dealer | `--color-success` | Check |
| Premium / accredited | `--color-accent` (metal) | Shield |
| Unverified | `--color-muted` | None — absence, never a negative badge |

**Never shame an unverified dealer with a red badge.** Trust is signalled by presence, not by
punishment.

### Marketplace & AI

- **Marketplace status:** Published → `success` · Reserved → `warning` · Sold → `muted` (past tense
  should recede) · Draft → `outline`.
- **AI / SURF Intelligence:** uses `--color-primary` at low emphasis — a hairline, an icon, a muted
  tint. **AI never gets its own colour.** It is part of the product, not a bolt-on. If a screen
  needs a colour to tell users something is AI, the feature is not integrated well enough.

---

## 2. Typography: when each role is used

One family. The scale in `src/styles/tokens/typography.css` is complete — **never introduce a size
outside it.**

| Role | Token | Where it is used |
| --- | --- | --- |
| **Display XL** | `--text-display-xl` (72px) | Homepage hero only. Once per site |
| **Display LG** | `--text-display-lg` (60px) | Major landing headlines |
| **Display MD** | `--text-display-md` (48px) | Section heroes, campaign headers |
| **H1** | `--text-h1` (36px) | Page title. Exactly one per page |
| **H2** | `--text-h2` (30px) | Major section |
| **H3** | `--text-h3` (24px) | Subsection, card group, modal title |
| **H4** | `--text-h4` (20px) | Card title, panel heading |
| **H5 / H6** | `--text-h5` / `--text-h6` | Dense dealer surfaces, table group headers |
| **Body LG** | `--text-body-lg` (18px) | Editorial lead paragraphs, AI narrative |
| **Body MD** | `--text-body-md` (16px) | Default reading size |
| **Body SM** | `--text-body-sm` (14px) | Secondary detail, dealer surfaces, helper text |
| **Caption** | `--text-caption` (12px) | Timestamps, counts, footnotes, image credits |
| **Overline** | `--text-overline` (11px) | Section eyebrow. Uppercase, tracked |
| **Label** | `--text-label` (13px) | Form labels, chart axes, table headers |
| **Button** | `--text-button` (14px) | All button text |

### Specialist roles

**Price — the most important number in the product.**

Vehicle price is never body text. On a card it is `--text-h4` or larger, on a vehicle detail page
`--text-h2` or larger, always the heaviest weight in its container, always `--color-foreground`
(never red — red is for actions, and a red price reads as a discount, which cheapens it).

Format: `R 449 900` — space as thousands separator (South African convention), no decimals, no
abbreviation. Never "R450k". Precision signals honesty.

**Metric — dashboard figures.**

Large, tabular-lining numerals, `--color-foreground`. The *label* is `--text-label` in
`--color-muted-foreground` and sits **below** the number, not above. The number is the content; the
label is the caption. A delta sits beside it in `success`/`danger` with an explicit direction arrow —
never colour alone.

**Navigation.** `--text-body-sm`, medium weight. Active item uses `--color-foreground` plus a red
indicator; inactive uses `--color-muted-foreground`. Never uppercase navigation.

**Dealer branding.** A dealer's name is set in our typeface, never in the dealer's own. Dealer logos
appear as images in defined containers only. This keeps the marketplace coherent and stops the page
becoming a collage of competing brands.

### Rules

1. **One H1 per page.** Non-negotiable for accessibility and SEO.
2. **Never skip heading levels** for visual reasons. Use the correct level and restyle it.
3. **Line length 60–75 characters** for body copy. Longer is unreadable; the container is wrong.
4. **Never centre body text.** Centre only display headings and empty-state copy.
5. **Never use weight alone to signal hierarchy** — pair it with size or colour.
6. **Numerals in tables and metrics must be tabular-lining** so columns align.
7. **No text over photography without a scrim.** See [03](03-photography.md).
