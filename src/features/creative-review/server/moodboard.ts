/**
 * The brand, on one screen.
 *
 * The review dashboard answers "is this the best of the five?". It cannot answer "do these eight
 * photographs belong to the same company?", and that is a different question with a different failure
 * mode: every slot can be individually well chosen and the set can still look like a stock library.
 * Creative teams review the collection, not the candidate, and this is that view.
 *
 * Two decisions make it honest.
 *
 * It shows what the runtime actually renders, resolved through `PREMIUM_IMAGES` — not what has been
 * approved. A slot still showing its stand-in is exactly what the Founder needs to see, and labelling
 * it as inherited is the whole point. A moodboard of only the approved assets would flatter the brand
 * by hiding the parts of it nobody has chosen yet.
 *
 * And it reads palettes from the manifest rather than measuring images here. Colour is extracted once,
 * at approval, from the master — see scripts/media/approve-selection.mjs. Nothing in the application
 * decodes an image.
 */
import { PREMIUM_IMAGES } from "@/config/images/premium-images";
import { getPremiumMedia, type PaletteEntry } from "@/config/media";

/** How a slot's current photograph got there. */
export type SlotProvenance =
  /** A Founder-approved photograph from the premium library. */
  | "approved"
  /** A real image standing in until the brief is reviewed. Honest, but nobody chose it. */
  | "inherited"
  /** No approval and no stand-in worth showing. */
  | "empty";

export interface MoodboardSlot {
  /** Review brief id — the anchor to jump to on the review dashboard. */
  readonly mediaId: string;
  readonly label: string;
  /** What this photograph has to do in the product. */
  readonly role: string;
  readonly src: string | null;
  /** The ratio the slot is used at, so the moodboard shows the real crop. */
  readonly aspect: number;
  readonly provenance: SlotProvenance;
  /** Relative weight on the board. The hero is not one tile among equals. */
  readonly emphasis: "lead" | "wide" | "standard";
  readonly title: string | null;
  readonly author: string | null;
  readonly licence: string | null;
  readonly requiresAttribution: boolean;
  readonly approvedOn: string | null;
  readonly palette: readonly PaletteEntry[];
}

export interface MoodboardGroup {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  readonly slots: readonly MoodboardSlot[];
}

export interface Moodboard {
  readonly groups: readonly MoodboardGroup[];
  readonly approved: number;
  readonly inherited: number;
  readonly empty: number;
  /** Dominant colours across every approved photograph, heaviest first. */
  readonly palette: readonly PaletteEntry[];
  readonly attributions: number;
}

interface SlotSpec {
  readonly mediaId: string;
  readonly label: string;
  readonly role: string;
  readonly src: string | null;
  readonly aspect: number;
  readonly emphasis?: MoodboardSlot["emphasis"];
}

/**
 * The board's composition.
 *
 * Ordered the way the brand is met rather than the way the library is filed: the hero first, then the
 * categories a buyer chooses between, then the surfaces that carry a dealership, then the identity set
 * that says which country this is. Aspect ratios match the briefs, so a banner is judged as a banner.
 */
