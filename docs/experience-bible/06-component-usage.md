# 06 — Component Usage Guide

The library in `src/components/ui/` is the implementation foundation. **This chapter says when to
reach for each primitive — and when not to.**

**Rule zero: never build a component that already exists.** Before creating anything, check
`src/components/ui/index.ts` and the showcase at `/design-system`. If a primitive is close but not
exact, extend it with a variant — do not fork it.

---

## 1. Buttons

`Button` · `SplitButton` · `DropdownButton`

| Variant | Meaning | Rule |
| --- | --- | --- |
| `primary` | The one action we want | **Max one in the viewport** |
| `secondary` | Important alternative | Rare — usually `outline` is better |
| `outline` | Secondary action | The default for "the other button" |
| `ghost` | Tertiary, in-context | Toolbars, table row actions, icon buttons |
| `text` | Inline, link-like | Inside prose or dense lists |
| `danger` | Destructive | Only where data is destroyed or a listing is withdrawn |
| `success` | Confirms a positive outcome | Almost never — success is a result, not an action |

**Sizes:** `sm` dense/dealer toolbars · `md` default · `lg` primary page actions · `xl` hero/marketing.

**Use when:** the user performs an action.
**Do not use when:** the user navigates — that is a link. A button that changes the URL is a defect
for accessibility, middle-click and SEO.

**Rules**

- Verb + noun labels ([05](05-writing-style.md)).
- `loading` keeps the label and the width.
- Never disable without explaining why nearby.
- Icon-only buttons (`icon`, `icon-sm`, `icon-lg`) require `aria-label`.
- Never place two `primary` buttons side by side.
- `SplitButton` only where one action is clearly dominant and its variants are genuinely related
  (e.g. Publish / Publish & Add Another).

---

## 2. Cards

