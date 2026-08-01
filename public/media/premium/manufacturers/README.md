# Manufacturers

Marque logos for the homepage brand strip and any future brand pages.

**How assets arrive here:** supplied by the party that owns them. Never sourced, never generated.

A manufacturer's logo is its trademark. Reproducing one requires permission from the manufacturer —
through their brand/press portal, a dealer agreement, or a licence. An image pulled from a web search is
not licensed, is usually the wrong file (rasterised, cropped, outdated, or a fan recreation), and is
exactly what "unofficial, distorted or low-quality" means.

---

## Drop a logo in — it appears immediately

Three steps. No redesign, no component change.

**1. Save the file here** as `<slug>.svg`:

```
public/media/premium/manufacturers/bmw.svg
public/media/premium/manufacturers/mercedes-benz.svg
public/media/premium/manufacturers/toyota.svg
```

The slug is the manufacturer name lowercased with non-alphanumerics replaced by hyphens — exactly as it
appears in the `make` column. `Mercedes-Benz` → `mercedes-benz`.

**2. List the slug** in `LICENSED_LOGOS` in `src/services/presentation/marque-identity.service.ts`.

**3. That's it.** That marque renders its logo on the next request; the others keep their current
treatment. A mixed row is expected and correct.

---

## What the strip needs from the file

| | |
| --- | --- |
| Format | SVG preferred. PNG with transparency works; it will not stay crisp on dense displays. |
| Colour | **The manufacturer's official colours, unmodified.** The strip no longer recolours anything. |
| Padding | Trimmed. Built-in whitespace makes a mark look smaller than its neighbours. |
| Aspect | Whatever the manufacturer specifies — preserved, never stretched. |
| Background | Transparent. |

Marks are normalised to a shared optical height by `MarqueMark` using `object-contain`. Presentation is
normalised; the artwork never is.

---

## The slugs currently needed

Marques with live stock, in strip order:

```
bmw  mercedes-benz  audi  volvo  jaguar  toyota
volkswagen  ford  hyundai  kia  nissan  isuzu
```

---

## If a manufacturer will not licence the mark

Some licence a monochrome wordmark instead. That is a better representation than our approximation of
their type, and it is a separate tier: save it as `<slug>-wordmark.svg` and list the slug in
`SUPPLIED_WORDMARKS`.

Where neither is available the marque is set in type matching that manufacturer's own published style —
BMW tight and bold, Mercedes-Benz light and widely spaced. That is fair use of a name rather than a
reproduction of a mark, and it is what the strip shows today.