const GROUPS: readonly { id: string; label: string; note: string; slots: readonly SlotSpec[] }[] = [
  {
    id: "first-impression",
    label: "First impression",
    note: "The frame that sets everything after it. If the rest of the board does not feel related to this, the rest of the board is wrong.",
    slots: [
      {
        mediaId: "hero",
        label: "Homepage hero",
        role: "The first photograph anyone sees",
        src: PREMIUM_IMAGES.hero.homepage,
        aspect: 1.85,
        emphasis: "lead",
      },
    ],
  },
  {
    id: "categories",
    label: "Categories",
    note: "Seven front doors, seen together. Judge consistency of light and distance before judging any single tile — one daylight forecourt among six evening frames is the thing that breaks a band.",
    slots: [
      { mediaId: "suv", label: "SUVs", role: "Adventure", src: PREMIUM_IMAGES.categories.suv, aspect: 1.5 },
      { mediaId: "bakkie", label: "Bakkies", role: "Utility and escape", src: PREMIUM_IMAGES.categories.bakkie, aspect: 1.5 },
      { mediaId: "hatchback", label: "Hatchbacks", role: "City life", src: PREMIUM_IMAGES.categories.hatchback, aspect: 1.5 },
      { mediaId: "sedan", label: "Sedans", role: "Composure", src: PREMIUM_IMAGES.categories.sedan, aspect: 1.5 },
      { mediaId: "luxury", label: "Luxury", role: "Quiet money", src: PREMIUM_IMAGES.categories.luxury, aspect: 1.5 },
      { mediaId: "performance", label: "Performance", role: "Track and motion", src: PREMIUM_IMAGES.categories.performance, aspect: 1.5 },
      { mediaId: "ev", label: "Electric", role: "The quiet future", src: PREMIUM_IMAGES.categories.ev, aspect: 1.5 },
      { mediaId: "mpv", label: "People carriers", role: "Calm competence", src: PREMIUM_IMAGES.categories.mpv, aspect: 1.5 },
    ],
  },
  {
    id: "dealers",
    label: "Dealers",
    note: "What a dealership wears. These two sit next to each other on a profile page, so they have to look like the same building on the same afternoon.",
    slots: [
      {
        mediaId: "dealer-cover",
        label: "Dealership exterior",
        role: "Profile cover",
        src: PREMIUM_IMAGES.dealers.profile,
        aspect: 2.4,
        emphasis: "wide",
      },
      {
        mediaId: "showroom",
        label: "Showroom interior",
        role: "Inside the building",
        src: PREMIUM_IMAGES.identity.showroom,
        aspect: 1.85,
      },
    ],
  },
  {
    id: "identity",
    label: "Identity",
    note: "Where Surf4Cars is, and who it is for. This is the group that decides whether the product reads as South African or as anywhere.",
    slots: [
      { mediaId: "cape-town", label: "Cape Town", role: "Place", src: PREMIUM_IMAGES.identity.capeTown, aspect: 1.85 },
      { mediaId: "lifestyle", label: "Lifestyle", role: "People", src: PREMIUM_IMAGES.identity.lifestyle, aspect: 1.6 },
    ],
  },
  {
    id: "editorial",
    label: "Editorial and promotion",
    note: "Plates that carry type. Judge the quiet area, not the subject — a beautiful frame with its subject dead centre is the wrong frame here.",
    slots: [
      {
        mediaId: "editorial-buyers",
        label: "Why buyers choose Surf4Cars",
        role: "Homepage editorial plate",
        src: PREMIUM_IMAGES.sections.whyBuyers,
        aspect: 2.1,
        emphasis: "wide",
      },
      {
        mediaId: "promo-banner",
        label: "Promotion banner",
        role: "Banner plate, type composed over",
        src: PREMIUM_IMAGES.promotions.banner,
        aspect: 3,
        emphasis: "wide",
      },
    ],
  },
];

function toSlot(spec: SlotSpec): MoodboardSlot {
  const asset = getPremiumMedia(spec.mediaId);
  /* `kind === "photograph"` rather than mere presence: a treatment is an approved decision but not an
     image, and showing one on a photographic board would be a category error. */
  const isApproved = asset?.kind === "photograph" && Boolean(asset.src);

  return {
    mediaId: spec.mediaId,
    label: spec.label,
    role: spec.role,
    src: spec.src,
    aspect: spec.aspect,
    provenance: isApproved ? "approved" : spec.src ? "inherited" : "empty",
    emphasis: spec.emphasis ?? "standard",
    title: isApproved ? asset.title : null,
    author: isApproved ? asset.author : null,
    licence: isApproved ? asset.licence : null,
    requiresAttribution: isApproved ? asset.requiresAttribution : false,
    approvedOn: isApproved ? asset.approvedOn : null,
    palette: isApproved ? (asset.palette ?? []) : [],
  };
}

/**
 * Merge the approved set's colours into one reading.
 *
 * Shares are summed per quantised colour and renormalised, so a frame that is 70% night sky counts for
 * more than one that is 12% red paint. That is the correct weighting for the question being asked: a
 * brand's colour is what covers the most area across everything it shows, not its most memorable
 * accent.
 */
function mergePalettes(slots: readonly MoodboardSlot[]): readonly PaletteEntry[] {
  const totals = new Map<string, number>();

  for (const slot of slots) {
    for (const entry of slot.palette) {
      /* Group to a coarser key than the extractor used, so two nearly identical blues from two
         photographs read as one brand colour rather than two. */
      const key = entry.hex
        .slice(1)
        .match(/.{2}/g)!
        .map((channel) => Math.round(parseInt(channel, 16) / 32) * 32)
        .map((channel) => Math.min(255, channel).toString(16).padStart(2, "0"))
        .join("");
      totals.set(`#${key}`, (totals.get(`#${key}`) ?? 0) + entry.share);
    }
  }

  const sum = [...totals.values()].reduce((total, share) => total + share, 0);
  if (sum === 0) return [];

  return [...totals.entries()]
    .map(([hex, share]) => ({ hex, share: Math.round((share / sum) * 100) }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 8);
}

export function readMoodboard(): Moodboard {
  const groups: MoodboardGroup[] = GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    note: group.note,
    slots: group.slots.map(toSlot),
  }));

  const slots = groups.flatMap((group) => group.slots);

  return {
    groups,
    approved: slots.filter((slot) => slot.provenance === "approved").length,
    inherited: slots.filter((slot) => slot.provenance === "inherited").length,
    empty: slots.filter((slot) => slot.provenance === "empty").length,
    palette: mergePalettes(slots),
    attributions: slots.filter((slot) => slot.requiresAttribution).length,
  };
}
