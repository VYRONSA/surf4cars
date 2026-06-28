# SURF Design Language (SDL)

**Version:** 1.0  
**Status:** Mandatory — Single Source of Truth  
**Platform:** SURF FOR CARS  
**Last updated:** June 2026

---

## Purpose

The SURF Design Language (SDL) is the visual constitution of SURF FOR CARS.

It defines how the platform looks, feels, moves, and communicates. Every component, page, feature, and interaction must follow this document.

The SDL exists so that:

- The platform is instantly recognizable — even without the logo.
- Design decisions are consistent, intentional, and scalable.
- Engineers, designers, and AI agents build toward the same standard.
- SURF FOR CARS never drifts into generic classifieds aesthetics.

**This document is mandatory reading before building any future feature.**

Implementation tokens live in `src/styles/tokens/` and `src/config/design-system/`. The SDL defines *why* those tokens exist. The tokens define *what* they are.

---

## The SURF Standard

SURF FOR CARS is not a classifieds website.

It is an **AI-powered dealership growth and automotive marketing platform** with a premium public marketplace experience.

Every surface must feel closer to:

- Apple
- Porsche
- Tesla
- Stripe
- Linear

Never closer to:

- Traditional classifieds
- Dashboard-heavy enterprise software
- Cluttered marketplace templates

If a design choice feels like "another vehicle website," it is wrong.

---

## Brand Personality

SURF FOR CARS embodies twelve defining qualities. Every design decision should reinforce at least three of them simultaneously.

| Quality | What it means for SURF |
|---|---|
| **Luxury** | Restraint over decoration. Space over density. Quality over quantity. |
| **Speed** | Interfaces feel instant. Motion is swift, never sluggish. Search responds immediately. |
| **Confidence** | Bold typography. Clear hierarchy. No hesitation in layout decisions. |
| **Trust** | Transparent states. Honest empty states. No dark patterns. No fake urgency. |
| **Innovation** | AI is integrated naturally — not bolted on. The future is visible but never gimmicky. |
| **Technology** | Precision engineering in every pixel. Systems, not screens. |
| **Precision** | Alignment is exact. Spacing is mathematical. Nothing is approximate. |
| **Elegance** | Solutions are simple. Complexity is hidden. Beauty is functional. |
| **Premium** | Materials feel considered — glass, depth, typography, photography. |
| **Automotive** | Inspired by vehicle design language: curves, proportion, performance, craft. |
| **Modern** | Contemporary, not trendy. Timeless enough to age well. |
| **Friendly** | Approachable without being casual. Professional without being cold. |

### Brand voice in one sentence

> SURF FOR CARS is the most intelligent, most refined way to discover and sell vehicles in South Africa.

---

## Emotional Experience

Design is not decoration. Design is how users feel.

### Primary emotions we create

| Emotion | When | How |
|---|---|---|
| **Confident** | Searching, filtering, comparing | Clear feedback, predictable layouts, no ambiguity |
| **Excited** | Discovering a vehicle, exploring collections | Cinematic imagery, generous space, subtle delight |
| **Relaxed** | Browsing, reading guides, exploring dealers | Low cognitive load, minimal chrome, calm palette |
| **In control** | Managing inventory, running campaigns, reviewing analytics | Structured dashboards, precise data, clear actions |
| **Powerful** | Using AI tools, scaling dealership operations | Capable interfaces that feel professional, not playful |
| **Inspired** | Landing on homepage, viewing premium listings | Hero moments, bold typography, aspirational photography |

### Emotions we never create

- Overwhelmed (too many options, too much noise)
- Skeptical (fake data, dark patterns, inflated claims)
- Patronized (overly cute copy, gimmicky AI)
- Lost (unclear navigation, inconsistent patterns)
- Cheap ( cluttered layouts, harsh colours, stock UI)

### The emotional arc

1. **Arrive** → Inspired, curious
2. **Search** → Confident, in control
3. **Discover** → Excited, relaxed
4. **Decide** → Trusting, empowered
5. **Act** → Clear, fast

---

## Visual Principles

These ten principles govern every visual decision on the platform.

### 1. Large whitespace

Space is a luxury signal. Sections breathe. Content never crowds the edges. Whitespace is not empty — it is intentional.

### 2. Minimalism

Every element must earn its place. If it does not inform, guide, or delight — remove it.

### 3. High contrast

Text must be readable at a glance. Interactive elements must be distinguishable from static content. Hierarchy is created through contrast, not decoration.

### 4. Premium typography

