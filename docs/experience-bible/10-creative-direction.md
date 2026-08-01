# 10 — Creative Direction

Brands are curated. They are not algorithmically assembled.

Up to PCP-004C, image selection was an engineering problem: search a library, score the results,
take the best one. That approach produced a shopfront in the SUVs tile, and no amount of heuristic
tuning would have fixed it — the decision was never an engineering decision. This document
replaces the heuristic with a review process.

**The software does not choose photographs. The Founder does.**

---

## The rule

> Given a technically correct photograph and an emotionally compelling photograph,
> choose the emotionally compelling photograph.

Resolution, licence and shape are things a script can check. Whether a frame makes someone want to
drive somewhere is not, and the moment a script starts guessing at it the brand stops being
curated.

---

## The workflow

Three steps, in order. Each is a separate kind of decision, so each is a separate action.

### 0. Scaffold — once per clone

```bash
npm run media:scaffold
```

Creates `public/media/premium/` and its eight sections, each with a README stating what belongs there
and how it is allowed to arrive. The taxonomy is data — `scripts/media/library.sections.json` — because
both these Node scripts and the review dashboard inside the application need it, and a disagreement
about where a brief is filed ends with two copies of one photograph and no way to tell which is live.

| Section | Sourcing | Holds |
| --- | --- | --- |
| `hero/` | curated | The homepage hero |
| `categories/` | curated | One frame per body style |
| `dealers/` | curated | Dealer covers, and the fallback dealer mark |
| `showrooms/` | curated | Showroom interior architecture |
| `backgrounds/` | curated | Full-bleed editorial plates |
| `promotions/` | composed | Banner plates; SURF type is laid over them at render time |
| `manufacturers/` | uploaded | Marque logos — trademarks, never substituted |
| `vehicles/` | uploaded | Photographs of specific cars, published by their dealer |

The last two are filled by upload, not by review. They are listed rather than hidden because the most
common way a brand ends up with a stock photograph where a real one belongs is that nobody wrote down
why the slot was empty.

### 1. Acquisition — engineering

**Sources, in order (PCP-005B).**

| Source | Key | Use |
| --- | --- | --- |
| Pexels | `PEXELS_API_KEY` | Primary. Landscape + large filters applied at the API. |
| Unsplash | `UNSPLASH_ACCESS_KEY` | Primary. |
| Openverse / Wikimedia Commons | none | **Retired for new acquisition.** Retained only so images approved before this sprint stay traceable. |

Both libraries require a free API key; neither offers an unauthenticated search endpoint. Put the key
in `.env.local` — the acquisition scripts read it from there as well as from the environment.

Commons was retired because it is an encyclopaedia archive rather than a picture library. It reliably
returns photographs *of* cars — an NYPD cruiser for "luxury car", a federal evidence photograph for
"pickup truck", a listed building with a minivan parked outside — and almost none that would survive
a marque's marketing page. That is not a tuning problem, and it was never going to become one.

**There is no fallback when a key is missing.** The run stops and prints the two signup links. The
only thing a fallback could reach is the archive, and quietly substituting worse photography is the
exact failure this sprint exists to end.

**Attribution: we over-credit deliberately.** Neither licence makes a credit mandatory, and both
providers' API terms ask for one anyway. So both are recorded as `requiresAttribution`, and the credit
renders through the same component as a CC BY photograph. The cost is a line of small text; the
alternative is leaning on a favourable reading of someone else's terms to avoid crediting the
photographer whose work is carrying the homepage. Unsplash additionally requires that a download be
reported to them, which the approval step does — approval being the moment a frame becomes ours.


```bash
node scripts/media/shortlist-candidates.mjs <brief-id>     # one category
node scripts/media/shortlist-candidates.mjs --all          # every category
node scripts/media/generate-inhouse-candidates.mjs dealer-logo
```

Collects three to five candidates per brief from Openverse and Wikimedia Commons and writes them
to `scripts/media/candidates/<brief-id>/`. It rejects, before anything reaches review:

| Constraint | Rule |
| --- | --- |
| Licence | The Pexels and Unsplash licences; or CC0, public domain, CC BY, CC BY-SA from the archive. Nothing else. |
| Fitness | Landscape, and wide enough — *as delivered* — to survive the crop the brief needs. |
| Subject | The description names something automotive; documents, diagrams, wrecks, models, public records and pre-1990 period pieces are dropped. |

Two brief-level escapes exist for the subject filter, because it was written against archive
full-text search:

- `allow` removes tokens from the global reject list. The showroom brief needs "interior", which
  every other brief is right to reject.
- `subjectFilter: false` turns the vocabulary requirement off. Correct for a brief about a place or a
  mood rather than an object — a photograph of Table Mountain contains no automotive vocabulary and is
  exactly what the Cape Town brief asked for. The rule earns its keep only where a wrong subject is a
  bug, and a curated library's relevance ordering does not fail the way full-text search does.

**Fitness is measured on the file, not on the claim.** Archives over-report: Openverse describes a
StockSnap frame as 8192px wide while linking its 960px derivative, and no larger variant exists to
ask for. So each candidate's master URL is checked before it reaches the board — from the width named
in the URL where the host states it, otherwise by reading the image header out of the first 64KB. A
frame that can only be delivered soft is dropped with a note, and the approval step re-checks the
decoded master as a backstop for boards shortlisted before this existed.

> **On supply.** These two sources are archives, not stock libraries. They reliably yield
> licence-clean photographs *of cars*; they do not reliably yield photographs that clear "would
> Porsche use this?". Expect to reject most of a board. Filling these briefs to the standard in this
> document is a purchasing decision — licensed stock, or a commissioned shoot — not a tuning problem.

