"use server";

/**
 * One-click Founder approval.
 *
 * This does not reimplement promotion — it runs `scripts/media/approve-selection.mjs`, the same
 * command the workflow has always used. That is deliberate. Promotion downloads a master, encodes
 * it, files it in the library, appends to the manifest and regenerates a committed source module;
 * two implementations of that would eventually disagree, and the one that disagreed would be the
 * one that had written to the brand. Clicking Approve and typing the command produce byte-identical
 * results and the same audit trail.
 *
 * The script's own guard is what protects an approved asset: re-approving a decided brief fails
 * unless `--replace` is passed. The dashboard cannot pass it by accident — see `replace` below.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { revalidatePath } from "next/cache";

import { isCreativeReviewAvailable } from "@/features/creative-review/server/review-board";
import type { ApprovalResult } from "@/features/creative-review/types/review.types";

const run = promisify(execFile);

const APPROVE_SCRIPT = "scripts/media/approve-selection.mjs";
const REVIEW_PATH = "/admin/creative/media-review";

/** Fetching and encoding a 2560px master over a slow link is not instant. */
const TIMEOUT_MS = 120_000;

const failure = (briefId: string | null, message: string): ApprovalResult => ({
  status: "error",
  briefId,
  message,
});

/**
 * Promote one candidate to a brand asset.
 *
 * Called from a `<form>`, so every value arrives as a string and none of it is trusted: the brief
 * id and candidate number are validated to the shape the script expects before they are ever passed
 * to it, and arguments go through `execFile` as an array — there is no shell for them to escape.
 */
export async function approveCandidateAction(
  _previous: ApprovalResult,
  formData: FormData,
): Promise<ApprovalResult> {
  if (!isCreativeReviewAvailable()) {
    return failure(null, "Creative review is a local curation tool and is disabled here.");
  }

  const briefId = String(formData.get("briefId") ?? "");
  const candidate = String(formData.get("candidate") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  /**
   * Replacement is a separate decision, not a stronger click. The form that carries it is behind a
   * disclosure with a required checkbox, so `--replace` can only be sent by someone who has said
   * out loud that they are retiring an approved image.
   */
  const replace = formData.get("replace") === "retire-approved";

  if (!/^[a-z0-9-]{1,40}$/.test(briefId)) {
    return failure(null, "That brief id is not one of ours.");
  }

  const candidateNumber = Number(candidate);
  if (!Number.isInteger(candidateNumber) || candidateNumber < 1 || candidateNumber > 20) {
    return failure(briefId, "That candidate is not on the board.");
  }

  const args = [APPROVE_SCRIPT, briefId, String(candidateNumber)];
  if (replace) args.push("--replace");
  if (note) args.push("--note", note.slice(0, 300));

  try {
    const { stdout } = await run(process.execPath, args, {
      cwd: process.cwd(),
      timeout: TIMEOUT_MS,
      windowsHide: true,
    });

    /* The script prints the decision it recorded. Show the Founder that, not a generic success. */
    const recorded = stdout.trim().split("\n").slice(1).join(" · ").replace(/\s+/g, " ").trim();

    revalidatePath(REVIEW_PATH);

    return {
      status: "approved",
      briefId,
      message: recorded || "Approved and filed in the premium library.",
    };
  } catch (error) {
    /**
     * The script writes its refusals to stderr and exits non-zero — most usefully when the brief is
     * already decided. That message is the useful one, so it is surfaced verbatim rather than
     * flattened into "something went wrong".
     */
    const detail =
      typeof error === "object" && error !== null && "stderr" in error
        ? String((error as { stderr?: string }).stderr ?? "").trim()
        : "";

    return failure(briefId, detail || (error instanceof Error ? error.message : "Approval failed."));
  }
}
