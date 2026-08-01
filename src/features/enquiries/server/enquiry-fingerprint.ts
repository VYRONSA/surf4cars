/**
 * What makes two enquiries the same enquiry.
 *
 * Extracted from `dealer-enquiry.service.ts` so the Supabase path can use it without importing the
 * local-store module that path exists to replace. Identical logic, one definition — two spellings of
 * "is this a duplicate" is exactly the drift this codebase has paid for twice.
 *
 * Message is part of the key deliberately. The same buyer asking about the same car twice with
 * *different* questions is two enquiries a dealership should see; asking the same thing twice because
 * the page felt slow is one.
 */
const normalize = (value: string): string => value.trim().toLowerCase();

export interface EnquiryFingerprintInput {
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly buyerEmail: string;
  readonly buyerPhone: string;
  readonly enquiryType: string;
  readonly message: string;
}

export function buildEnquiryFingerprint(input: EnquiryFingerprintInput): string {
  return [
    normalize(input.dealershipId),
    normalize(input.vehicleId),
    normalize(input.buyerEmail),
    normalize(input.buyerPhone),
    normalize(input.enquiryType),
    normalize(input.message),
  ].join("|");
}
