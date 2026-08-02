/**
 * What the platform says when it cannot answer.
 *
 * WHY THE OLD ROADMAP PHRASE WAS REMOVED
 * ======================================
 * The words "Coming" and "Soon" appeared together 174 times across 34 files, and in two different
 * ways — as a badge on a metric, and as the metric's *value*. A table cell that should hold a number
 * held a marketing phrase.
 *
 * Both are wrong, for the same reason and in the same direction as everything PCP-032 removed. That
 * phrase is not a statement about the data; it is a promise about a roadmap. It says the number is on
 * its way, which nobody has committed to, and it says nothing at all about why it is missing. A
 * founder reading a dashboard of it cannot tell which figures are blocked on a partner integration,
 * which are waiting for a paying dealership to exist, and which are simply not built — and those
 * three demand completely different decisions.
 *
 * The replacement states a fact instead. "No data yet" is true, carries no promise, and sits in the
 * same register as "Not provided", which the platform already uses for a contact detail a dealer has
 * not supplied. Every caller pairs it with a `message` naming the actual dependency, because the
 * label alone was never the useful part.
 *
 * ONE OWNER
 * =========
 * The string lives here and nowhere else. Two spellings of an unavailability label is a smaller
 * version of the defect that left 50 dealerships invisible to every consumer comparing against
 * `completed` — and it is the kind of thing that only ever gets fixed once somebody notices two
 * dashboards disagreeing.
 */

/** The value shown where a figure would go, when the figure cannot be computed. */
export const NO_DATA_YET = "No data yet";

/**
 * Whether a signal can be computed at all.
 *
 *   live         the number is real and comes from the database
 *   unavailable  it cannot be computed, and `message` says what is missing
 */
export type SignalAvailability = "live" | "unavailable";

/** The badge label for each state. */
export function availabilityLabel(availability: SignalAvailability): string {
  return availability === "live" ? "Live" : NO_DATA_YET;
}
