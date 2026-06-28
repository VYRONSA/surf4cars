export interface HomePillar {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
}

export const HOME_PILLARS: readonly HomePillar[] = [
  {
    id: "ai-marketing",
    title: "AI Marketing",
    tagline: "Campaigns that write themselves — on brand, on time.",
  },
  {
    id: "dealer-growth",
    title: "Dealer Growth",
    tagline: "One platform for inventory, leads, and momentum.",
  },
  {
    id: "discovery",
    title: "Better Vehicle Discovery",
    tagline: "Search that understands what buyers actually want.",
  },
] as const;

export const HOME_DEALER_PILLARS = [
  {
    id: "presence",
    title: "Premium Presence",
    tagline: "Showcase inventory with the quality your brand deserves.",
  },
  {
    id: "marketing",
    title: "Modern Marketing",
    tagline: "Social, campaigns, and content — without the agency overhead.",
  },
  {
    id: "intelligence",
    title: "Quiet Intelligence",
    tagline: "AI that supports your team — never replaces it.",
  },
] as const;

export const HOME_AI_DEALER_CARDS = [
  {
    id: "marketing",
    title: "Smarter Marketing",
    tagline: "Generate campaigns and social content in seconds.",
  },
  {
    id: "inventory",
    title: "Inventory Intelligence",
    tagline: "Understand pricing, performance, and opportunity.",
  },
  {
    id: "leads",
    title: "Lead Guidance",
    tagline: "Follow up with clarity. Convert with confidence.",
  },
] as const;

export interface HomeEditorialTile {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly variant: "featured" | "standard";
}

export const HOME_EDITORIAL_TILES: readonly HomeEditorialTile[] = [
  {
    id: "guides",
    label: "Buying Guides",
    description: "Expert advice for confident purchases — from finance to final inspection.",
    href: "/guides",
    variant: "featured",
  },
  {
    id: "news",
    label: "Latest News",
    description: "Industry updates, launches, and market insights from across South Africa.",
    href: "/news",
    variant: "standard",
  },
  {
    id: "advice",
    label: "Vehicle Advice",
    description: "Ownership tips, maintenance guidance, and smart buying strategies.",
    href: "/guides",
    variant: "standard",
  },
] as const;

export const HOME_DEALER_BENEFITS = [
  "Grow Your Dealership",
  "Better Marketing",
  "AI Tools",
  "Inventory Management",
  "Lead Growth",
] as const;
