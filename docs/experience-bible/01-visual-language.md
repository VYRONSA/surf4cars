# 01 — Visual Language

> The interface is the unlit room. The photography is the lit object.

Every rule here serves that sentence.

---

## 1. Dark theme philosophy

Dark is **the brand, not a preference.** There is no light mode, no theme toggle, and no
`prefers-color-scheme: light` block. That override was deliberately deleted from
`src/styles/tokens/colors.css`; reinstating it is a regression, not a feature.

**Why dark:**

1. **Photography.** A vehicle photograph on a white page competes with the page. On `#080808` it
   glows. Every car we show looks more expensive on black — this is why showrooms and motor shows
   are lit this way.
2. **Focus.** Darkness lets us direct attention with light rather than with boxes, lines and
   colour-coding.
3. **Differentiation.** Every South African competitor is white-and-blue. Being the dark platform is
   free brand equity.

**Consequences you must design around:**

- **Shadows do almost nothing.** A black shadow on a near-black page is invisible. Elevation on this
  palette comes from **surface lightness and border**, not from `box-shadow`. Shadow tokens exist and
  render correctly, but treat them as a finishing touch — never as the primary depth signal.
- **Pure white text is heavy at small sizes.** Use `--color-foreground` for primary text and
  `--color-muted-foreground` liberally for everything secondary.
- **Saturated colour is louder than you expect.** A red that looks moderate on white is a siren on
  black. This is why red is rationed.

---

## 2. Surface hierarchy

Five deliberate steps. **Elevation is communicated by getting lighter.** Never invent an
intermediate value.

| Token | Role | Use for |
| --- | --- | --- |
| `--color-surface-sunken` | Below the page | Inset wells, track of a progress bar, code blocks |
| `--color-background` | The room | Page background. Never a component background |
| `--color-surface` | Resting | Cards, panels, table bodies — the default component surface |
| `--color-surface-raised` | Lifted | Cards on top of a panel, popovers, hovered rows |
| `--color-surface-overlay` | Floating | Menus, dropdowns, toasts, skeleton placeholders |

**Rules**

1. **Never skip a step.** A card on the page is `--color-surface`. A card *inside* that card is
   `--color-surface-raised`. Three levels of nesting is the maximum; if you need a fourth, the
   layout is wrong.
2. **Never place a surface on a lighter surface.** Elevation only goes up.
3. **A placeholder must sit above its surface, not below it.** `Skeleton` uses
   `--color-surface-overlay` for exactly this reason — `--color-surface-sunken` made skeletons
   invisible on the V2 palette.

---

## 3. Border philosophy

Borders do the work shadows cannot. They are the primary structural device on this palette.

| Token | Contrast duty | Use for |
| --- | --- | --- |
| `--color-border-subtle` | None | Dividers inside a component, table row separators |
| `--color-border` | Decorative | Card edges, section rules, panel outlines |
| `--color-border-strong` | Decorative | Hover state of an interactive card |
| `--color-border-interactive` | **≥3:1, mandatory** | Inputs, selects, checkboxes, radios, any control whose boundary *is* the control |

**The distinction matters legally, not just aesthetically.** WCAG 2.1 SC 1.4.11 requires 3:1 for UI
components whose boundary conveys the control. Structural borders are decorative separators and are
exempt. `--color-border-interactive` (`#6b6b6b`) clears 3:1 against every surface in the ramp;
`--color-border` (`#2a2a2a`) does not and must never be used on a form control.

**Rules**

1. One border weight: `1px`. There is no `2px` border in this language except a focus ring.
2. Borders are for structure, never for emphasis. To emphasise, change the surface.
3. A red border means *interactive and primary* or *destructive*. Never decorative.

---

## 4. Red accent philosophy

`--color-primary` (`#e10600`) is **the single most rationed resource in the design system.**

Red on this palette means one of exactly three things:

1. **This is the primary action** — the one thing we want you to do on this screen.
2. **This is destructive** (via `--color-danger`, a distinct, more orange red).
3. **This is the brand mark itself.**

Red never means "important", "new", "featured", or "look here". Those are jobs for typography,
space and surface.

**The one-primary rule.** Exactly one `variant="primary"` button in the viewport at a time. If you
have two, one is `secondary`, `outline`, or `ghost`. This is what makes the red mean anything.

