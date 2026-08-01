# Founder Review Checklist

Ten questions, asked of every public page before it is considered finished. A page scores a point
only where the answer is an unqualified yes.

| # | Criterion | What fails it |
|---|---|---|
| 1 | Premium first impression | The first screen looks like an application rather than a publication |
| 2 | Beautiful photography | Any lead image that would not print in a magazine |
| 3 | Clear hierarchy | The eye does not know where to land first |
| 4 | Strong typography | Type is doing decoration rather than doing the work |
| 5 | Trustworthy content | A claim the platform cannot prove, or data nobody checked |
| 6 | No placeholder content | "Coming soon", disabled controls, invented values |
| 7 | No duplicated information | The same fact, or the same control, twice on one screen |
| 8 | No visual clutter | Anything present because it was easy rather than because it earns attention |
| 9 | Smooth interactions | Motion that draws attention to itself, or a jump on load |
| 10 | Screenshot worthy | Would this appear on a design gallery under our name |

## How to run it

```bash
npm run dev
node scripts/capture-premium-audit.mjs      # every public surface, desktop and mobile
```

Then look at the screenshots side by side. Do not read the code. Rule 9 exists because a page can be
correct in every file and still be the weakest thing in the set — and that is only visible next to
the others.

---

## Current scores — PCP-020

Scored by looking, not by asserting. Where a page loses a point the reason is named, because a
checklist that only ever reports 10/10 is decoration.

| Page | Score | Losing on |
|---|---|---|
| Homepage | 9 / 10 | **2 — photography.** The hero is commissioned and excellent. The featured grid below it is library reference photography. |
| Marketplace (`/search`) | 8 / 10 | **2 — photography.** Motor show halls, a workshop, an industrial yard, visible in the first row. **7** — a card can repeat a photograph another listing already used, because distinct real vehicles share a library image. |
| Vehicle detail | 9 / 10 | **2 — photography**, same cause. Structure, hierarchy and typography are where they should be. |
| Dealer profile | 9 / 10 | **2 — photography.** |
| Sign in | 10 / 10 | — |
| Create account | 10 / 10 | — |
| Buyer sign-up | 9 / 10 | **5 —** the description says "Sign in to save vehicles" on a page that creates an account, and offers a "buyer workspace", which is an internal name. |
| Dealer sign-up | 9 / 10 | **8 —** roughly 300px of empty page above the panel on a 1000px viewport. |
| Access denied | 10 / 10 | — |
| Not found | 10 / 10 | — |

**Every point lost on a public page traces to one of two causes.** Nine of the eleven are criterion 2,
and they are all the same finding: the demonstration library is reference photography — taken to
identify a model and record a trim, wherever the car happened to be standing. Sixteen of seventeen
candidate lead frames examined against the standard failed it. See
`src/config/media/editorial-standards.ts` and `docs/reports/photography-audit.md`.

No layout change fixes that. It is a commissioning decision, and the Founder Editorial Console at
`/operations/editorial` is built and waiting for the frames.

The remaining two are copy, and are cheap.

---

## The rule this checklist is really enforcing

> A page is not finished because it works. It is finished when nothing on it is there by accident.

The disciplines that produced the current state, in the order they paid off:

1. **Look at the page.** Every serious defect in the last four sprints was found by opening a
   screenshot, not by reading a file. The sign-in page had no header for five sprints while sitting
   in the capture pack the whole time.
2. **Curl the route.** The Editorial Console was built assuming a permission gate protected it. The
   gate existed and was not running — every operations, dealer and buyer route answered 200 to
   anybody, because the middleware file sat one directory too high.
3. **Measure, do not assume.** `max-w-xl` reads as 36rem and computed to 1280px, so every auth form
   was 1248px wide. Nothing in the source looked wrong.
4. **Distrust the second frame.** Denying a bad photograph is only half a fix; twice, what the
   projection fell through to was worse than what it replaced.
