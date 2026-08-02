/**
 * Everything the Founding Dealer page claims, in one file.
 *
 * WHY THE COPY IS CONFIGURATION AND NOT JSX
 * =========================================
 * This is the only page on the platform that makes commitments to a business — free until a named
 * date, a capped number of places, a list of what a partner receives. A commitment buried in markup
 * is one nobody can audit, and the one page where an unreviewable claim does real damage is the one
 * a dealer principal reads before signing.
 *
 * Held here, the whole set can be read in a minute and changed without touching a component.
 *
 * THE RULES THIS FILE ENFORCES
 * ============================
 * The brief is explicit, and every one of these is the kind of thing marketing pages do by reflex:
 *
 *   no lifetime discounts          — the programme is free until a date, and then it is not
 *   no fake urgency                — no countdown, no "only 3 places left", no expiring banner
 *   no fabricated statistics       — there are no platform numbers on this page, because there are
 *                                    no honest ones yet: 4 of 269 accounts have ever signed in
 *   no market leadership claims    — SURF4CARS has not led anything yet
 *   future functionality is labelled future, every time
 *
 * The dashboard figures in `ILLUSTRATIVE_DASHBOARD` are the sharpest edge here. They are shaped like
 * real analytics and they are invented, so they carry a label in the component that renders them and
 * a comment on the constant itself. A plausible fabricated number is the exact failure AGENTS.md is
 * about — `4200000273` looks precisely like a VAT number, and nobody checks.
 */

/** The date the programme's free period ends. Stated everywhere as a date, never as "forever". */
export const FOUNDING_PROGRAMME_FREE_UNTIL = "31 July 2027";

/** The cap. A policy the founder sets, not a measurement of demand. */
export const FOUNDING_PROGRAMME_PLACES = 100;

export interface ProgrammeBenefit {
  readonly title: string;
  readonly detail: string;
}

export const FOUNDING_BENEFITS: readonly ProgrammeBenefit[] = [
  {
    title: "Founder Badge",
    detail:
      "A permanent mark on your dealership profile recording that you were one of the first. It does not expire when the programme does.",
  },
  {
    title: "Free onboarding",
    detail:
      "We set your dealership up with you rather than sending you a guide — profile, branches, team and your first listings.",
  },
  {
    title: "Free migration",
    detail:
      "Your stock comes across from a spreadsheet or an export from another site. You see exactly what will happen before anything is added, and nothing is ever overwritten without your say-so.",
  },
  {
    title: "Personal onboarding",
    detail: "A named person at SURF4CARS who knows your dealership, not a ticket queue.",
  },
  {
    title: "Priority support",
    detail: "Founding Partners are answered first, for as long as the programme runs.",
  },
  {
    title: "Early access to AI features",
    detail:
      "New listing and photography tools reach Founding Partners before anyone else, while they are still being shaped.",
  },
  {
    title: "Direct influence on the roadmap",
    detail:
      "What you tell us changes what we build next. This is the reason the programme exists, not a courtesy.",
  },
  {
    title: "Professional features during the programme",
    detail:
      "Full access to the Professional tier's capabilities for the duration, at no cost.",
  },
  {
    title: "Founder Roundtables",
    detail:
      "Small sessions with the people building the platform and the other founding dealerships.",
  },
  {
    title: `Limited to ${FOUNDING_PROGRAMME_PLACES} dealerships`,
    detail:
      "The number is a limit on us, not a sales tactic. Personal onboarding for more than that would stop being personal.",
  },
];

/** Why a dealership should join before the marketplace is public. Stated as trade-offs, not benefits. */
export const WHY_JOIN_EARLY: readonly ProgrammeBenefit[] = [
  {
    title: "You are early, and that cuts both ways",
    detail:
      "A marketplace before public launch has fewer buyers than one after it. What you get in exchange is a platform that is still being shaped, and a say in the shape.",
  },
  {
    title: "Your stock is in place on day one",
    detail:
      "Listings take time to photograph, describe and correct. Dealerships that arrive after launch start that work with buyers already browsing.",
  },
  {
    title: "The programme ends, the badge does not",
    detail:
      "Founding Partners are recorded permanently as founding partners. That is the part that does not have an end date.",
  },
];

/** Why SURF4CARS is running the programme. Written to be read by somebody sceptical. */
export const WHY_WE_ARE_DOING_THIS: readonly ProgrammeBenefit[] = [
  {
    title: "We need real stock before we invite buyers",
    detail:
      "A marketplace with thin inventory disappoints its first visitors, and first visitors do not come twice. Building supply before demand is the honest order to do this in.",
  },
  {
    title: "We need dealership feedback, not our own assumptions",
    detail:
      "Everything we believe about how a dealership runs its stock is a guess until a dealership tells us otherwise.",
  },
  {
    title: "We would rather be corrected now than after launch",
    detail:
      "Changing a marketplace with a hundred dealerships on it is straightforward. Changing one with a thousand is not.",
  },
  {
    title: "Founding partners shape what this becomes",
    detail:
      "The roadmap is not finished. That is the offer: influence over a platform while influence is still cheap.",
  },
];

/**
 * The tiers that will exist after the programme.
 *
 * NO PRICES, AND THAT IS THE POINT
 * ================================
 * The brief says to read future pricing from configuration if constants exist and otherwise show
 * none. No pricing constants exist anywhere in this repository, because no pricing has been decided.
 *
 * So the page shows the shape of the range and says plainly that the numbers are not set. Inventing
 * a plausible "R 1 499 / month" to fill the space would be a commitment nobody has made, printed on
 * the one page a dealer principal reads before signing — and it would be believed precisely because
 * it looks like every other pricing page they have seen.
 */