**Red text.** `--color-primary` measures 4.0:1 on dark — valid for large text and UI components,
**invalid for body text.** For small red text use `--color-primary-text` (`#ff6b66`). This is
enforced by `scripts/audit-design-contrast.mjs`.

**Red fill.** Labels on a red fill must be `--color-primary-foreground`. Hover uses
`--color-primary-hover` (a *darker* red, so the white label keeps 4.5:1). `--color-primary-glow`
(`#ff2b2b`) is the brighter red, reserved for glow, focus and borders — never for a filled surface
carrying text.

**Blue is not a brand colour.** `--color-secondary` and `--color-info` are the same blue and exist
solely for informational states — an info alert, a neutral chart series. **A blue primary button is
a defect.** So is a blue link, a blue focus ring, or a blue gradient.

---

## 5. Materials

Four materials. Each has one job. Overuse of any of them makes the product look cheap — which is the
precise opposite of the goal.

### Matte — the default

**~95% of every screen.** Flat surfaces from the ramp above, one-pixel borders, no gradient, no
texture, no blur. If you are not deliberately choosing another material, you are using matte.

Matte is what makes the other three materials mean something.

### Glass — for things that float

Glass signals **"this is above the content, and the content continues beneath it."** It is a
statement about z-order, not decoration.

**Use glass for:** the app header over a scrolling page (`.glass-header`), the dealer sidebar
(`.glass-sidebar`), modals and their backdrop (`.glass-dialog`, `.glass-overlay`), floating panels
over hero photography (`.glass-hero-float`), and command palette surfaces.

**Never use glass for:** a card in a grid, a table, a form, a dashboard tile, or anything that
scrolls with the page. A card does not float. It rests.

**Rules**

- Glass requires something behind it worth seeing. Glass over flat black is a waste of GPU and looks
  like a mistake.
- Never nest glass in glass.
- Always pair with `--color-glass-border`; without a border, blurred surfaces have no edge and read
  as a rendering artefact.
- Respect the fallback: where `backdrop-filter` is unsupported the surface must remain legible.

### Metal — for precision and value

`--color-accent` (`#c8a96e`) is a warm, low-saturation champagne — the colour of anodised trim and
brushed instrument bezels. It is the **only** decorative colour besides red.

**Use metal for:** dealer verification, premium/featured status, awards and rankings, certificate
and inspection marks, and top-tier plan indicators.

**Never use metal for:** an action, a status (that is what success/warning/danger are for), or large
areas. Metal is a hairline, a small badge, an icon — never a filled panel.

Metal signals *earned* status. If everything is gold, nothing is.

### Carbon fibre — almost never

A subtle woven texture at very low opacity, permitted in exactly two places: the empty state of a
performance/analytics surface, and a full-bleed hero backdrop where no photography exists.

**Hard limits:** never behind text. Never above ~4% opacity. Never tiled at a visible scale. Never
on more than one surface per screen. If in doubt, do not use it — matte is always a correct answer.

---

## 6. Depth and lighting

Depth is built from four layers, in order of importance:

1. **Surface lightness** — the primary signal. Lighter is nearer.
2. **Border** — defines the edge.
3. **Blur (glass)** — only for genuinely floating surfaces.
4. **Shadow** — a finishing touch. Never the sole depth cue.

**Lighting model.** Light comes from **above and slightly front**, as in a showroom. This means:

- Top edges of raised surfaces may carry a 1px inset highlight (`inset 0 1px 0 rgba(255,255,255,…)`)
  at very low opacity. Bottom edges never do.
- Glow is used only for focus and for the primary action's hover state.
- There is no coloured ambient light, no neon, no glow behind cards. This is a showroom, not a
  gaming rig.

---

## 7. Spacing and rhythm

Spacing is inherited from `src/styles/tokens/spacing.css` (a 4px base scale). Never use an arbitrary
pixel value.

**Density tiers** — this is the most commonly broken rule in the product:

| Tier | Where | Section rhythm | Card padding | Row height |
| --- | --- | --- | --- | --- |
| **Editorial** | Homepage, landing, hero | 96–128px between sections | `p-8` | — |
| **Marketplace** | Search, VDP, dealer profile | 48–64px | `p-6` | — |
| **Cockpit** | Dealer, operations | 24–32px | `p-4`–`p-6` | 44–52px |