`Card` (+ `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) and the
specialist set: `VehicleCard`, `DealerCard`, `MetricCard`, `StatisticCard`, `InsightCard`,
`RecommendationCard`, `ActionCard`, `FeatureCard`, `MarketingCard`, `EmptyStateCard`.

**Always prefer the specialist.** A hand-assembled `Card` showing a vehicle is a defect — use
`VehicleCard` so every vehicle in the product looks identical.

| Variant | Use |
| --- | --- |
| `default` | The standard resting card |
| `elevated` | A card that sits above a panel |
| `floating` | Popovers and genuinely floating surfaces |
| `glass` | Only over photography or a gradient — never in a grid |
| `flat` | Inside an already-elevated container, where a border alone is enough |

**Use when:** grouping related content that could stand alone.
**Do not use when:** content is sequential (use a list), tabular (use a table), or when the card
contains a single line — that is a list item, and cards around one-liners are the fastest way to make
a product look like a template.

**Rules**

- **Never nest a card in a card in a card.** Two levels maximum.
- One primary action per card, in the footer.
- Whole-card click targets must also be keyboard reachable.
- Never mix card variants within one grid.
- Max two badges.

### VehicleCard — the signature component

The most-rendered component in the product. It is **a photograph with text attached.**

Required, in order: 16:9 front three-quarter image · price (largest text) · year, make, model,
variant · mileage, fuel, transmission · location · dealer name with verification mark · save action.

Never: more than two badges · a description paragraph · more than one CTA · a hidden price without
"Contact dealer for price".

---

## 3. Glass

`GlassSurface` and the `.glass-*` classes.

**Use for:** app header over scrolling content (`.glass-header`), sidebar (`.glass-sidebar`), modals
and backdrops (`.glass-dialog`, `.glass-overlay`), panels floating over hero photography
(`.glass-hero-float`), command palette.

**Do not use for:** cards in a grid, tables, forms, dashboard tiles, or anything that scrolls with
the page.

**Rules:** never nest glass. Never glass over flat black — there must be something behind worth
seeing. Always pair with `--color-glass-border`. Never animate the blur. Verify legibility where
`backdrop-filter` is unsupported.

---

## 4. Badges

`Badge` · `StatusBadge` · `NotificationBadge`

**Use for:** status, category, and count. See [02](02-colour-and-typography.md) for the meaning of
each variant.

**Do not use for:** actions (badges are not buttons), long text, or emphasis. A badge is 1–2 words.

**Rules:** max two per card. Status colour must be paired with a word — never colour alone.
`NotificationBadge` caps at "99+". Never a red badge on an unverified dealer — absence, not
punishment.

---

## 5. Tables

`Table` + `TableToolbar`, `TableBulkActions`, `TablePagination`.

**Use for:** dealer and operations surfaces where users scan, sort, compare and act in bulk.

**Do not use for:** buyer-facing browsing. **Buyers never see a table of vehicles** — they see
cards. A table of cars is a classifieds site; a grid of photographs is a showroom.

**Rules**

- Row height 44–52px (cockpit density).
- Numeric columns right-aligned, tabular numerals.
- Primary identifier column is sticky on horizontal scroll.
- Sortable headers show current direction explicitly.
- Bulk selection reveals `TableBulkActions` — never a permanently visible bar.
- Row actions are `ghost` icon buttons, revealed on hover **and always present for keyboard users**.
- Never horizontal scroll on mobile — collapse to a card list below `md`.
- Always paginate. Never infinite-scroll a table.
- Empty, loading (skeleton rows) and error states are mandatory.

---

## 6. Forms

`FormField` · `Input` · `Select` · `Textarea` · `Checkbox` · `Radio` · `Toggle` · `DatePicker` ·
`TagInput` · `SearchInput` · `ImagePicker` · `UploadArea`

**Always wrap a control in `FormField`.** It provides the label, helper text, error and required
marker with correct associations. A bare `Input` with a `<p>` label is an accessibility defect.

**Rules**

- Every control has a visible label. Placeholder is never a label.
- Controls use `--color-border-interactive` (≥3:1) — never `--color-border`.
- Validate on blur, not on keystroke. Never show an error for a field the user has not finished.
- Errors sit below the field, in words, and say how to fix it.
- Helper text is for *before*; error text replaces it *after*.
- Group related fields; never present more than ~7 fields without a grouping or step.
- Long forms autosave and say when they saved.
- `Toggle` for immediate effect; `Checkbox` for something applied on submit. Getting this wrong is
  the most common form error in the product.
- Never disable submit without saying what is missing.

---

## 7. Charts

Dashboard components in `src/components/ui/dashboard/`.

**Use when:** a trend or comparison drives a decision.
**Do not use when:** there are fewer than ~3 data points (use a `MetricCard`), or when the chart is
decorative. **No chart without a decision attached.**

**Rules:** max 4 series. Series 1 is always the user's own data. Direct labels beat legends. Y-axis
starts at zero for magnitude comparisons. Always state the period ("Last 30 days"). Always handle
"not enough data yet" explicitly. Animate once on appear; morph in place on filter change. Never a
pie chart with more than 4 slices; never a 3D chart; never dual Y-axes.

---

## 8. Search

`SearchInput`, plus the feature components in `src/features/search/`.

**Homepage:** search is the hero — large, centred, `xl`, with the most valuable filters inline.
**Header:** compact, persistent, secondary.
**Dealer:** scoped to their own stock, always visible above a table.

**Rules:** always show what is being searched ("Search 1 284 vehicles"). Active filters are shown as
removable chips. Result count updates live. Zero-results always shows the active filters and offers
the smallest useful relaxation. Never clear a user's query on navigation back.

---

## 9. Navigation

`src/components/ui/navigation/` and the shell in `src/components/shell/`.

**Rules:** one active state, always visible. Active = `--color-foreground` + red indicator. Never
uppercase. Never more than 7 top-level items. Breadcrumbs on any surface more than two levels deep.
Mobile: bottom bar of max 5 items, thumb-reachable, with labels — never icons alone.

---

## 10. Feedback

| Component | Use for | Never |
| --- | --- | --- |
| `Alert` | Persistent, in-context message | Transient confirmation |
| `Banner` | Page or account-wide notice | Field-level errors |
| `Toast` | Transient confirmation of a user action | Errors requiring action; anything that must be read |
| `Progress` | Determinate work with a real percentage | Fake progress |
| `Spinner` | Indeterminate, small area | Where a skeleton is possible |
| `Skeleton` | Known layout loading | Unknown layouts |
| `EmptyState` | Genuinely empty collections | Errors |

**Toasts** auto-dismiss after ~5s, stack to a maximum of 3, and never carry the only copy of
important information.

---

## 11. AI components

`src/components/ui/ai/`

**Use for:** SURF Intelligence responses, recommendations, and market insight.
**Do not use for:** anything not genuinely model-generated. **Never dress a static rule up as AI** —
this is the fastest way to destroy trust in the feature.

**Rules:** always show reasoning alongside a conclusion. Always cite the data set and period. State
confidence honestly; when low, say less. Never a chat bubble UI. Never a typing indicator that
misrepresents real latency. Always dismissible, and dismissal is respected.

---

## 12. Decision table

| I need to… | Use | Not |
| --- | --- | --- |
| Show a vehicle | `VehicleCard` | A hand-built `Card` |
| Show a dealer | `DealerCard` | A `Card` with a logo |
| Show one number | `MetricCard` | A `Card` with big text |
| Show an AI insight | `InsightCard` / `RecommendationCard` | An `Alert` |
| Let a dealer act on many rows | `Table` + `TableBulkActions` | A list of cards |
| Let a buyer browse | Card grid | A table |
| Confirm an action just taken | `Toast` | `Alert` |
| Warn about ongoing state | `Alert` | `Toast` |
| Collect input | `FormField` + control | A bare control |
| Float above content | `GlassSurface` | A `Card` with blur |
| Show nothing yet | `EmptyState` | A blank region |
| Show loading | `Skeleton` | `Spinner` |
