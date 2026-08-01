# SURF4CARS Product Bible — Version 1.0

> Author: SURF4CARS Engineering
> Created: 2026-06-28

## Table of Contents
- 1. Product Vision
- 2. Mission Statement
- 3. Product Philosophy
- 4. Design Philosophy
- 5. Brand Identity
- 6. UX Principles
- 7. Design System
- 8. Homepage Standards
- 9. Search Experience
- 10. Vehicle Marketplace Standards
- 11. Vehicle Detail Standards
- 12. Dealer Experience Standards
- 13. AI & SURF Intelligence Standards
- 14. Trust & Safety Standards
- 15. Mobile Experience Standards
- 16. Accessibility Standards
- 17. Performance Standards
- 18. Technical Architecture
- 19. Coding Standards
- 20. Development Workflow
- 21. Sprint Standards
- 22. Claude Operating Rules
- 23. Quality Assurance Standards
- 24. Security & Privacy Standards
- 25. SEO Standards
- 26. Analytics & Metrics Standards
- 27. Future Roadmap
- 28. Appendix

---

## 1. Product Vision

Purpose
- Provide South Africans and listed dealerships a premium, trustworthy, AI-augmented marketplace for buying and selling vehicles.

Mission
- Make vehicle discovery and purchase faster, safer and more delightful using design-first product experience and intelligence that reduces friction for buyers and sellers.

Long-term goals
- Lead the South African market for online automotive discovery.
- Deliver differentiated AI capabilities (SURF Intelligence) that increase conversion and trust.
- Scale to international markets while preserving a local-first experience.

Target market
- Consumers in South Africa shopping for new and used vehicles.
- Dealerships and franchised retailers seeking a high-quality sales channel and business insights.

Competitive positioning
- Premium UX and photography-forward listings.
- High-trust network of verified dealers and transparent vehicle data.
- Smart discovery — natural language search and buying guidance.

---

## 2. Design Philosophy

Core principles
- Premium: High-fidelity visual language, photography-first assets, restrained motion and elevated typography.
- Simple: Reduce cognitive load — prioritise clarity over features.
- Trustworthy: Transparent dealer information, vehicle history and easy-to-find trust signals.
- Automotive-first: Components, flows and taxonomy are vehicle-centric, not generic marketplace patterns.
- AI-powered: Intelligence should assist, not replace, user control.
- South African first: Local pricing, finance, and regulatory considerations are primary.
- Scalable internationally: Design tokens, i18n, and localized assets to enable expansion.

---

## 3. UX Principles

Navigation
- Clear, persistent header with primary actions: Search, Categories, Dealers, Sign-in.
- Progressive disclosure: surface simple choices first, hide advanced filters in contextual drawers.

Spacing
- Use a consistent spacing scale (tokens) — small, medium, large defined in tokens files.
- Maintain roomy hero and card spacing to communicate premium quality.

Hierarchy
- Strong, readable typographic scale for headlines, section titles, and body copy.
- Primary CTAs always visually distinct (colour, size, weight).

Consistency
- Components must follow the design system and token usage. Reuse over bespoke styles.

Accessibility
- Aim WCAG AA contrast for text and actionable controls.
- Keyboard navigable search, filters and listings. Include aria labels and roles.

Motion
- Subtle micro-interactions: hover lifts, soft shadows, and gentle transitions.
- Reserve larger motion for state changes, not essential tasks.

Responsiveness
- Mobile-first constraints; ensure important CTAs are visible on small viewports.
- Use breakpoints to progressively reveal content.

---

## 4. Design System

Colours
- A restrained palette: primary (brand), neutrals, success/warning/critical.
- Use glassmorphism tokens for overlays (see `src/styles/tokens/glass.css`).

Typography
- Distinct scale for hero, H1–H4, lead, body, caption.
- Use variable fonts delivered via preloads; ensure font fallbacks.

Buttons
- Primary, secondary, outline and ghost variants. Clear accessible focus states.
- Size variants: sm, md, lg; use `motion-button` token for transitions.

Cards
- Image-backed principal cards for categories and featured listings.
- Consistent elevation and rounded corners; maintain image crop guidance.

Forms
- Compact, accessible inputs; consistent labels and helper text.
- Disabled and loading states must be clear and consistent.

Tables
- Use for data-dense dealer/analytics screens; responsive stacking on small viewports.

Badges
- Support for small contextual tags (verified dealer, new, certified).

Glass effects
- Controlled usage: subtle blur + low-opacity surface colors for premium panels.

Shadows
- Soft, directional shadows for lift; tokens in `src/styles/tokens/shadows.css`.

Border radius
- Tokenized radii for pills, cards, modals.

Spacing scale
- Tokenized spacing (4/8/12/16...) mapped to CSS variables for consistent composition.

---

## 5. Homepage Standards

Hero
- Use large photography with left-aligned content and a compact SURF Intelligence panel (glass surface).
- Headline: "South Africa's smarter way to buy & sell cars." (use promotional override token)
- Supporting text: concise and benefit-led.

