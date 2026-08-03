import { MarketplaceNotFound } from "@/components/shell";

/**
 * A sold vehicle or a retired dealer profile. The public shell — header, Back control, footer —
 * comes from this group's layout, so the boundary supplies only the body.
 */
export default function MarketplaceNotFoundBoundary() {
  return <MarketplaceNotFound />;
}
