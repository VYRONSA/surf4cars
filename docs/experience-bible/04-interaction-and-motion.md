# 04 — Interaction & Motion

> Smooth, confident transitions. Never flashy.

Motion is centralised in `src/styles/tokens/motion.css`. **Components never define their own
durations or easings** — they apply a motion utility class. This is what keeps the product feeling
like one machine.

---

## 1. Timing and easing

| Token | Value | Use |
| --- | --- | --- |
| `--duration-instant` | 0ms | Reduced-motion collapse |
| `--duration-fast` | 120ms | Hover, tint, colour change |
| `--duration-normal` | 200ms | Buttons, cards, most transitions |
| `--duration-slow` | 300ms | Modals, drawers, larger surfaces |
| `--duration-slower` | 450ms | Full-screen or hero transitions |
| `--duration-page` | 350ms | Route transitions |

| Easing | Curve | Use |
| --- | --- | --- |
| `--ease-out` | `(0, 0, 0.2, 1)` | Things entering or responding to the cursor |
| `--ease-in` | `(0.4, 0, 1, 1)` | Things leaving |
| `--ease-in-out` | `(0.4, 0, 0.2, 1)` | Things moving in place |
| `--ease-premium` | `(0.22, 1, 0.36, 1)` | **The signature curve** — decisive start, long settle |
| `--ease-spring` | `(0.34, 1.2, 0.64, 1)` | Slight overshoot. Confirmations only. Use rarely |

`--ease-premium` is the brand's movement. It starts immediately (feels fast) and settles slowly
(feels heavy, engineered, expensive). It is the difference between a car door that clicks and one
that thuds. **When unsure, use `--ease-premium` at `--duration-normal`.**

### Contextual tokens — use these, not raw values

`--motion-hover` · `--motion-button` · `--motion-card` · `--motion-modal` · `--motion-drawer` ·
`--motion-nav` · `--motion-page`

Applied via the matching utility classes: `.motion-hover`, `.motion-button`, `.motion-card`, etc.

---

## 2. The interaction vocabulary

### Hover

**Never more than two properties at once.** Hover is an acknowledgement, not an event.

| Element | Hover |
| --- | --- |
| Primary button | Fill → `--color-primary-hover` |
| Secondary/outline | Background → `--color-hover` |
| Ghost / nav item | Background → `--color-hover`, text → `--color-foreground` |
| Interactive card | Border → `--color-primary`, translate `-2px` to `-4px` |
| Vehicle card | Above, plus a slow image scale to ~1.03 over `--duration-slow` |
| Table row | Background → `--color-hover` |
| Link | Underline appears |

**Rules:** no hover state on touch devices (`@media (hover: hover)`). Never change layout on hover.
Never reveal *essential* information on hover only — it is inaccessible on touch and to keyboard
users.

### Lift

Interactive cards translate up 2–4px on hover using `.motion-card`. **Cards lift; buttons do not.**
A button that floats away from the finger feels evasive.

Never lift more than 4px. Never lift a card that is not interactive.

### Scale

Reserved almost entirely for **photography inside a fixed container** — a slow zoom to ~1.03 that
signals "there is more here" without moving the layout. Requires `overflow: hidden`.

Buttons and cards never scale on hover. Buttons may scale to `0.98` on *press* — that is a physical
acknowledgement, which is different.

### Fade

Entering content fades in over `--duration-normal` with `--ease-out`. Fades are combined with a
small (~8px) upward translate for content, giving the `.animate-slide-up-sfc` feel. Never fade
longer than `--duration-slow`; anything slower reads as a slow product.

### Focus

**Always visible. Never removed.** A `--color-focus-ring` ring appears instantly (`--duration-fast`,
no easing theatre). Focus is a safety feature, not decoration.

Focus rings must be visible on every surface in the ramp. Modals and drawers trap focus and restore
it to the trigger on close.

### Glass

Glass surfaces do not animate their blur — animating `backdrop-filter` is expensive and janky.
Glass *containers* animate position and opacity; the blur itself is constant. A glass header that
appears on scroll fades and translates; it never blurs progressively.

---

## 3. Loading

