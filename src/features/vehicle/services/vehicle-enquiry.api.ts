/**
 * Submitting an enquiry from the vehicle page.
 *
 * Returns the reference rather than `void`. The buyer needs something to quote when they ring the
 * dealership, and a function that discards it forces the caller to invent a confirmation message
 * that says less than the server already knows.
 */

export interface EnquirySubmission {
  readonly reference: string;
  /** True when this exact enquiry was already on record. Still a success from the buyer's side. */
  readonly duplicate: boolean;
}

export class EnquirySubmissionError extends Error {
  /** True when the request was fine and our side failed — retrying unchanged may well work. */
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "EnquirySubmissionError";
    this.retryable = retryable;
  }
}

export async function submitVehicleEnquiry(payload: {
  readonly vehicleId: string;
  readonly dealershipId: string;
  readonly buyerName: string;
  readonly buyerEmail: string;
  readonly buyerPhone: string;
  readonly message: string;
  readonly enquiryType: "contact" | "test-drive" | "finance";
}): Promise<EnquirySubmission> {
  let response: Response;

  try {
    response = await fetch("/api/v1/marketplace/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* The request never left. Retryable by definition — and worth saying so, because "check your
       connection" is actionable where "failed to submit" is not. */
    throw new EnquirySubmissionError(
      "We could not reach SURF4CARS. Check your connection and try again.",
      true,
    );
  }

  const body = (await response.json().catch(() => null)) as
    | { error?: string; retryable?: boolean; reference?: string; duplicate?: boolean }
    | null;

  if (!response.ok) {
    throw new EnquirySubmissionError(
      body?.error ?? "We could not send your enquiry.",
      body?.retryable ?? response.status >= 500,
    );
  }

  return { reference: body?.reference ?? "—", duplicate: body?.duplicate ?? false };
}