Type is the primary design element. Headlines are bold and confident. Body text is calm and readable. Numbers and data use precise formatting.

### 5. Large imagery

Vehicles are visual products. Photography and imagery containers are generous. Hero images are cinematic. Thumbnails are crisp.

### 6. Subtle motion

Motion communicates state change — never entertains. Animations are fast, easing is premium, reduced-motion is always respected.

### 7. Elegant gradients

Gradients add depth and atmosphere — never rainbow effects. Use radial gradients for hero backgrounds. Use linear gradients sparingly for overlays.

### 8. Glass used sparingly

Glassmorphism signals premium depth on headers, search panels, and floating actions. Never apply glass to every surface. Glass without purpose is noise.

### 9. Rounded geometry

Corners are soft but not bubbly. Cards use `--radius-xl` to `--radius-2xl`. Buttons use `--radius-lg`. Pills use `--radius-pill`. Sharp corners are reserved for data tables and code.

### 10. No clutter

One primary action per section. One focal point per screen. Progressive disclosure for complexity. Filters collapse. Advanced options hide until needed.

---

## Color Philosophy

Colour at SURF FOR CARS is restrained, purposeful, and automotive-inspired. We do not use colour for decoration. Every colour communicates meaning.

### Primary — `#0066ff`

**Why it exists:** Primary is the colour of action, intelligence, and forward motion. It evokes precision engineering and digital confidence — the blue of innovation, not the blue of corporate banking.

**Use for:** Primary buttons, links, focus rings, active navigation, AI indicators, key CTAs.

**Never use for:** Large background fills, decorative accents, status that should be semantic.

**Token:** `--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-primary-muted`

### Secondary — `#6366f1`

**Why it exists:** Secondary supports intelligence and depth. It distinguishes AI-powered features and secondary emphasis without competing with Primary.

**Use for:** AI Studio surfaces, intelligence badges, secondary charts, supplementary highlights.

**Never use for:** Primary actions, error states, success confirmation.

**Token:** `--color-secondary`, `--color-secondary-muted`

### Accent — `#c8a96e` (Automotive Gold)

**Why it exists:** Accent is the luxury signal. Inspired by automotive trim, premium badges, and refined detail. It appears rarely — which is why it works.

**Use for:** Dealer premium CTAs, featured badges, luxury category highlights, editorial accents.

**Never use for:** Body text, large backgrounds, status indicators, primary buttons.

**Token:** `--color-accent`, `--color-accent-hover`, `--color-accent-muted`

### Success — `#10b981`

**Why it exists:** Confirms positive outcomes — saved, published, connected, reduced price.

**Use for:** Success alerts, confirmation badges, positive trends, "Reduced Price" labels.

**Never use for:** Decorative green, primary branding, navigation.

### Warning — `#f59e0b`

**Why it exists:** Draws attention without alarm. Indicates caution, pending states, or items needing review.

**Use for:** Warning alerts, pending status, expiring listings, incomplete profiles.

**Never use for:** Errors, primary actions, decorative warmth.

### Danger — `#ef4444`

**Why it exists:** Signals irreversible or critical actions. Used sparingly to maintain impact.

**Use for:** Delete confirmations, error states, destructive buttons, critical alerts.

**Never use for:** Decorative red, marketing urgency, non-critical highlights.

### Neutral — `#fafafa` to `#09090b`

**Why it exists:** Neutrals carry the platform. They create depth, hierarchy, and readability without competing with brand colours.

**Use for:** Text hierarchy, borders, backgrounds, dividers, disabled states.

**Scale:** `--color-neutral-0` through `--color-neutral-950`

### Background — `#09090b` (dark default)

**Why it exists:** Dark-first backgrounds create cinematic depth for vehicle imagery and premium typography. Light mode is supported but dark is the primary brand expression.

**Use for:** Page backgrounds, app shell, full-bleed sections.

**Token:** `--color-background`

### Glass

**Why it exists:** Glass creates layered depth — the feeling of floating panels over cinematic content. It must feel physical, not decorative.

**Use for:** Headers, search panels, sticky toolbars, modal overlays, floating cards.

**Rules:** Maximum blur 20px. Always paired with subtle border (`--color-glass-border`). Disabled when `prefers-reduced-transparency` is active.

**Token:** `--color-glass`, `--color-glass-strong`, `--color-glass-subtle`, `--color-glass-border`

### Surface

**Why it exists:** Surfaces create elevation hierarchy without heavy shadows. Each level communicates depth.