export interface FuturePackage {
  readonly name: string;
  readonly intent: string;
}

export const FUTURE_PACKAGES: readonly FuturePackage[] = [
  { name: "Starter", intent: "Independent dealerships with a small, changing forecourt." },
  { name: "Professional", intent: "Established dealerships running a full marketing operation." },
  { name: "Premium", intent: "Multi-branch groups that need presentation and analytics at depth." },
  { name: "Enterprise", intent: "Franchise groups and networks with their own systems to connect." },
];

/**
 * Advertising products that do not exist yet.
 *
 * Every one is labelled as available after public launch, in the constant and again in the
 * component. The failure mode this guards against is a dealership reading this section as an
 * itemisation of what they can buy today and asking to buy it.
 */
export const FUTURE_ADVERTISING: readonly ProgrammeBenefit[] = [
  { title: "Dealer Spotlight", detail: "A dealership presented in full on the homepage." },
  { title: "Homepage Campaigns", detail: "A campaign of your vehicles in the marketplace's own editorial slots." },
  { title: "Featured Collections", detail: "A curated collection built around your stock." },
  { title: "Search Promotion", detail: "Priority presentation within relevant search results." },
  { title: "Seasonal Campaigns", detail: "Placement in the marketplace's seasonal editorial." },
  { title: "Newsletter Sponsorship", detail: "Presence in the buyer newsletter." },
];

/**
 * Figures for the dashboard illustration. **Invented, and labelled as such wherever they appear.**
 *
 * They exist because a dealership needs to see what the platform will report back to them, and an
 * empty dashboard communicates nothing. They are deliberately unremarkable — no figure here is
 * impressive, because an impressive invented number is a promise about results.
 */
export const ILLUSTRATIVE_DASHBOARD: readonly { readonly label: string; readonly value: string }[] = [
  { label: "Vehicle views", value: "1 240" },
  { label: "Phone clicks", value: "86" },
  { label: "WhatsApp clicks", value: "112" },
  { label: "Enquiries", value: "34" },
  { label: "Finance requests", value: "9" },
  { label: "Trade-in requests", value: "7" },
  { label: "Test drive requests", value: "12" },
];

/** Business outcomes, not software features. */
export const WHY_DEALERSHIPS_MOVE: readonly ProgrammeBenefit[] = [
  {
    title: "Presentation that matches the car",
    detail:
      "A R2 million vehicle photographed and described like a R200 000 one costs you the difference. Listings are held to a photography and completeness standard, and the platform tells you which of yours fall short.",
  },
  {
    title: "Listings that finish themselves",
    detail:
      "Descriptions, specifications and equipment assembled from what you already hold, so a listing goes live complete rather than being finished next Tuesday.",
  },
  {
    title: "You can see what actually happened",
    detail:
      "Views, calls, WhatsApp taps and enquiries per vehicle — so the question 'why has this one not sold' has an answer.",
  },
  {
    title: "Enquiries that reach a person",
    detail:
      "Every enquiry is recorded, attributed to a vehicle, and retried if delivery fails. Nothing depends on somebody watching an inbox.",
  },
  {
    title: "Your stock, moved for you",
    detail:
      "Bulk import from a spreadsheet or another platform, with every row and every problem shown before anything is written.",
  },
  {
    title: "Your dealership, not a directory entry",
    detail:
      "A dealership page with your branding, your branches and your team — not a logo in a list.",
  },
];

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

export const FOUNDING_FAQ: readonly FaqEntry[] = [
  {
    question: "Who qualifies?",
    answer:
      "Licensed South African dealerships selling used or new vehicles, with stock they can list. We check the business before approving a place — partly for buyers, partly because personal onboarding only works if we know who we are onboarding.",
  },
  {
    question: `How many dealerships are you taking?`,
    answer: `${FOUNDING_PROGRAMME_PLACES}. The limit exists because personal onboarding and roundtables stop working beyond it. We will say so plainly when places are gone rather than running a counter.`,
  },
  {
    question: "Can I leave at any time?",
    answer:
      "Yes, at any point and without a notice period. Your listings and your data are yours; we will export them for you. A programme people stay in because leaving is difficult is not the feedback we are after.",
  },
  {
    question: "What happens when the programme ends?",
    answer: `The free period runs until ${FOUNDING_PROGRAMME_FREE_UNTIL}, after which standard subscription pricing applies. Pricing will be announced before the programme concludes, so no dealership is asked to decide without knowing the number. There is no lifetime discount, and we would rather say that now than imply otherwise.`,
  },
  {
    question: "How long does onboarding take?",
    answer:
      "Most of it is your stock and your photography rather than the platform. A dealership arriving with a clean export and usable images is usually live the same week; one that needs photography takes as long as the photography takes.",
  },
  {
    question: "How are my vehicles imported?",
    answer:
      "From a spreadsheet, or an export from the site you use now. The importer reads your columns, tells you what it understood, and shows you every vehicle and every problem before a single listing is created. Anything already on your forecourt is left alone unless you say otherwise, and the whole import can be undone until you publish it.",
  },
  {
    question: "Will you train my team?",
    answer:
      "Yes, as part of onboarding, and for the people who will actually use it rather than only the principal.",
  },
];
