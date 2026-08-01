# 05 — Writing Style Guide

> A specialist who respects your time. Knows more than you. Never condescends. Never oversells.

Words are interface. A premium visual language wrapped around SaaS copy still reads as SaaS.

---

## 1. Voice

**We are:** direct, informed, specific, calm, warm but not familiar.
**We are not:** chirpy, apologetic, salesy, jargon-heavy, or clever at the expense of clarity.

| Principle | Instead of | Write |
| --- | --- | --- |
| Say the thing | "Action required" | "Add 3 more photos to publish" |
| Use their words | "Inventory unit" | "Vehicle" |
| Be specific | "Recently" | "2 hours ago" |
| Own it, briefly | "Oops! Something went wrong" | "We couldn't save that. Try again." |
| Never hedge | "You may want to consider…" | "Reduce this price by R15 000 to match the market." |
| No exclamation marks | "Published!" | "Published." |

**Language:** South African English. *Colour*, *tyre*, *kilometre*, *licence* (noun), *organise*.
**Currency:** `R 449 900` — space separator, no decimals, never abbreviated.
**Dates:** `14 March 2026`. Relative under a week: "2 hours ago", "Yesterday".
**Numbers:** space as thousands separator — `128 400 km`.

**Never use emoji in product UI.** Never use "please" in a button. Never use "just", "simply", or
"easily" — they imply the user is at fault if it is not.

---

## 2. Vocabulary — the substitution table

This is the operative section. **Left column is banned in user-visible text.**

### Dealer platform

| Never say | Say | Why |
| --- | --- | --- |
| Inventory | **My Stock** | What dealers actually call it |
| Listings | **My Stock** / **Vehicles** | |
| Inventory item / unit / SKU | **Vehicle** | It is a car, not a unit |
| Submit | **Publish Vehicle** | Names the outcome |
| Create listing | **Add Vehicle** | |
| Edit listing | **Update Vehicle** | |
| Delist / archive | **Remove from Marketplace** | |
| Processing… | **Preparing your listing…** | Says what is happening |
| Uploading… | **Adding your photos…** | |
| Leads | **Enquiries** | Buyers are people |
| Lead management | **Enquiries** | |
| Contact record | **Buyer** | |
| CRM | **Enquiries** | Never expose internal system names |
| Analytics | **Performance** | |
| Metrics / KPIs | **Performance** | |
| Users | **Team** | |
| Roles & permissions | **Who can do what** | |
| Dealership entity | **Your dealership** | |
| Media library | **Photos** | |
| Configuration | **Settings** | |
| Onboarding | **Getting set up** | |

### Marketplace

| Never say | Say |
| --- | --- |
| Search results | **Vehicles** / "1 284 vehicles" |
| No results found | **Nothing matches yet** |
| Refine search | **Narrow it down** |
| Clear filters | **Start over** |
| Add to favourites | **Save** |
| Favourites | **Saved** |
| Watchlist | **Saved** |
| View details | **View Vehicle** |
| Contact seller | **Message Dealer** / **Call Dealer** |
| Enquire now | **Message Dealer** |
| Book test drive | **Arrange a Viewing** |
| Similar items | **You might also like** |
| Vendor / seller | **Dealer** |
| Price on application | **Contact dealer for price** |

### System & AI

| Never say | Say |
| --- | --- |
| Error / Failure | **We couldn't…** (say what, and what to do) |
| Invalid input | **That doesn't look right** |
| Required field | **Needed to publish** |
| Loading… | **(a skeleton)** or a specific verb |
| Success! | **Published.** / **Saved.** |
| Are you sure? | **Remove this vehicle from the marketplace?** |
| AI / Chatbot / Assistant | **SURF Intelligence** |
| Query | **Ask** |
| Prompt | **Ask** |
| Generating response… | **Looking at 1 284 vehicles…** |
| Confidence score | **How sure we are** |

### Code vs. copy

**URLs, routes, database columns, component names and API fields are unaffected.** `/dealer/inventory`
stays. `InventoryTable` stays. Only the **user-visible label** becomes "My Stock". Renaming routes is
out of scope and would break links, SEO and bookmarks.

---

## 3. Buttons

**Verb + noun. Name the outcome, not the mechanism.** Sentence case. Never a full stop.