| Surface | Purpose |
|---|---|
| `--color-surface` | Base elevated panel |
| `--color-surface-raised` | Cards, inputs, dropdowns |
| `--color-surface-sunken` | Inset areas, image placeholders, skeletons |
| `--color-surface-overlay` | Modals, drawers, popovers |

### Borders

**Why they exist:** Borders define structure with minimum visual weight. They are translucent, never harsh lines.

| Token | Purpose |
|---|---|
| `--color-border-subtle` | Section dividers, inactive cards |
| `--color-border` | Default component borders |
| `--color-border-strong` | Hover states, active containers |

### Chart colours

Charts use a refined six-colour palette — never rainbow. Colours are distinguishable but harmonious: Primary, Secondary, Accent, Success, Neutral, Info.

**Token:** `--color-chart-1` through `--color-chart-6`

### Colour rules

1. Never introduce new colours without updating this document and the token system.
2. Never use pure `#000000` or `#ffffff` for large areas — use neutral scale.
3. Status colours are semantic — never decorative.
4. Accent appears on no more than 5% of any screen.
5. Muted text uses `--color-muted-foreground`, never reduced opacity on foreground.

---

## Typography Philosophy

Typography is the primary design element at SURF FOR CARS. If layout and colour were removed, the platform should still feel premium through type alone.

### Typeface

**Primary:** Inter — clean, modern, highly legible at all sizes.  
**Monospace:** Geist Mono — code, technical data, API references.

No secondary display face. Inter at large sizes with tight tracking creates sufficient display character.

### Display — Hero moments

| Token | Size | Use |
|---|---|---|
| `--text-display-xl` | 4.5rem / 72px | Homepage hero, major campaign headers |
| `--text-display-lg` | 3.75rem / 60px | Section heroes, landing pages |
| `--text-display-md` | 3rem / 48px | Search hero, feature introductions |

**Rules:** Semibold weight. Tight tracking (`--tracking-display: -0.03em`). Tight line height (`--leading-display: 1.1`). Maximum two display lines before breaking. Always sentence case or title case — never ALL CAPS.

### Headlines — Section structure

| Token | Size | Use |
|---|---|---|
| `--text-h1` | 2.25rem | Page titles |
| `--text-h2` | 1.875rem | Section headings |
| `--text-h3` | 1.5rem | Subsection headings |
| `--text-h4` | 1.25rem | Card titles, panel headers |
| `--text-h5` | 1.125rem | Compact headings, list group titles |
| `--text-h6` | 1rem | Label headings, filter group titles |

**Rules:** Semibold for h1–h3. Medium for h4–h6. Heading tracking (`--tracking-heading: -0.02em`).

### Body — Reading and interface

| Token | Size | Use |
|---|---|---|
| `--text-body-lg` | 1.125rem | Intro paragraphs, feature descriptions |
| `--text-body-md` | 1rem | Default body text, form labels |
| `--text-body-sm` | 0.875rem | Secondary text, metadata, captions |

**Rules:** Normal weight. Body tracking (`--tracking-body: 0em`). Relaxed line height for long-form (`--leading-relaxed: 1.625`).

### Cards

- **Title:** `--text-h4` or `--text-h5`, semibold
- **Subtitle:** `--text-body-sm`, muted foreground
- **Metadata:** `--text-caption`, muted
- **Price:** `--text-h5`, semibold, foreground — never muted

### Tables

- **Header:** `--text-label`, medium weight, uppercase optional for data tables
- **Cell:** `--text-body-sm`, normal weight
- **Numeric columns:** Right-aligned, tabular figures where available
- **Row height:** Minimum 48px for touch accessibility

### Forms

- **Label:** `--text-label`, medium weight
- **Input text:** `--text-body-sm` (md inputs) or `--text-body-md` (lg inputs)
- **Helper text:** `--text-caption`, muted foreground
- **Error text:** `--text-caption`, danger colour

### Navigation

- **Primary nav:** `--text-body-sm`, medium weight
- **Sidebar items:** `--text-body-sm`, medium weight
- **Breadcrumbs:** `--text-body-sm`, muted with foreground on current page
- **Overline labels:** `--text-overline`, uppercase, wide tracking (`--tracking-overline: 0.08em`)

### Buttons

- **Default:** `--text-button` (0.875rem), medium weight
- **Large CTA:** `--text-body-md`, medium weight
- **Icon buttons:** No text — aria-label required

### Numbers and analytics

