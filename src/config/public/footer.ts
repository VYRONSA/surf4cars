/**
 * The public footer's links.
 *
 * WHAT WAS HERE
 * =============
 * Five columns, and its own docstring admitted what they were: "Structure only — no content
 * connected." The consequences were all customer-visible:
 *
 *   three names, one page   "Search Vehicles", "Latest Marketplace" and "Premium Search" all pointed
 *                           at `/search`. A visitor clicking the second expecting something new gets
 *                           the first page again, and learns the footer is decoration.
 *   dead ends               "Inventory Intelligence", "Market Intelligence" and "Buyer Intelligence"
 *                           link into `/dealer/*` and `/buyer/*`, which are gated. A signed-out
 *                           visitor is bounced to a sign-in screen by a link that never said so.
 *   internal names          Those three are product codenames. A customer has never heard them.
 *   an empty column         "Legal" held one link, "Platform Home", which is neither legal nor
 *                           anything other than the homepage.
 *
 * WHAT REPLACED IT
 * ================
 * Only destinations that exist, are reachable signed-out, and are distinct from one another. That
 * comes to two columns, and two honest columns are worth more than five padded ones — a footer's job
 * is to answer "where else can I go", and inventing entries to fill a grid answers it wrongly.
 *
 * The sections a real marketplace needs — terms, privacy, contact, about — are absent because the
 * pages are absent. They belong here the day they exist, and not before.
 */

export interface PublicFooterLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export interface PublicFooterSection {
  readonly id: string;
  readonly title: string;
  readonly links: readonly PublicFooterLink[];
}

export const PUBLIC_FOOTER_SECTIONS: readonly PublicFooterSection[] = [
  {
    id: "browse",
    title: "Browse",
    links: [
      { id: "search", label: "Every vehicle", href: "/search" },
      { id: "suvs", label: "SUVs", href: "/search?bodyType=SUV" },
      { id: "double-cabs", label: "Double cabs", href: "/search?bodyType=Double%20Cab" },
      { id: "under-300k", label: "Under R300 000", href: "/search?priceMax=30000000" },
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    links: [
      { id: "dealer-register", label: "List your stock", href: "/auth/sign-up/dealer" },
      { id: "buyer-register", label: "Create an account", href: "/auth/sign-up/buyer" },
      { id: "sign-in", label: "Sign in", href: "/auth/sign-in" },
    ],
  },
] as const;

/**
 * Social accounts.
 *
 * Every one of these resolves to `#`. They are kept because the brand will have accounts and the
 * footer is shaped for them, and they render as plain text rather than as links until they point
 * somewhere — see `PublicFooter`. A link that goes nowhere is the same broken promise as a disabled
 * button, and this codebase has spent four programmes removing those.
 */
export const PUBLIC_SOCIAL_LINKS: readonly PublicFooterLink[] = [
  { id: "instagram", label: "Instagram", href: "#" },
  { id: "linkedin", label: "LinkedIn", href: "#" },
  { id: "youtube", label: "YouTube", href: "#" },
  { id: "x", label: "X", href: "#" },
] as const;