The subject filter is a correctness filter, not a creative one. Full-text image search will return
a lottery building for "hatchback"; rejecting that is not curation, it is not shipping a bug. Among
the frames that survive, **no ordering is implied and none is presented.**

### 2. Review — creative direction

```bash
npm run dev
open http://localhost:3003/admin/creative/media-review
```

The review dashboard. Every section, every brief, and every candidate — with the brief's own emotion
and direction beside them, and licence, resolution, credit, attribution obligation and source under
each frame. Previews are cropped by the same `object-fit: cover` the real layout uses, at the brief's
own aspect ratio, so the board cannot promise a crop the site will not keep.

**Approving is one click.** No selection state, no draft, no batch — a candidate is either approved or
it is not, and browsing cannot put an image into the brand as a side effect.

The dashboard writes into the working tree and regenerates a committed source file, so it is a local
curation tool by construction and the route does not exist in production. Reviewing is local work;
committing the library and the manifest is what ships a decision.

`node scripts/media/build-review-board.mjs` still builds a self-contained `review/index.html` for
review away from a dev server — emailed, or kept as a record of what was on the board that day.

### 3. Approval — the record

One click on the dashboard, or equivalently:

```bash
node scripts/media/approve-selection.mjs <brief-id> <candidate-number>
node scripts/media/approve-selection.mjs <brief-id> <candidate-number> --replace --note "reason"
```

The dashboard runs exactly this command rather than reimplementing it, so a click and a keystroke
produce byte-identical results and the same audit trail. This is the **only** path by which an image
becomes a brand asset. It:

1. verifies the decoded master is genuinely large enough for the slot, and refuses if it is not;
2. writes `public/media/premium/<section>/<brief-id>.webp` at up to 2560px;
3. records licence, author, source, candidate number and approval date in
   `public/media/premium/manifest.json`;
4. regenerates `src/config/media/premium-manifest.generated.ts`, which the application imports.

**An approved asset is never overwritten silently.** Re-approving a category fails unless
`--replace` is passed, and the retired entry is kept in the manifest's `superseded` history. Once
a frame is approved it is part of the brand, and replacing part of a brand is a decision someone
has to make on purpose.

---

## The categories

| Brief | Slot | Candidates |
| --- | --- | --- |
| `hero` | Homepage hero | 10 |
| `suv` `sedan` `hatchback` `bakkie` `luxury` `ev` | Body-style tiles | 10 each |
| `performance` `mpv` `convertible` | Body-style tiles | 10 each |
| `showroom` | Dealer profile interiors | 20 |
| `dealer-cover` | Dealership exteriors, dealer profile covers | 20 |
| `lifestyle` | Editorial and people-led surfaces | 20 |
| `cape-town` | Regional identity, hero alternates | 20 |
| `editorial-buyers` | Homepage editorial section plate | 10 |
| `promo-banner` | Promotional banner plate | 10 |
| `dealer-logo` | Dealer fallback mark | In-house |

Four categories need explaining.

**`lifestyle`** is the one brief where the failure mode is the photography looking *like stock*. No
thumbs up, no handshake over a desk, no keys held to camera. One or two people, natural light,
unposed, doing something specific.

**`cape-town`** exists because a South African marketplace should look like one. Place before product:
a car in frame is a bonus, not a requirement.

**`editorial-buyers`** is judged almost entirely on its quiet area rather than its subject. The copy
holds the left third of the frame, so a candidate with a beautiful subject dead centre is the wrong
candidate.

**Promotional banners** are a photographic plate plus SURF typography. The brief selects the plate
only — type is composed over the approved image in the layout, never burned into the pixels, which
is the mistake the retired v3 hero made. A candidate must therefore hold a large quiet area for
copy.

**Dealer logos** cannot be sourced at all. A dealership's logo is its own trademark and is uploaded
by the dealer; substituting a stock image for it would be both wrong and unlawful. What the
platform actually needs curating is the *fallback mark* shown when a dealership has not uploaded
one, so those candidates are generated from the SURF brand system and carry no third-party licence.

---

## Attribution

CC BY and CC BY-SA photography is free to use only while the credit is given. The credit is
rendered from the same manifest as the image, so it cannot drift out of sync with what is on screen:

```tsx
import { MediaAttribution, MediaCredits } from "@/components/ui/media";

<MediaAttribution mediaId="hero" variant="overlay" />   // on the photograph
<MediaCredits />                                        // full list, for the colophon
```

An asset whose licence asks for nothing renders nothing — a credit line under a CC0 photograph is
noise, and noise is what teaches people to stop reading credits.

**Never remove or obscure an attribution to make a layout work.** Change the layout.

---

## Engineering rules

- The public application reads `src/config/media` and `public/media/premium/`. It never reads
  `scripts/media/`, and never fetches an image at runtime.
- The one exception is the review dashboard under `/admin/creative/media-review`, which reads
  candidate boards because reviewing them is what it is for. It is absent from production builds and
  unreachable from any marketplace page. Candidate previews are streamed by a dev-only route handler:
  an unreviewed frame is not a brand asset and must not be reachable by URL guessing or by a crawler.
- `scripts/media/` is a content acquisition tool used *before* a decision. It is not a runtime
  dependency of the marketplace and must never become one.
- Approved photographs are committed. They are production assets, not build output.
- Category tiles are all one aspect ratio, and every fallback photograph is that ratio or wider.
  `object-cover` on a source narrower than its container crops the sides, which cuts the nose and
  tail off the car. Hierarchy in the category band comes from how many columns a tile spans, never
  from its shape.
- `premium-manifest.generated.ts` is generated. Editing it by hand records an approval that never
  happened.
- `PREMIUM_IMAGES` resolves each curated slot through the library and falls back to the legacy
  asset until that category has been reviewed. Approving a candidate swaps the image with no code
  change; that is the intended way to change how Surf4Cars looks.