- **Metric value:** `--text-h2` or `--text-h3`, semibold
- **Metric label:** `--text-caption` or `--text-label`, muted
- **Trend indicator:** `--text-body-sm` with semantic colour
- **Dashboard KPIs:** Large number, small label — never equal visual weight

### Typography rules

1. Maximum three type sizes per section.
2. Never use more than two weights in a single component.
3. Muted text communicates secondary information — not disabled information.
4. Line length for body text: 45–75 characters (use `max-w-prose` or `--container-md`).
5. Headlines use `text-balance`. Body uses `text-pretty` where supported.

---

## Layout Philosophy

Pages at SURF FOR CARS must breathe. Layout is the architecture of calm.

### Margins

- **Page horizontal margin:** 16px mobile, 24px tablet, 24px desktop (`px-4 lg:px-6`)
- **Never flush content to viewport edges** except full-bleed hero imagery
- **Section vertical margin:** 64px mobile, 96px desktop minimum between major sections

### Padding

- **Card padding:** 16px compact, 24px default, 32px spacious
- **Form field groups:** 12px between label and input, 16px between fields
- **Button padding:** Defined by size tokens — never custom per-button

### Spacing scale

Use the platform spacing scale exclusively. No arbitrary values.

| Token | Value | Common use |
|---|---|---|
| `--space-1` | 4px | Icon gaps, tight inline spacing |
| `--space-2` | 8px | Compact element gaps |
| `--space-3` | 12px | Form field internal spacing |
| `--space-4` | 16px | Default component padding |
| `--space-6` | 24px | Card padding, section internal gaps |
| `--space-8` | 32px | Section padding |
| `--space-12` | 48px | Section header to content |
| `--space-16` | 64px | Section vertical rhythm |
| `--space-24` | 96px | Hero padding, major section breaks |

### Content width

| Container | Max width | Use |
|---|---|---|
| `--container-md` | 768px | Articles, authentication, narrow content |
| `--container-xl` | 1280px | Public pages, marketing |
| `--container-2xl` | 1400px | Search, dashboards, wide layouts |

Content never spans full viewport width on ultrawide displays without intentional full-bleed design.

### Grid system

- **Public/marketplace:** 4-column mobile, 2-column tablet, 3–4 column desktop for cards
- **Dashboard:** 12-column logical grid with sidebar offset
- **Gap:** 16px mobile, 20px desktop between grid items
- **Vehicle cards:** Consistent aspect ratio 16:10 for grid view

### Section rhythm

Every page follows a rhythm:

1. **Hero / primary action** — largest space, highest contrast
2. **Supporting content** — structured grid, consistent spacing
3. **Secondary content** — reduced visual weight
4. **CTA / close** — clear focal point
5. **Footer** — minimal, elegant

Sections alternate between contained and full-bleed intentionally — never randomly.

### Layout rules

1. One primary focal point per viewport.
2. Sticky elements (header, toolbar) use glass — never opaque blocks that feel heavy.
3. Sidebars are 240px–300px on desktop. Never wider unless data-dense.
4. Mobile bottom bars respect safe-area-inset.
5. Scroll containers are intentional — avoid nested scroll unless necessary (filters drawer, data tables).

---

## Motion Philosophy

> Animations should communicate. Never entertain.

Motion at SURF FOR CARS is confident, fast, and purposeful. Users should feel the platform is responsive — not that it is performing.

### Principles

1. **Fast by default** — most transitions complete within 200ms
2. **Premium easing** — `--ease-premium: cubic-bezier(0.22, 1, 0.36, 1)` for entrances and interactions
3. **Respect reduced motion** — all animations disabled when `prefers-reduced-motion: reduce`
4. **No bounce** — spring easing is reserved for micro-interactions, never page transitions
5. **No autoplay loops** — except loading indicators and subtle shimmer placeholders

### Hover

- **Duration:** 120ms (`--duration-fast`)
- **Properties:** Background colour, border colour, shadow, subtle translate (-2px max for cards)
- **Cards:** Lift 2px, shadow increase — never scale transforms above 1.02
- **Buttons:** Background shift only — no ripple effects

### Loading

- **Skeleton:** Pulse animation, 2s cycle, muted surface colours
- **Spinner:** Single rotation, brand primary border-top — used sparingly
- **Page load:** Skeleton layout matching final structure — never generic spinners for full pages
- **Search:** Inline searching state — never block the entire viewport

### Transitions

- **Page transitions:** 350ms fade (`--duration-page`) — subtle opacity, no slide between routes
- **Tab/mode switches:** Crossfade content, 200ms
- **Expand/collapse:** Height auto with 300ms ease — filters, accordions

