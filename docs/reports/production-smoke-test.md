# Production smoke test — PRP-006 Phase 3

Run this **against the live production URL**, in a real browser, after the first deploy and after
every deploy that changes configuration.

## Why a person runs this

The automated suites — 120 checks — run against localhost. They cannot see DNS, TLS, the production
Supabase project, whether the email sending domain is verified, or whether a Vercel environment
variable was pasted with a trailing space. Every failure that is *specific to production* is
invisible to them by construction, and those are the failures a launch produces.

## How to record a result

Each step has a **pass condition** written so it can only be answered yes or no. If a step is
ambiguous the step is wrong — do not resolve it by guessing.

Use a **private window** throughout unless a step says otherwise. A signed-in session hides exactly
the faults that affect a first-time visitor.

---

## 0. Before you start

| # | Step | Pass condition |
|---|---|---|
| 0.1 | Open `https://<domain>/api/health` | `status` is `healthy`. If `unhealthy`, the offending variable is named in the payload — fix it before continuing; everything below will be misleading |
| 0.2 | Check the certificate padlock | Valid, issued for the production domain, not expired |
| 0.3 | Visit `http://<domain>` (no TLS) | Redirects to `https://` |
| 0.4 | Re-check response headers on the homepage | `content-security-policy`, `x-frame-options: DENY`, `strict-transport-security` all present |

---

## 1. Homepage

| # | Step | Pass condition |
|---|---|---|
| 1.1 | Load the homepage on a cold cache | Renders fully. No layout shift after the hero settles |
| 1.2 | Look at every image | None broken, none a grey box. Photography is the product here |
| 1.3 | Open developer console | No errors, and specifically no CSP violations |
| 1.4 | Check the curated sections | Editorial collections render with vehicles, not empty frames |
| 1.5 | Scroll to the footer | Legal links present: Privacy, Terms, Cookies, Contact |
| 1.6 | Click each footer link | All four resolve. None 404 |
| 1.7 | Load on a phone | Nothing scrolls horizontally. The hero is legible |

## 2. Marketplace / search

| # | Step | Pass condition |
|---|---|---|
| 2.1 | Open `/search` | Results render. Count is plausible against what you expect to be published |
| 2.2 | Apply a filter (body type, then price) | Results change and the URL reflects the filter |
| 2.3 | Reload after filtering | The same results return — the filter is in the URL, not only in memory |
| 2.4 | Apply a filter with no matches | An honest empty state. Not a spinner, not zero results with no explanation |
| 2.5 | Confirm nothing unpublished appears | Spot-check a vehicle you know is draft or archived — it must not be listed |
| 2.6 | Click a vehicle | Navigates to the detail page |

## 3. Vehicle detail

| # | Step | Pass condition |
|---|---|---|
| 3.1 | Load a vehicle page directly by URL | Renders without needing to arrive from search |
| 3.2 | Check the gallery | Images load; navigation between them works |
| 3.3 | Check the specification block | No "undefined", no "null", no placeholder text |
| 3.4 | Check dealer contact details | Either genuine details or an honest "Not provided". **Never a plausible-looking invented website, email or number** — see AGENTS.md |
| 3.5 | Check the price | Formatted in rand, no raw cents |
| 3.6 | View source for structured data | Present and reflects the vehicle actually shown |

## 4. Enquiry — the most important journey on the platform

| # | Step | Pass condition |
|---|---|---|
| 4.1 | Submit an enquiry with your own real details | The form is replaced by a confirmation panel showing a reference in the form `SC-XXXXXX` |
| 4.2 | Read the confirmation wording carefully | If it says **"The dealership has been sent your details"**, an email must actually have gone out. If it says **"we are still working on getting a notification through"**, that is the honest state and is acceptable. It must never claim the first while the second is true |
| 4.3 | Check the dealership's inbox | The email arrives, with vehicle, your name, telephone, email, message, reference and date/time |
| 4.4 | Check it did not land in spam | If it did, the sending domain's SPF/DKIM/DMARC are not right. This is a launch blocker in practice — an enquiry in a junk folder is an enquiry nobody answered |
| 4.5 | Press reply on that email | The reply is addressed to the **buyer**, not to a SURF4CARS no-reply mailbox |
| 4.6 | Click "Open in SURF4CARS" in the email | Reaches the dealer dashboard on the production domain — not localhost |
| 4.7 | Submit the identical enquiry a second time | Reported as a duplicate; the same reference is returned; the dealership receives **one** email, not two |
| 4.8 | Submit eleven enquiries quickly from one connection | The eleventh is refused with a message suggesting you call instead. Not a crash, not a silent failure |
| 4.9 | Turn off networking mid-submission | An honest error, and **your typed details are still in the form** |
| 4.10 | Enquire on a vehicle whose dealership has no email | Confirmation appears and does not claim the dealer was notified. The lead is still recorded |