A dealer works in the product for hours; scanning speed beats comfort, and a spacious dealer table
is a *worse* product. A buyer visits for minutes; density reads as cheap. **Never apply buyer
spacing to a dealer table, or dealer density to a marketplace grid.**

**Other rules**

- Vertical rhythm is more important than horizontal. Get the gaps between sections right first.
- Related items get one space unit; unrelated groups get three or more. Grouping is done with space,
  not with boxes or borders.
- Content max-width: ~1280px for text-led surfaces. Photography and dealer tables may go full-bleed.

---

## 8. Radius

From `src/styles/tokens/radius.css`. Radius conveys scale — larger surfaces take a larger radius.

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | 4px | Skeleton text lines, tags |
| `--radius-md` | 6px | Small buttons, chips, inputs (`sm`) |
| `--radius-lg` | 8px | Buttons, inputs, selects |
| `--radius-xl` | 12px | **Cards, alerts, panels — the signature radius** |
| `--radius-2xl` | 16px | Modals, large media containers |
| `--radius-3xl` | 24px | Hero surfaces, full-bleed media |
| `--radius-pill` | full | Badges, avatars, toggles, filter chips |

**Rules**

- Never `--radius-none` on a content surface. Sharp corners read as unfinished on this palette.
- Never a radius above `--radius-3xl`. We are precise, not playful.
- A child's radius must be smaller than its parent's, or the nesting looks wrong.

---

## 9. What this language is not

A quick negative test. If a design does any of the following, it has left the language:

- More than one accent colour in a view
- A gradient used as a surface (gradients are for photographic overlays only)
- Glass on a non-floating element
- Coloured glow that is not focus or primary hover
- Shadow doing the job of surface elevation
- Emoji, illustration, or a mascot in product UI
- Two competing primary buttons
- A blue primary action
- Arbitrary hex values instead of tokens

---

## Premium Blue Hour — the platform benchmark

_Established PCP-012A. The homepage is the visual reference for every customer-facing page._

The surfaces were neutral near-blacks (`#080808`–`#1d1d1d`). Rendered full-screen they read as an absence
rather than a surface: the interface disappeared and photography sat in a void. That is the difference
between a marque's site and a cinema.

The palette is now **deep slate** — the same luminance ladder, lifted, with a slight blue-grey cast.

| Token | Value |
| --- | --- |
| `--color-background` | `#0d0f12` |
| `--color-surface` | `#14171b` |
| `--color-surface-raised` | `#1b1f24` |
| `--color-surface-sunken` | `#090b0d` |
| `--color-surface-overlay` | `#22262c` |
| `--color-border` | `#33383f` |
| `--color-scrim-rgb` | `13, 15, 18` |

**Rules that follow.**

1. **No page drifts back to heavy black.** Photography scrims tint toward `--color-scrim-rgb`, never to
   pure black, so a darkened photograph and the page beneath it belong to one palette. Hardcoded
   `rgba(8,8,8,…)` in a new component is a regression.
2. **Contrast is verified, not judged.** `scripts/audit-design-contrast.mjs` must pass 28/28 after any
   change to these tokens. The tightest pairings — `--color-border-interactive` and `--color-chart-1`
   against the card surface — now sit at 3.1:1 against a 3:1 floor. There is roughly one more step of
   lift available, not three.
3. **Hero exposure is measured.** The homepage hero runs `brightness(1.16) contrast(1.05) saturate(1.08)`
   with shaped rather than full-bleed scrims. Whole-frame luminance ≈ 0.065; headline 5.67:1, sub-headline
   5.48:1. Re-measure before retuning either.
4. **Muted text is calibrated for flat surfaces, not photography.** `--color-muted-foreground` holds 9:1
   on a surface and fails over a bright frame. Copy sitting on a photograph takes a brighter local value
   (`#c7c7c7` in the hero). Do not darken a photograph to rescue a text colour chosen for a different
   context.

The impression to preserve is **premium blue hour, not premium night**: brighter, cleaner and more
welcoming, with the city, the road and the vehicle visible rather than a dark mass behind them.