### Navigation

- **Header scroll:** Glass opacity transition, 200ms
- **Sidebar collapse:** Width transition 300ms with content fade
- **Mobile drawer:** Slide from edge, 300ms `--ease-premium`
- **Active route:** Colour change only — no animated underlines

### Dialogs

- **Entry:** Fade + scale from 0.98, 300ms
- **Exit:** Fade out, 200ms — faster than entry
- **Overlay:** Fade 200ms, subtle backdrop blur
- **Drawer (mobile filters):** Slide up from bottom, 300ms

### Cards

- **Hover:** Transform + shadow, 200ms `--ease-premium`
- **Entry (lists):** Staggered slide-up, 60ms delay between items, max 6 items staggered
- **Selection:** Border colour change — no checkmark animation

### Buttons

- **Press:** Active state colour shift — no scale-down bounce
- **Loading:** Spinner replaces icon — button width preserved
- **Disabled:** Opacity reduction — no transition on disabled state

### Search

- **Query input focus:** Border colour + focus ring, 200ms
- **Filter chip toggle:** Background + border, 200ms
- **Results appearance:** Fade-in when connected — skeleton first, then content
- **AI suggestion chips:** No animation on appearance — static, calm

### AI interactions

- **AI badge/indicator:** Static presence — subtle glow at most, no pulsing
- **Streaming responses:** Text appears progressively — no typing animation theatrics
- **AI insight cards:** Fade-in once complete — never animate while generating
- **Match scores:** Static display — no counting animations

---

## Component Philosophy

Every component family has a defined purpose and behaviour standard.

### Buttons

**Purpose:** Trigger actions. One primary action per context.

| Variant | Use |
|---|---|
| Primary | Main action — one per section maximum |
| Secondary | Supporting actions |
| Outline | Tertiary actions, filters, cancel |
| Ghost | Toolbar actions, icon-adjacent actions |
| Text | Inline links styled as actions |
| Danger | Destructive actions only |

**Rules:** Minimum height 40px (md), 48px (lg). Icon buttons minimum 44px touch target. Loading state preserves width. Never more than two buttons side-by-side on mobile without stacking.

### Cards

**Purpose:** Contain related information as a discrete unit.

**Variants:** Default, elevated, floating, glass, flat (empty states).

**Rules:** One primary action per card. Image aspect ratios are consistent within a grid. Interactive cards have hover lift. Cards never contain cards more than one level deep.

### Tables

**Purpose:** Display structured data for comparison and scanning.

**Rules:** Sticky headers on scroll. Row hover for scanability. Right-align numbers. Minimum 48px row height. Pagination for large datasets — never infinite scroll in admin tables. Bulk actions appear only when rows are selected.

### Forms

**Purpose:** Collect input with clarity and minimal friction.

**Rules:** Label above input. Error below input. Required fields marked with asterisk. Disabled fields visually distinct from readonly. Large inputs (lg) for hero search and primary forms. Group related fields visually.

### Charts

**Purpose:** Reveal patterns — not decorate dashboards.

**Rules:** Use chart colour tokens only. No 3D effects. No unnecessary gridlines. Label axes clearly. Tooltip on hover — not always-visible data labels. Responsive — simplify on mobile.

### Search

**Purpose:** The signature SURF experience — intelligent, fast, beautiful.

**Rules:** Hero search is the largest interactive element on search pages. Natural language input is visually primary. Classic filters are secondary/progressive. Quick filters are chips — horizontally scrollable on mobile. Results toolbar is sticky on desktop. Empty states guide — never blame the user.

### Navigation

**Purpose:** Orient users without demanding attention.

**Public nav:** Horizontal, minimal items, sticky glass header.  
**Portal nav:** Sidebar for authenticated surfaces, collapsible.  
**Breadcrumbs:** On detail pages and nested admin views only — not on homepage or search.

### Empty states

**Purpose:** Guide users when content does not exist.

**Rules:** Icon + title + description + optional action. Never illustration-heavy. Never fake content. Tone is helpful, not apologetic. Consistent vertical spacing. Same component family across platform.

### Dialogs

**Purpose:** Focus attention on a decision or task without losing context.

**Sizes:** sm (confirm), md (forms), lg (complex forms), xl (previews), fullscreen (media), drawer (mobile filters).

**Rules:** Always dismissible via Escape and overlay click (except destructive confirmations). Focus trap active. Return focus on close. Title required.

---

## Photography Philosophy

Imagery defines perception in an automotive platform. Photography standards are non-negotiable.

