export interface HomePillar {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
}

/**
 * Why a buyer should choose Surf4Cars.
 *
 * This replaces the three platform pillars that used to sit here — "AI Marketing", "Dealer Growth",
 * "Better Vehicle Discovery". Every one of them was a reason a *dealership* should buy the software,
 * presented in the middle of a car buyer's evening. That mismatch, not the styling, is why the
 * section read as SaaS: it was addressing the wrong person.
 *
 * Each reason is a promise about the buyer's experience that the platform can actually keep today.
 * Nothing aspirational, and nothing about us.
 */
export const HOME_BUYER_REASONS: readonly HomePillar[] = [
  {
    id: "photography",
    title: "Every car, shown properly",
    tagline: "Full galleries and real photography. No listing hiding behind “more photos on request”.",
  },
  {
    id: "verified",
    title: "Dealers who are verified",
    tagline: "Every dealership is checked before it can publish a single vehicle.",
  },
  {
    id: "context",
    title: "The price, in context",
    tagline: "What comparable cars are actually selling for — before you pick up the phone.",
  },
] as const;

/*
  HOME_DEALER_PILLARS, HOME_AI_DEALER_CARDS, HOME_EDITORIAL_TILES and HOME_DEALER_BENEFITS have gone,
  with the V2 sections that read them. All four were dealer-acquisition copy — "Built for the future
  of automotive", "AI-powered pricing intelligence" — written to be shown to somebody who came to
  look at cars, which is the mismatch that made the homepage read as SaaS. The buyer homepage keeps
  one list, and it is about buying.
*/
