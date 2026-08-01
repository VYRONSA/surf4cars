# 03 — Photography Direction

> Photography is the product. Everything else is packaging.

This is the highest-leverage chapter in the Bible. A mediocre interface with excellent photography
outperforms an excellent interface with mediocre photography, every time. Most of what makes
SURF4CARS feel premium is decided here — not in code.

---

## 1. Vehicle photography — the standard

This is the specification we give dealers, enforce in the upload flow, and score listings against.

### Lighting

**Target: overcast-bright, or open shade.** Soft, directional, no hard shadows.

| Do | Never |
| --- | --- |
| Overcast daylight, or an hour after sunrise / before sunset | Midday sun — blows highlights, black shadows under the arches |
| Open shade with an unobstructed sky | Direct flash — flattens the body and produces hotspots |
| Even illumination along the full flank | Mixed colour temperature (sodium + daylight) |
| A single visible highlight running the length of the body | A photographer's reflection in the doors |

The single most valuable technical instruction we can give a dealer: **shoot the car in overcast
light or open shade, never in direct midday sun.** That one change lifts perceived listing quality
more than any other.

### Background

**Clean, uncluttered, and darker than the vehicle where possible.**

Acceptable: plain wall (concrete, charcoal, neutral render); empty tar or paved surface; showroom
floor; an uncluttered natural setting with a clear horizon.

Never: other cars in frame; people; wheelie bins, cones, hosepipes, signage; a busy forecourt; a
domestic driveway with laundry, pets or a garden hose; number plates of *other* vehicles.

### Camera angles — the required sequence

Every listing follows the same order. Consistency across listings is itself a premium signal, and it
lets buyers compare vehicles without re-orienting.

| # | Shot | Notes |
| --- | --- | --- |
| 1 | **Front three-quarter** | The hero. Wheels turned toward camera. This is the card thumbnail |
| 2 | Rear three-quarter | Opposite corner |
| 3 | Direct side (profile) | Full flank, level, car parallel to sensor |
| 4 | Front straight-on | |
| 5 | Rear straight-on | |
| 6 | Interior — driver's seat | From the rear door, showing dash and both front seats |
| 7 | Dashboard & instruments | **Ignition on, odometer legible** |
| 8 | Rear seats | |
| 9 | Boot / load space | Empty |
| 10 | Engine bay | Clean, bonnet fully open |
| 11 | Wheels & tyres | At least one, showing tread |
| 12+ | **Honest defect shots** | Every scratch, kerbed rim, chip or wear point |

**Camera height: door-mirror level.** Not standing, not on the ground. Shooting from eye level makes
a car look small and ordinary; mirror height makes it look planted.

**Lens:** moderate telephoto equivalent (~35–50mm on full frame). Never an ultra-wide for exteriors —
it distorts proportions and reads as an estate-agent photo.

### Defect photography is mandatory, not optional

This is a **brand differentiator**, not a compliance burden. Disclosing flaws before the buyer finds
them is exactly how the showroom in our brand personality behaves.

Every known defect gets its own photograph, close, well-lit, in context. The vehicle detail page
gives these a dedicated, respectfully-labelled section — **"What to know"**, never "Damage".

A listing with honest defect photography must be **scored higher** by listing completeness than one
without.

### Aspect ratios

| Context | Ratio | Notes |
| --- | --- | --- |
| Vehicle card thumbnail | **16:9** | Universal card ratio. Never crop the vehicle's nose or tail |
| Gallery main image | **3:2** | Native to most cameras; least destructive crop |
| Gallery thumbnails | 1:1 | Centre-weighted |
| Full-bleed hero | 21:9 | Desktop only; falls back to 16:9 below `lg` |
| Dealer logo | 1:1 | Contained, never cropped, transparent or neutral background |
| Dealer banner | 4:1 | Desktop; 2:1 crop on mobile |

**Rules:** every image container has a fixed aspect ratio so there is **zero layout shift** as
images load. Vehicles are always `object-fit: cover` with a centre-weighted focal point. Logos are
always `object-fit: contain`. Never upscale beyond native resolution.

### Minimum standards

| | Minimum | Target |
| --- | --- | --- |
| Images per listing | 6 | 12+ |
| Longest edge | 1600px | 2400px |
| Format | WebP/AVIF with JPEG fallback | |
| Required shots | Front ¾, side, interior, dash with odometer | Full 12-shot sequence |