### Vehicle photography

- **Hero shots:** 3/4 front angle, clean background, dramatic but natural lighting
- **Gallery:** Consistent angles across listing — front, rear, interior, detail, engine
- **Background:** Neutral or contextual — never cluttered driveways unless lifestyle intentional
- **Resolution:** Minimum 1920px wide for hero, 800px for thumbnails
- **Aspect ratio:** 16:10 for cards, 16:9 for hero, 1:1 for thumbnails when grid-constrained

### Dealership imagery

- Showrooms should feel premium — clean, well-lit, professional
- Logo: square format, minimum 256px, transparent background preferred
- Team photos: professional, approachable — never stock photography

### People

- Real people when possible — diverse, South African context
- Never generic stock handshakes or pointing-at-screens
- Lifestyle context: families, professionals, adventure — matched to vehicle category

### Lifestyle

- Aspirational but authentic — not unattainable luxury fiction
- South African landscapes and urban contexts when location-relevant
- Vehicles are the hero — environment supports, never competes

### Backgrounds

- Dark, cinematic gradients for placeholder states — never flat grey boxes
- Radial light sources suggesting studio lighting
- Subtle texture acceptable — never noisy patterns

### Lighting

- Natural or studio — never harsh flash
- Consistent white balance across a listing gallery
- Shadow depth adds dimension — flat lighting feels cheap

### Mood

- Confident, premium, calm
- Never aggressive, never chaotic
- Night shots acceptable for luxury/performance — with intentional contrast

### Cropping

- Never crop vehicle wheels or roofline
- Maintain consistent padding within image containers
- Object-fit: cover for cards, contain for detail gallery when aspect differs

---

## Iconography

Icons at SURF FOR CARS use **Lucide React** exclusively via the platform icon registry (`src/components/ui/icons/registry.ts`).

### Rules

1. **One library.** Never mix icon sets.
2. **Never create custom icons** without updating the registry and this document.
3. **Semantic meaning.** Icons reinforce labels — never replace them without aria-label.
4. **Consistent metaphor.** Search = magnifying glass. AI = sparkles/bot. Settings = gear. Never swap metaphors across the platform.

### Weight

Lucide default stroke (2px). Never bold-stroke icons alongside default-stroke icons in the same context.

### Sizes

| Size | Pixels | Use |
|---|---|---|
| xs | 12px | Inline badges, chip icons |
| sm | 16px | Buttons, navigation, form icons |
| md | 20px | Standalone icons, card actions |
| lg | 24px | Empty states, feature icons |
| xl | 32px | Hero feature callouts |

### Usage

- **Navigation:** sm, muted tone default, foreground on active
- **Buttons:** sm, inherits button text colour
- **Empty states:** lg, muted tone
- **AI indicators:** sm, primary or secondary tone
- **Status:** sm, semantic colour matching status

### Colour

Icons inherit text colour by default. Explicit tone only for muted, primary, or semantic states. Never coloured icons for decoration.

---

## Illustration Style

Illustrations are used sparingly — prefer photography and typography. When illustrations are needed:

### Future AI

- Abstract geometric forms — nodes, connections, subtle gradients
- Primary and secondary brand colours only
- No robot mascots, no cartoon characters, no glowing brains

### Marketing

- Minimal line art or gradient compositions
- Automotive-inspired shapes — curves, roads, horizons
- Never clip-art, never 3D renders

### Education

- Diagram-style — clear, labelled, functional
- Consistent stroke weight with icon system
- Muted palette with primary accents for emphasis

### Empty states

- Icon-first — Lucide at lg size inside a rounded container
- No custom illustrations for empty states in v1
- Background: `--color-surface-sunken` circle or rounded square

---

## Data Visualization

Analytics and data at SURF FOR CARS must feel as premium as the public marketplace.

### Charts

- **Line charts:** Trends over time — single metric focus, clean axes
- **Bar charts:** Comparisons — horizontal bars for long labels
- **Donut charts:** Composition — maximum 5 segments, legend required
- **Area charts:** Volume over time — subtle fill opacity (12–20%)

### Analytics dashboards

- KPI cards: large number, small label, optional trend arrow
- Chart containers: glass or raised surface, generous padding
- No chartjunk — no unnecessary borders, backgrounds, or 3D effects
- Responsive: stack charts vertically on mobile, simplify legends

### Heatmaps

- Use primary colour scale for activity intensity
- Always include legend with value range
- Muted base for zero/low activity

### Performance metrics