Loading is where a premium product is most easily lost. The rule: **never show nothing, and never
show a spinner where a skeleton is possible.**

| Situation | Treatment |
| --- | --- |
| Known layout (cards, tables, detail pages) | **Skeleton** matching the real layout's shape and count |
| Unknown duration, small area | `Spinner` |
| In-place button action | Button `loading` state — label stays, spinner replaces the icon, width does not change |
| Background work | `Progress` with a real percentage, or nothing at all |
| Images | Fixed-ratio container → skeleton → fade in |

**Skeletons must match reality.** A skeleton showing three cards when six will load is a lie the
user experiences as a layout jump.

**Never show a full-page loading state on navigation** between pages that share a shell. The shell
stays; the content region loads.

**Perceived speed rules:** optimistic UI for reversible actions (saving a vehicle, toggling a
filter). Never block the whole screen for a local action. If something takes longer than ~10
seconds, say what is happening and give an escape.

---

## 4. Page transitions

Route changes use `--motion-page` (350ms, `--ease-premium`).

- **Shell persists.** Header, sidebar and navigation never re-animate on navigation within a shell.
- **Content region cross-fades** with a small upward translate.
- **Scroll restores** on back-navigation, and resets to top on forward navigation.
- **Never a full-screen wipe, slide, or 3D transition.** We are not a mobile OS.

---

## 5. Charts

Charts animate **once**, on first appearance:

- Bars grow from baseline; lines draw left to right; over `--duration-slower` with `--ease-premium`.
- **Never re-animate on filter change** — the values should morph in place over `--duration-normal`
  so the user can track what changed. Re-animating from zero destroys comparison.
- Tooltips appear instantly (`--duration-fast`). No delay, no easing.
- Never animate a chart that updates in real time.

---

## 6. Reduced motion

**`prefers-reduced-motion: reduce` is honoured globally** in `motion.css`. This is WCAG 2.1 SC 2.3.3
and a hard requirement.

Under reduced motion:

- All `.motion-*` transitions collapse to `--duration-instant`.
- Decorative animations (`pulse`, `shimmer`, `fade-in`, `slide-up`) collapse to a single frame.
  They are **not removed** — an animation with `forwards` that is removed strands the element in its
  invisible `from` state.
- **Spinners keep rotating.** A loading indicator that does not move conveys nothing, and rotation is
  neither large-scale nor parallax motion.

Because motion is centralised, this is one block of CSS. **If you add a component-local animation,
you have created a reduced-motion bug.** Add it to `motion.css` instead.

---

## 7. Consistency rules

1. One easing family. `--ease-premium` unless there is a reason.
2. One duration per interaction class. All buttons transition identically.
3. Motion has a purpose: state change, spatial relationship, or attention. Never decoration.
4. Nothing animates on page load except content entering the viewport.
5. Never animate `width`, `height`, `top` or `left`. Only `transform` and `opacity`.
6. Never animate more than two properties simultaneously.
7. Nothing loops except loading indicators.
8. Never stagger more than six items; beyond that it reads as slowness.

---

## 8. Sound (future)

Not implemented. Specified here so that if it is ever built, it is built correctly.

**Philosophy:** the sound of a well-made car — a door closing, an indicator relay, a switch
detenting. Mechanical, short, low. Never a notification chime, never a game sound, never musical.

| Event | Character | Length |
| --- | --- | --- |
| Success (published, sold) | Low, warm, resolved — a solid latch | ≤200ms |
| Error | Short, dry, low. A dull stop. **Never harsh or buzzing** | ≤150ms |
| Notification / new lead | Single soft detent, felt more than heard | ≤120ms |
| Upload complete | Ascending two-note, very quiet | ≤250ms |
| AI response ready | Almost subliminal — a breath, not a chime | ≤100ms |

**Hard rules**

1. **Off by default.** Always. Sound is opt-in, never opt-out.
2. Never sound without a visual equivalent — sound is never the sole carrier of information.
3. Nothing above ~250ms. Nothing musical or melodic.
4. Never on hover, focus, scroll, or page load.
5. Respect OS silent/reduced settings.
6. All sounds from one recorded family so they belong together.
7. If it would be embarrassing in an open-plan dealership, it is wrong.