| Weak | Strong |
| --- | --- |
| Submit | Publish Vehicle |
| Save | Save Changes |
| OK | Got it |
| Cancel | Cancel *(this one is correct)* |
| Yes / No | Remove Vehicle / Keep It |
| Next | Continue to Photos |
| Learn more | How pricing works |
| Click here | *(never)* |

**Destructive buttons name the destruction:** "Delete Vehicle", never "Confirm". A user must be able
to read only the button and know what will happen.

**Loading buttons keep their label.** "Publishing…" not a spinner replacing the text — and the width
must not change.

---

## 4. Errors

**Structure:** what happened → why (if useful) → what to do next. Never blame. Never expose a stack
trace, error code or table name to a user.

| Bad | Good |
| --- | --- |
| Error 500: Internal Server Error | We couldn't publish this vehicle. Your details are saved — try again in a moment. |
| Invalid input | Mileage looks unusually high. Check the odometer reading. |
| Field required | Add an asking price to publish. |
| Upload failed | That photo is larger than 10 MB. Try a smaller version. |
| Session expired | You've been signed out. Sign in to carry on — nothing was lost. |
| Network error | You're offline. We'll save this when you reconnect. |

**Always reassure about data.** "Your details are saved" is the single most valuable phrase in error
copy. If work was genuinely lost, say so plainly — never imply safety that does not exist.

---

## 5. Empty states

An empty state is an opportunity, never a dead end. **Structure:** what this space is for → why it
is empty → one clear action.

| Surface | Copy |
| --- | --- |
| No stock yet | **Your showroom is empty** / Add your first vehicle and it'll appear on the marketplace within minutes. / `[Add Vehicle]` |
| No enquiries yet | **No enquiries yet** / When a buyer messages you about a vehicle, it'll land here. / `[View My Stock]` |
| No saved vehicles | **Nothing saved yet** / Tap Save on any vehicle to keep it here. / `[Browse Vehicles]` |
| No search results | **Nothing matches yet** / Try widening the price range or removing a filter. / `[Start over]` + the filters that are active |
| No performance data | **Not enough data yet** / Once your vehicles have been live for a week, you'll see how they're performing. |
| Search error | **We couldn't load these vehicles** / Try again — it's usually temporary. / `[Try again]` |

**Never** use an illustration, a mascot, or a sad face. **Never** say "Nothing to see here". A
zero-result search must always show the active filters so the user can see *why* it is empty.

---

## 6. Menus, titles, tooltips

**Navigation:** nouns, not verbs. "My Stock", "Enquiries", "Performance", "Team", "Settings". One or
two words. Never uppercase. Never a colon.

**Page titles:** what the page is, not what it does. "My Stock" not "Manage Your Inventory".

**Section headings:** answer the user's question. "How your stock is performing" beats "Analytics
Overview".

**Tooltips** explain, never repeat. A tooltip on a "Save" button saying "Save" is noise. Good:
"Saved vehicles are private to you." Under ~12 words. **Never put essential information in a tooltip
only** — it is inaccessible on touch.

**Confirmations** state the consequence and its reversibility: "Remove this vehicle from the
marketplace? Buyers won't see it, but you can republish anytime."

---

## 7. Notifications

Lead with the fact. Include the vehicle. Include the elapsed time.

| Bad | Good |
| --- | --- |
| You have a new lead! | **New enquiry — 2019 BMW 320i** / Sarah Mokoena, 4 minutes ago |
| Listing published successfully | **2019 BMW 320i is live** / Now visible to buyers |
| Price alert | **A vehicle you saved dropped R20 000** / 2019 BMW 320i — now R419 900 |

Never more than one line of emphasis. Never an exclamation mark. Never "successfully" — if it
happened, saying so is enough.

---

## 8. AI voice

SURF Intelligence follows all rules above, plus:

1. **State the conclusion first, then the reasoning.** Never make the user read to the answer.
2. **Always cite the data.** "Based on 34 similar vehicles sold in Gauteng in the last 90 days."
3. **Be honest about confidence.** When confidence is low, say less — never pad.
4. **Never use first person plural for opinion.** "The market suggests", not "We think".
5. **Never apologise for being AI.** No "As an AI…", no "I'm just a…".
6. **Never speculate about a specific vehicle's condition.** We have data on prices and markets, not
   on whether this particular car was well maintained.
7. **Volunteer the negative.** "This is priced 8% above market and has been listed 45 days" is
   exactly the specialist voice we want.