Categories
- Image-backed tiles with overlay, title, tagline, vehicle count and Explore action.
- Equal visual weight and consistent grid spacing.

Listings
- Showcase listings with hero images, price prominence, mileage and key badges.
- Provide quick actions (save, contact dealer).

Dealer sections
- Emphasize verification, ratings, and simple CTA to view dealer inventory.

CTA
- Primary CTA visible in hero and above-the-fold areas; support secondary CTAs for browsing.

Footer
- Legal, support, dealer resources and regional info; compact but readable.

---

## 6. Vehicle Detail Standards

Gallery
- Large image carousel, lazy-loaded, with clear thumbnails.

Images
- High-resolution; follow aspect/crop guidelines; indicate original resolution.

Specifications
- Structured spec blocks and quick highlights (e.g., fuel type, transmission).

Dealer trust
- Dealer badge, contact options, location/map, trading history.

Finance
- Clear price breakdown, optional monthly/finance calculators.

AI
- Contextual SURF intelligence suggestions for similar vehicles, fit-for-purpose guidance.

Safety
- Show safety ratings prominently when available.

Comparison
- Allow side-by-side comparison of selected vehicles.

Related vehicles
- Curated and algorithmic suggestions below the fold.

---

## 7. Dealer Experience Standards

Dashboard
- Clear KPIs: views, leads, listings health, recommended actions.

Inventory
- Bulk upload, photo guidance and quick edit flows.

Leads
- Clear timeline, status updates and owner assignment.

Marketing
- Promote featured listings and highlight inventory gaps with simple campaigns.

Analytics
- Actionable insights; avoid raw data dumps.

Upload Wizard
- Stepper-based, with image validation and AI suggestions for copy/attributes.

---

## 8. AI Standards

SURF Intelligence
- Assistive features must be transparent: show that suggestions are AI-assisted.

Natural language search
- Accept user text; fallback to structured filters when ambiguous.

Recommendations
- Combine collaborative signals with inventory heuristics; include confidence indicators.

Buying advice
- Provide short human-readable rationales for recommended matches.

Dealer insights
- Privacy-conscious aggregate insights; no PII leakage; explainability for derived metrics.

---

## 9. Technical Standards

Frameworks
- Next.js (app router) — production: v16.x; follow SSR/SSG conventions per route.
- React 19+, TypeScript 5.
- TailwindCSS utilities (v4 syntax) using design tokens.

Backend
- Supabase for primary datastore/auth where appropriate; follow connection and role conventions.

Component structure
- Feature-first layout in `src/features/*` and shared UI in `src/components/ui/*`.
- Keep presentational and logic separated. Prefer small composable components.

Naming conventions
- Files: kebab-case for components and folders. Exports: PascalCase for components, camelCase for helpers.

Folder standards
- App-level routing in `src/app`; features under `src/features`; design tokens in `src/styles/tokens`.

Performance expectations
- Lighthouse score >90 on desktop where possible; image optimization via Next/Image and appropriate preloads.

---

## 10. Development Standards

Lint
- ESLint with project rules; fix issues before PRs. Use `npm run lint`.

Build
- Next.js build must complete without errors. Use `npm run build`.

Testing
- Component/unit tests for core components. Add integration checks for critical pages.

Documentation
- Keep docs in `docs/`; inline code comments for non-obvious decisions.

Screenshots
- Visual QA required for hero, categories and vehicle pages across desktop/tablet/mobile.

Sprint completion requirements
- Lint and build pass, visual review completed, screenshots captured, and PR description with testing notes.

---

## 11. Claude Operating Rules

Role
- Claude is a tooling assistant used to author docs, create drafts, and surface relevant code pointers.

What Claude should do
- Summarize code and repo-level decisions.
- Draft content, help curate product copy, and prepare PR descriptions.
- Run non-destructive edits when explicitly requested and approved.

What Claude must never do
- Deploy to production or run privileged commands without human approval.
- Modify business-critical config or secrets.
- Make unilateral functional changes to live user flows without sign-off.

When Claude must ask questions
- If a requested change affects data privacy, billing, or legal compliance.
- When incomplete information prevents safe decisions (e.g., undefined API contract).

When Claude must stop
- On encountering operations that require credentials, or when tests/builds fail repeatedly and human direction is needed.

---

## Appendix: References to codebase
- Design tokens and glass styles: [src/styles/tokens/glass.css](src/styles/tokens/glass.css#L1)
- Homepage shared tokens: [src/features/marketplace/homepage/components/home-shared.ts](src/features/marketplace/homepage/components/home-shared.ts#L1)
- Hero component: [src/features/marketplace/homepage/components/home-hero.tsx](src/features/marketplace/homepage/components/home-hero.tsx#L1)
- SURF Intelligence panel: [src/features/marketplace/homepage/components/home-hero-search.tsx](src/features/marketplace/homepage/components/home-hero-search.tsx#L1)
- Premium image assets: [src/config/images/premium-images.ts](src/config/images/premium-images.ts#L1)

---

### Version history
- v1.0 — Initial product bible (2026-06-28)