Below minimum, the listing cannot be published — with a clear, encouraging explanation of what is
missing. See [05](05-writing-style.md).

---

## 2. Dealer imagery

**Logos.** Displayed in a fixed square container on a neutral surface, `object-fit: contain`, never
cropped, never stretched, never on a coloured background of the dealer's choosing. If a logo is
illegible on dark, render it on a `--color-surface-raised` plate rather than inverting it.

**Never let a dealer logo introduce a colour into the interface.** A logo is content inside a
container, not a theme.

**Banners.** Real premises, real people, shot to the same lighting standard as vehicles. A photograph
of the actual showroom or forecourt outperforms any graphic. Text is never baked into a banner image
— it will not scale, translate, or meet contrast requirements.

**Fallback.** A dealer with no banner gets a matte surface with their name set in our typeface — not
a stock photograph of a generic showroom, and not a placeholder illustration.

---

## 3. Lifestyle & hero imagery

Used on the homepage, category entry points, campaigns and editorial surfaces.

**Principles**

1. **The car is the subject.** People may appear, but never as the focus, never looking at camera,
   never in a staged handshake or key-handover.
2. **Real places, real light.** Recognisable and specific beats aspirational and generic.
3. **Cars that exist in our market.** Photographing vehicles nobody can buy here breaks the promise.
4. **Motion or stillness, never fake motion.** No cloned motion blur, no composited backgrounds.

### South African identity

This is our strongest and least copyable visual asset. Every competitor uses the same international
stock library. **We should look like we are from here** — specifically, recognisably, proudly.

**Cape Town.** Chapman's Peak Drive — the definitive South African driving road, best in late
afternoon light with the Atlantic below. Signal Hill and Bloubergstrand for Table Mountain as
backdrop. The Waterfront and city bowl at dusk for urban/premium. Franschhoek Pass and the
Winelands for touring and luxury.

**Table Mountain** is our single most recognisable landmark. Use it as **backdrop, never as
subject** — the mountain sits behind the car, ideally from Blouberg with the mountain across the bay.
Do not turn it into a tourism poster.

**Johannesburg.** Sandton skyline for executive and premium. The M1 and Nelson Mandela Bridge for
urban energy — at dusk, with the city lit. Kyalami and the surrounding Midrand corridor for
performance. Northern-suburb tree-lined avenues for family vehicles.

**Roads.** Long Karoo straights for touring and endurance. Mountain passes — Bain's Kloof, Sani
(4x4), Montagu — for capability. Coastal roads for lifestyle. Winelands gravel for crossovers and
SUVs.

**Night photography.** Powerful and heavily on-brand for the dark palette, but the hardest to get
right. Shoot at **blue hour, not full dark** — enough ambient light to hold the body shape. Wet tar
after rain doubles the light and looks exceptional. Let the car's own lighting signature (DRLs, tail
bar) be the brightest thing in frame. Never use a bright yellow sodium-lit car park.

### Stock imagery

**Avoid it wherever avoidable.** Where it is genuinely unavoidable:

- Never a visibly international setting (left-hand drive, foreign plates, foreign signage).
- Never people in staged "happy customer" poses.
- Never a smiling salesperson with a clipboard.
- Never an illustration, 3D render, or vector scene as a substitute for a photograph.
- It must pass the honesty test: **does this look like a real place a South African could drive to?**

**Prefer a well-composed matte surface over a bad stock photograph.** Empty and confident beats
generic and busy.

---

## 4. Treatment in the interface

**Scrims.** Any text over photography sits on a gradient scrim from `--color-background` at
appropriate opacity. Never text directly on an image — contrast cannot be guaranteed against
arbitrary photography, and this is an accessibility requirement, not a preference.

**No filters.** No duotone, no colour grading, no brand-tinted overlays. We show the car as it is —
this is a trust product. The only permitted treatment is a neutral darkening scrim for legibility.

**Loading.** Fixed-ratio container → skeleton at `--color-surface-overlay` → image fades in over
`--duration-normal`. Never a spinner over an image container; never a layout shift.

**Failure.** A broken or missing image shows a matte surface with a small vehicle silhouette icon in
`--color-muted`. Never a broken-image glyph, never an error message, never empty space. A single
off-host image must never be able to break a page — image hosts must be allow-listed and unknown
hosts resolved to a safe fallback.

**Corners.** Photography follows the container radius. A vehicle image in a card is
`--radius-xl` on its top corners; a full-bleed hero is square-edged.
