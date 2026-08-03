/**
 * SURF4CARS — Founder Demonstration Mode.
 *
 * WHAT THIS IS FOR
 * ================
 * PCP-043 made the homepage show only photographs a person had affirmatively approved, and that is
 * the correct behaviour for a public marketplace: new inventory cannot change the shop window on its
 * own, and nothing reaches the front page by default. It is also, today, an empty homepage — because
 * nothing has been approved yet.
 *
 * That is right for launch and wrong for the Founder Programme, where the platform has to be shown
 * to dealerships fully dressed. This mode is how those two live together.
 *
 * WHAT IT IS NOT
 * ==============
 * It is not a weakening of the review system, and it does not touch it. The review tables, the
 * console, the four states, the integrity flags and the operations workflow are all unchanged and
 * all still enforced — a photograph rejected in the console stays rejected in both modes, because
 * rejection is a statement of fact about the photograph rather than a curation decision.
 *
 * What the mode changes is *one question*: where the set of homepage-approved photographs comes
 * from. In production it is the Founder's approvals. In demonstration it is the curated library that
 * already passes the editorial photography standard — the same set the marketplace rendered before
 * the approval gate existed.
 *
 * That single substitution is deliberate. Both modes run the identical merchandising, deduplication,
 * segmentation and rendering code; there is no second pipeline to drift, and switching modes cannot
 * change how anything is presented, only which photographs are eligible.
 *
 * HOW TO SWITCH
 * =============
 * One environment variable, read at build time because the homepage is statically revalidated:
 *
 *   FOUNDER_DEMO_MODE=true    dealer presentations and onboarding — fully populated
 *   FOUNDER_DEMO_MODE=false   public launch — strict, approval-gated  (this is also the default)
 *
 * Unset behaves as `false`. That default is the important part: a deployment that forgets to
 * configure this gets the strict behaviour, never the permissive one.
 *
 * See `docs/founder-operations-manual.md` §26.
 */

/**
 * Is the platform running as a Founder demonstration?
 *
 * Read through a function rather than a module constant so a test can exercise both modes in one
 * process, and so the value is never captured at import time in a way that hides which mode is live.
 */
export function isFounderDemoMode(): boolean {
  return (process.env.FOUNDER_DEMO_MODE ?? "").trim().toLowerCase() === "true";
}

/**
 * The mode, as a value to render.
 *
 * A demonstration environment must be able to say that it is one. Everything in this codebase that
 * shows a customer something we generated rather than something a dealership supplied is labelled —
 * a demonstration marketplace is the largest instance of that rule, not an exception to it.
 */
export type PlatformMode = "founder-demonstration" | "production";

export const platformMode = (): PlatformMode =>
  isFounderDemoMode() ? "founder-demonstration" : "production";