- Green for positive trend, red for negative — never reversed
- Percentage change with arrow indicator
- Context label always present — number alone is insufficient

### Metrics tables

- Sortable columns where data supports it
- Fixed column widths for numeric data
- Alternating row backgrounds optional — border-subtle dividers preferred
- Export action in toolbar — not per-row

### Data visualization rules

1. Every chart answers one question.
2. Labels are always readable — rotate only as last resort.
3. Empty charts show empty state — not blank space.
4. Loading charts show skeleton matching chart dimensions.
5. Colour is semantic — never random assignment per chart.

---

## Responsive Philosophy

> Mobile first. No compromises.

SURF FOR CARS is designed for mobile first because most vehicle discovery happens on phones. Desktop is an enhancement — not the primary target.

### Breakpoints

| Name | Width | Approach |
|---|---|---|
| Mobile | < 640px | Single column, bottom actions, drawers |
| Tablet | 640–1024px | Two columns where appropriate |
| Laptop | 1024–1280px | Full layouts, sidebar visible |
| Desktop | 1280–1536px | Optimal experience |
| Ultrawide | > 1536px | Content contained — never stretched |

### Mobile principles

1. Touch targets minimum 44×44px
2. Primary actions in thumb reach (bottom bar when needed)
3. Filters in bottom drawer — never cramped inline
4. Horizontal scroll for chips and categories — with hidden scrollbar
5. Typography scales down one step maximum — never illegible
6. Hero search remains dominant — full width, large input

### No compromises

- Never hide critical functionality on mobile
- Never use "desktop only" features without mobile alternative
- Never reduce feature quality on mobile — adapt layout, not capability

---

## Accessibility Philosophy

> Readable. Reachable. Inclusive. Professional.

Accessibility is not a feature — it is a baseline requirement.

### Standards

- Target **WCAG 2.2 Level AA** minimum
- All interactive elements keyboard accessible
- Focus visible on all focusable elements (`:focus-visible` ring)
- Colour contrast ratio minimum 4.5:1 for body text, 3:1 for large text

### Screen readers

- Semantic HTML first — `<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`
- ARIA labels on icon-only buttons
- Live regions for search results and notifications
- Skip to main content link on all portal layouts

### Motion

- `prefers-reduced-motion: reduce` disables all non-essential animation
- `prefers-reduced-transparency: reduce` disables backdrop-filter on glass

### Forms

- Labels associated with inputs via `htmlFor`
- Error messages linked via `aria-describedby`
- Required fields indicated visually and programmatically

### Professional accessibility

Accessibility at SURF is invisible to users who do not need it — and essential for users who do. Never treat it as a checkbox exercise.

---

## AI Philosophy

> How AI should appear: Never gimmicky. Always useful. Quiet intelligence.

SURF Intelligence is a core differentiator — but it must feel like a capable assistant, not a marketing stunt.

### Visual presence

- **Badge:** "AI-ready" or "SURF Intelligence" with sparkles icon — primary muted background
- **Colour:** Secondary (`#6366f1`) for AI-specific surfaces — distinct from primary actions
- **Cards:** Glass or elevated surface — never neon, never animated borders

### Behaviour standards

- AI suggests — it does not decide for the user
- Confidence is shown honestly — no fake percentages
- Streaming responses are calm — no typing dots theatrics
- Errors are plain language — "We couldn't complete this" not "AI malfunction detected"

### Where AI appears

| Surface | AI role |
|---|---|
| Search | Natural language understanding, query suggestions |
| Vehicle cards | Match score (when connected) — subtle, not dominant |
| Dealer dashboard | Marketing generation, inventory insights, lead guidance |
| Content | Draft assistance — always editable by user |

### Where AI never appears

- As a mascot or character
- With exaggerated "magic" animations
- Replacing user decisions without confirmation
- Generating fake data or placeholder content

### Quiet intelligence

The best AI experience on SURF FOR CARS is one where users accomplish more without thinking about AI at all. Intelligence is infrastructure — not interface.

---

## Writing Style

Every word on the platform should feel:

- **Professional** — credible to dealership owners and serious buyers
- **Friendly** — approachable, never stiff
- **Confident** — direct statements, no hedging
- **Helpful** — guides action, explains value
- **Short** — say it in fewer words
- **Clear** — no jargon without purpose

### Never

- Corporate ("leverage synergies", "best-in-class solution")
- Robotic ("Your request has been processed successfully")
- Salesy ("Don't miss out!", "Limited time!")
- Apologetic ("Sorry, no results found" → "No results found. Try adjusting your filters.")
- Lorem ipsum or placeholder copy in production