## 5. Sign in

| # | Step | Pass condition |
|---|---|---|
| 5.1 | Open `/auth/sign-in` | Form renders at a sensible width — not full-bleed |
| 5.2 | Submit a wrong password | A clear error. The email you typed is still there |
| 5.3 | Sign in correctly | Lands on the right destination for the account type |
| 5.4 | While signed out, open `/dealer/dashboard` directly | Redirected to sign in. **Never a 200** |
| 5.5 | Repeat for `/buyer` and `/operations/dashboard` | Redirected |
| 5.6 | Sign out | Session ends; the protected route redirects again |

## 6. Sign up

| # | Step | Pass condition |
|---|---|---|
| 6.1 | Open `/auth/sign-up` and choose buyer | Reaches the buyer form |
| 6.2 | Register with a real address you control | Confirmation email arrives |
| 6.3 | Click the confirmation link | Lands on the production domain and confirms. **A link pointing at localhost means Supabase's redirect URLs were never set** |
| 6.4 | Register a dealership | Onboarding starts and saves progress |
| 6.5 | Leave onboarding halfway and return | Progress is preserved |
| 6.6 | Register with an address already used | An honest message, not a crash |

## 7. Forgot password

| # | Step | Pass condition |
|---|---|---|
| 7.1 | Open `/auth/forgot-password`, submit your address | Confirmation that an email has been sent |
| 7.2 | Check the inbox | Email arrives within a minute |
| 7.3 | Click the reset link | Opens the reset form on the production domain |
| 7.4 | Set a new password | Succeeds, and signs in with the new password |
| 7.5 | Click the same reset link again | Rejected as used or expired — not silently accepted |
| 7.6 | Submit an address with no account | The **same** confirmation message. A different one tells an attacker which addresses are registered |

## 8. Dealer

| # | Step | Pass condition |
|---|---|---|
| 8.1 | Sign in as a dealer, open the dashboard | Renders with real figures for that dealership |
| 8.2 | Find the enquiry from step 4 | It is listed, with the same reference the buyer saw |
| 8.3 | Confirm scoping | You see **only** your own dealership's enquiries and stock |
| 8.4 | Publish a vehicle | Appears in public search within a reload |
| 8.5 | Upload a photograph | Uploads, and appears on the listing |
| 8.6 | Upload a licence disc | Uploads, and is **not** publicly accessible — copy its URL into a private window |
| 8.7 | Unpublish a vehicle | Disappears from public search |

## 9. Founder / operations

| # | Step | Pass condition |
|---|---|---|
| 9.1 | Sign in as founder, open `/operations/dashboard` | Renders |
| 9.2 | Find the Enquiry Notifications card | Present, above Recent Activity |
| 9.3 | Read its figures | Reflect the enquiry from step 4. "Sent" incremented if the email went out |
| 9.4 | If no provider is configured | The card says so in red, and says enquiries are still being recorded |
| 9.5 | Check "Nobody to email" | Non-zero is expected today and names onboarding as the fix |
| 9.6 | Open the Editorial console | Publish a placement, reload the homepage, confirm the change appears — then roll it back |
| 9.7 | Open the Quality Centre | Renders; demonstration records are visible and excluded from the score |

## 10. Scheduled work

| # | Step | Pass condition |
|---|---|---|
| 10.1 | Vercel dashboard → Cron Jobs | The retry job is listed and has run |
| 10.2 | Check its response code | 200, not 401 and not 405. **A 401 means `CRON_SECRET` is unset or mismatched; a 405 means it is pointed at the wrong method** |
| 10.3 | Force a delivery failure, then wait for a sweep | The notification's attempt count increases |
| 10.4 | Confirm it eventually stops | After four attempts the status is `failed` and it stops being retried |

## 11. After the test

| # | Step | Pass condition |
|---|---|---|
| 11.1 | Delete the test enquiries you created | They are real leads in a real dealership's list |
| 11.2 | Delete the test accounts | Same reason |
| 11.3 | Re-check `/api/health` | Still healthy |

---

## What a failure here means

A failure in **section 4** stops the launch. Everything else on this platform exists to produce an
enquiry, and an enquiry that is not recorded, not delivered, or falsely confirmed is the one defect
that costs a dealership money and a buyer their trust on the same day.

A failure in **6.3 or 7.3** — a confirmation link pointing at localhost — stops the launch too, and is
the single most likely production-only fault on this list, because it is configured in Supabase
rather than in this repository and no local test can see it.
