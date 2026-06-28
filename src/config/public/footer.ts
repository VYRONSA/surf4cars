/**
 * SURF FOR CARS — Public Footer Navigation
 * Structure only — no content connected.
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
    id: "marketplace",
    title: "Marketplace",
    links: [
      { id: "search", label: "Search Vehicles", href: "/search" },
      { id: "new-arrivals", label: "New Arrivals", href: "/vehicles/new-arrivals" },
      { id: "collections", label: "Collections", href: "/collections" },
      { id: "reviews", label: "Reviews", href: "/reviews" },
    ],
  },
  {
    id: "dealers",
    title: "Dealers",
    links: [
      { id: "featured", label: "Featured Dealers", href: "/dealers/featured" },
      { id: "register", label: "Dealer Registration", href: "/auth/sign-up/dealer" },
      { id: "login", label: "Dealer Login", href: "/auth/sign-in/dealer" },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    links: [
      { id: "guides", label: "Buying Guides", href: "/guides" },
      { id: "news", label: "News", href: "/news" },
      { id: "faq", label: "FAQ", href: "/faq" },
    ],
  },
  {
    id: "company",
    title: "Company",
    links: [
      { id: "about", label: "About", href: "/about" },
      { id: "contact", label: "Contact", href: "/contact" },
      { id: "support", label: "Support", href: "/support" },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    links: [
      { id: "privacy", label: "Privacy Policy", href: "/privacy" },
      { id: "terms", label: "Terms of Service", href: "/terms" },
    ],
  },
] as const;

export const PUBLIC_SOCIAL_LINKS: readonly PublicFooterLink[] = [
  { id: "instagram", label: "Instagram", href: "#" },
  { id: "linkedin", label: "LinkedIn", href: "#" },
  { id: "youtube", label: "YouTube", href: "#" },
  { id: "x", label: "X", href: "#" },
] as const;
