/**
 * The reference a buyer quotes on the telephone.
 *
 * A uuid is unusable for this. "Did you get my enquiry?" — "Which one?" — "cb7f2e91-…" is not a
 * conversation anyone has, and the follow-up call is the moment an enquiry either converts or is
 * lost. So the buyer gets something they can read aloud from a screen, write on a pad, or type into
 * a search box.
 *
 * SHAPE
 * =====
 * `SC-7K4M2Q` — two letters, a dash, six characters. Short enough to say in one breath and long
 * enough that two enquiries on the same day never collide.
 *
 * The alphabet excludes `I`, `O`, `1` and `0`. Those are the four characters people mis-transcribe
 * over a phone line, and a reference that cannot survive being read aloud has failed at the only job
 * it has. 32 symbols across 6 places is roughly a billion combinations, against a marketplace that
 * will produce thousands of enquiries a year — collision is not a practical concern, and the unique
 * index catches it anyway.
 *
 * NOT SEQUENTIAL, DELIBERATELY
 * ============================
 * `SC-000042` would tell every buyer exactly how many enquiries the platform has ever received. On a
 * marketplace launching with modest volume that is a number better not published on a confirmation
 * screen.
 */

/** No I, O, 1 or 0 — the characters that do not survive being read over a telephone. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 6;

export function generateEnquiryReference(): string {
  const bytes = new Uint8Array(LENGTH);
  crypto.getRandomValues(bytes);

  let out = "";
  for (const byte of bytes) {
    out += ALPHABET[byte % ALPHABET.length];
  }
  return `SC-${out}`;
}

/** True for a well-formed reference. Used to validate anything a buyer types back at us. */
export function isEnquiryReference(value: string): boolean {
  return new RegExp(`^SC-[${ALPHABET}]{${LENGTH}}$`).test(value.trim().toUpperCase());
}
