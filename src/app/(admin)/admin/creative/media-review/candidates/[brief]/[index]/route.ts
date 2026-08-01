/**
 * Streams a candidate preview to the review board.
 *
 * Candidates deliberately live outside `public/`: an unreviewed frame is not a brand asset and must
 * not be reachable from the marketplace, or by URL guessing, or by a crawler. This handler is the
 * only way to see one, it only exists outside production, and it will only serve a file that a
 * candidate board actually names — see `resolveCandidatePreviewPath`, which refuses anything that is
 * not a plain brief id, a small integer, and a bare filename recorded on that brief's board.
 */
import { readFile } from "node:fs/promises";

import { isCreativeReviewAvailable, resolveCandidatePreviewPath } from "@/features/creative-review";

export async function GET(
  _request: Request,
  context: RouteContext<"/admin/creative/media-review/candidates/[brief]/[index]">,
) {
  if (!isCreativeReviewAvailable()) {
    return new Response("Not found", { status: 404 });
  }

  const { brief, index } = await context.params;
  const path = resolveCandidatePreviewPath(brief, Number(index));

  if (!path) {
    return new Response("Not found", { status: 404 });
  }

  const file = await readFile(path);
  const type = path.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": type,
      /* A shortlist is rewritten in place, so a cached preview would show the Founder a frame that
         is no longer on the board. Correctness beats a warm cache on a page nobody loads at scale. */
      "Cache-Control": "no-store",
      "Content-Disposition": "inline",
    },
  });
}
