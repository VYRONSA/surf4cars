# Brand naming audit — Phase 10

**Reported, not changed.** Which name is canonical is a founder decision, and it touches trademarks,
the domain, and every legal line on the platform. This records where each form appears so the
decision can be made once and applied cleanly.

## The two identities

| Form | Occurrences | Files | Where it appears |
|---|---|---|---|
| `SURF4CARS` | 55 | 37 | The **wordmark** — the logotype at the top of every page. Body copy on auth pages, the vehicle page's enquiry note, quality-engine findings. |
| `SURF FOR CARS` | 73 | 61 | `APP_NAME`. Every **browser tab**, every **page title**, the **copyright line**, the Open Graph `siteName` used on shared links. |
| `Surf4Cars` | 5 | 3 | Prose in comments and documentation. |
| `surf4cars` | 38 | 16 | The **domain** — `surf4cars.co.za` — and demonstration contact values. |

## Why it matters

The conflict is visible to a customer without them looking for it. On any page:

- the logotype reads **SURF4CARS**
- the browser tab reads **… | SURF FOR CARS**
- the footer reads **© 2026 SURF FOR CARS**
- the URL reads **surf4cars.co.za**

Three of the four say one thing and the most prominent one says another. Sharing a vehicle link
posts a card whose `siteName` is "SURF FOR CARS" from a site whose masthead says SURF4CARS.

## The customer-facing occurrences that would change

Twenty-five on public surfaces. The ones that matter most, in order of exposure:

| Location | Current | Seen by |
|---|---|---|
| `src/constants/app.constants.ts` — `APP_NAME` | SURF FOR CARS | Every tab, every title, every share card. One constant drives most of the rest. |
| `src/app/(public)/page.tsx` — homepage title | SURF FOR CARS — Premium Automotive Discovery | Google's result for the homepage |
| `src/components/public/footer/public-footer.tsx` — copyright | SURF FOR CARS | Every page |
| `src/app/(marketplace)/vehicle/[slug]/page.tsx` — `siteName` | SURF FOR CARS | Every shared vehicle link |
| `src/features/vehicle/components/vehicle-detail-save-share.tsx` | SURF FOR CARS | The share sheet on a phone |
| `src/features/authentication/**` | SURF4CARS | Sign-in and account copy |
| `src/features/vehicle/components/vehicle-detail-enquiry.tsx` | SURF4CARS | The enquiry privacy line |

## Recommendation

**`SURF4CARS`**, and change `APP_NAME` rather than the wordmark.

Three reasons. It is what the logotype already says, and the logotype is the most expensive thing to
change and the most seen. It matches the domain, so the address bar and the masthead agree. And it is
one word — "SURF FOR CARS" reads as a description of the category, where "SURF4CARS" reads as a name.

The change is close to a single-constant edit: `APP_NAME` drives the title template, the copyright and
the Open Graph `siteName`. The handful of hardcoded strings listed above would follow.

One caveat worth checking before committing: screen readers pronounce the numeral. `SurfWordmark`
already handles this with a visually-hidden `SURF4CARS` and the digits hidden from the accessibility
tree — if `APP_NAME` becomes the canonical form, the same care is needed wherever it is read aloud.

## Also worth a decision

`src/app/(auth)/auth/sign-up/dealer/page.tsx` describes the platform as **"the world's most advanced
dealership platform"**. That is a superlative the platform cannot prove, on a page asking a real
business to register — and it is the only claim of its kind left on a customer-facing surface. It
fails Rule 6 (every statement must be verified, calculated, dealer-supplied, editorial, illustrative
or unknown). Recommend replacing it with something checkable, but the wording is yours.