### Voice examples

| Instead of | Write |
|---|---|
| "Utilize our advanced search functionality" | "Search the way you think" |
| "Error 500" | "Something went wrong. Please try again." |
| "No data available" | "No vehicles yet. Inventory will appear here when connected." |
| "Click here to learn more" | "Explore collections" |

### Terminology

- **Vehicle** — not "unit" or "stock item" on public surfaces
- **Dealership** — not "dealer" in user-facing copy unless space-constrained
- **Search** — not "query" or "find" on public surfaces
- **SURF Intelligence** — the AI brand name, capitalized

---

## SEO Philosophy

Every public page should naturally support search engine visibility without compromising user experience.

### Principles

1. **Content first** — SEO follows good information architecture, not the reverse
2. **Semantic HTML** — headings in order, descriptive link text, meaningful URLs
3. **Performance is SEO** — Core Web Vitals are ranking factors
4. **No keyword stuffing** — write for humans, structure for machines
5. **Indexable filter URLs** — search pages support canonical URLs with parameters (framework in `search-seo.ts`)

### Page requirements

- Unique `<title>` and `<meta description>` per page
- Open Graph metadata on public pages
- Canonical URLs defined
- Structured data (JSON-LD) when vehicle/listing data exists — not before

### What we do not do

- Hidden text or cloaking
- Doorway pages
- Auto-generated thin content
- SEO copy that reads differently from UI copy

---

## Performance Philosophy

> Fast by default. Everything optimized.

Speed is a brand value. A slow platform feels cheap — regardless of how it looks.

### Targets

| Metric | Target |
|---|---|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTFB | < 800ms |

### Principles

1. **Minimal JavaScript** — server components by default, client components only for interactivity
2. **Lazy loading** — images, below-fold sections, heavy charts
3. **Code splitting** — route-based and component-based
4. **Image optimization** — Next.js Image, WebP/AVIF, responsive sizes
5. **Font optimization** — `display: swap`, subset loading
6. **No layout shift** — skeleton dimensions match final content
7. **Caching strategy** — static where possible, revalidation for dynamic data

### Search performance (future)

- Instant search results — debounced, cached, optimistic UI
- Virtual scrolling for large result sets
- Infinite scroll with intersection observer — not pagination-only on mobile
- Prefetch on hover for vehicle detail pages

---

## Governance

### This document is law

Any design or implementation decision that contradicts the SDL must be:

1. Documented with rationale
2. Reviewed before merge
3. Updated in this document if approved

### When to update the SDL

- New colour, type size, or motion pattern is introduced
- New component family is created
- Brand direction shifts
- User research reveals emotional or accessibility gaps

### Relationship to code

| SDL section | Code implementation |
|---|---|
| Colour Philosophy | `src/styles/tokens/colors.css` |
| Typography Philosophy | `src/styles/tokens/typography.css` |
| Layout / Spacing | `src/styles/tokens/spacing.css`, `breakpoints.css` |
| Motion Philosophy | `src/styles/tokens/motion.css` |
| Radius / Shadow | `src/styles/tokens/radius.css`, `shadows.css` |
| Glass | `src/styles/tokens/glass.css` |
| Component tokens | `src/styles/tokens/components.css` |
| TypeScript mirror | `src/config/design-system/tokens.ts` |
| UI components | `src/components/ui/` |
| Naming | `src/config/naming-standards.ts` |

### For AI agents and contributors

Before implementing any feature:

1. Read this document
2. Identify which SDL sections apply
3. Use existing tokens — do not invent values
4. Match existing component patterns in `src/components/ui/`
5. If the SDL is insufficient, propose an addition — do not silently diverge

---

## Quick Reference Card

```
SURF FOR CARS — Design at a glance

Personality:  Luxury · Speed · Confidence · Precision · Premium
Emotion:      Confident · Inspired · In control
Layout:       Breathe · One focal point · Generous space
Type:         Inter · Display for heroes · Body for reading
Colour:       Blue action · Gold accent · Dark cinematic base
Motion:       200ms · Premium ease · Communicate not entertain
Glass:        Sparingly · Headers · Search · Floating panels
AI:           Quiet · Useful · Secondary colour · No gimmicks
Copy:         Short · Clear · Confident · Never corporate
Performance:  Server-first · Lazy · Optimized · No layout shift
Accessibility: WCAG AA · Keyboard · Focus · Semantic HTML
```

---

*SURF FOR CARS — The future of automotive discovery.*
