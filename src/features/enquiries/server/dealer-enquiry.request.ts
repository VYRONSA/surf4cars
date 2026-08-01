import type {
  CreateDealerEnquiryInput,
  DealerEnquiryAction,
  EnquiryStatus,
  EnquiryType,
} from "@/features/enquiries/server/dealer-enquiry.service";

const VALID_ENQUIRY_TYPES: readonly EnquiryType[] = ["contact", "test-drive", "finance"];
const VALID_STATUSES: readonly EnquiryStatus[] = [
  "new",
  "assigned",
  "responded",
  "follow-up",
  "test-drive-scheduled",
  "finance-in-progress",
  "closed-won",
  "closed-lost",
];

export function parseDealershipIdFromUrl(url: URL): string {
  const dealershipId = url.searchParams.get("dealershipId")?.trim();
  if (!dealershipId) {
    throw new Error("dealershipId is required.");
  }
  return dealershipId;
}

export function parseBuyerIdFromUrl(url: URL): string {
  const buyerId = url.searchParams.get("buyerId")?.trim();
  if (!buyerId) {
    throw new Error("buyerId is required.");
  }
  return buyerId;
}

export function parseEnquiryIdFromUrl(url: URL): string | undefined {
  const enquiryId = url.searchParams.get("enquiryId")?.trim();
  return enquiryId && enquiryId.length > 0 ? enquiryId : undefined;
}

export function parseEnquiryStatusFromUrl(url: URL): EnquiryStatus | undefined {
  const status = url.searchParams.get("status")?.trim();
  if (!status) return undefined;
  if (!VALID_STATUSES.includes(status as EnquiryStatus)) {
    throw new Error("Invalid enquiry status.");
  }
  return status as EnquiryStatus;
}

// Deliberately permissive: enough to reject values that cannot be a contactable address, without
// rejecting valid but unusual real-world addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// South African numbers reach dealers as +27… or 0…; accept common international shapes but
// require enough digits to be dialable.
const PHONE_DIGIT_PATTERN = /^\+?[\d\s().-]{9,20}$/;

export async function parseCreateDealerEnquiryRequest(request: Request): Promise<CreateDealerEnquiryInput> {
  const body = (await request.json()) as Partial<CreateDealerEnquiryInput>;

  if (!body.dealershipId?.trim()) throw new Error("dealershipId is required.");
  if (!body.vehicleId?.trim()) throw new Error("vehicleId is required.");
  if (!body.buyerName?.trim()) throw new Error("buyerName is required.");
  if (!body.buyerEmail?.trim()) throw new Error("buyerEmail is required.");
  if (!body.buyerPhone?.trim()) throw new Error("buyerPhone is required.");

  // The dealer's only reply channels are the email address and phone number captured here, so an
  // unusable value makes the lead worthless the moment it lands in the dealer's queue.
  if (!EMAIL_PATTERN.test(body.buyerEmail.trim())) {
    throw new Error("A valid email address is required.");
  }
  if (!PHONE_DIGIT_PATTERN.test(body.buyerPhone.trim()) || (body.buyerPhone.match(/\d/g) ?? []).length < 9) {
    throw new Error("A valid contact number is required.");
  }

  const enquiryType = body.enquiryType?.trim() as EnquiryType | undefined;
  if (enquiryType && !VALID_ENQUIRY_TYPES.includes(enquiryType)) {
    throw new Error("Invalid enquiry type.");
  }

  return {
    dealershipId: body.dealershipId,
    vehicleId: body.vehicleId,
    buyerId: body.buyerId?.trim() || null,
    buyerName: body.buyerName,
    buyerEmail: body.buyerEmail,
    buyerPhone: body.buyerPhone,
    message: body.message?.trim() || "Interested in this vehicle.",
    enquiryType: enquiryType ?? "contact",
  };
}

export async function parseDealerEnquiryActionRequest(request: Request): Promise<DealerEnquiryAction> {
  const body = (await request.json()) as Record<string, unknown>;
  const type = typeof body.type === "string" ? body.type : "";

  switch (type) {
    case "assign": {
      if (typeof body.assignedToUserId !== "string" || !body.assignedToUserId.trim()) {
        throw new Error("assignedToUserId is required.");
      }
      if (typeof body.assignedToName !== "string" || !body.assignedToName.trim()) {
        throw new Error("assignedToName is required.");
      }
      return {
        type,
        assignedToUserId: body.assignedToUserId,
        assignedToName: body.assignedToName,
        actorId: typeof body.actorId === "string" ? body.actorId : undefined,
        actorName: typeof body.actorName === "string" ? body.actorName : undefined,
      };
    }
    case "respond": {
      if (typeof body.responseMessage !== "string" || !body.responseMessage.trim()) {
        throw new Error("responseMessage is required.");
      }
      return {
        type,
        responseMessage: body.responseMessage,
        actorId: typeof body.actorId === "string" ? body.actorId : undefined,
        actorName: typeof body.actorName === "string" ? body.actorName : undefined,
      };
    }
    case "schedule-test-drive": {
      if (typeof body.scheduledFor !== "string" || Number.isNaN(Date.parse(body.scheduledFor))) {
        throw new Error("scheduledFor must be a valid ISO datetime string.");
      }
      return {
        type,
        scheduledFor: body.scheduledFor,
        actorId: typeof body.actorId === "string" ? body.actorId : undefined,
        actorName: typeof body.actorName === "string" ? body.actorName : undefined,
      };
    }
    case "finance-request": {
      return {
        type,
        note: typeof body.note === "string" ? body.note : undefined,
        actorId: typeof body.actorId === "string" ? body.actorId : undefined,
        actorName: typeof body.actorName === "string" ? body.actorName : undefined,
      };
    }
    case "follow-up": {
      if (typeof body.followUpAt !== "string" || Number.isNaN(Date.parse(body.followUpAt))) {
        throw new Error("followUpAt must be a valid ISO datetime string.");
      }
      return {
        type,
        followUpAt: body.followUpAt,
        note: typeof body.note === "string" ? body.note : undefined,
        actorId: typeof body.actorId === "string" ? body.actorId : undefined,
        actorName: typeof body.actorName === "string" ? body.actorName : undefined,
      };
    }
    case "set-status": {
      if (typeof body.status !== "string" || !VALID_STATUSES.includes(body.status as EnquiryStatus)) {
        throw new Error("Invalid enquiry status.");
      }
      return {
        type,
        status: body.status as EnquiryStatus,
        note: typeof body.note === "string" ? body.note : undefined,
        actorId: typeof body.actorId === "string" ? body.actorId : undefined,
        actorName: typeof body.actorName === "string" ? body.actorName : undefined,
      };
    }
    case "close-won":
    case "close-lost": {
      return {
        type,
        note: typeof body.note === "string" ? body.note : undefined,
        actorId: typeof body.actorId === "string" ? body.actorId : undefined,
        actorName: typeof body.actorName === "string" ? body.actorName : undefined,
      };
    }
    default:
      throw new Error("Invalid enquiry action.");
  }
}
