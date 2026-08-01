interface ApiError {
  readonly error?: string;
}

async function parseResponse(response: Response, fallback: string): Promise<void> {
  const payload = (await response.json().catch(() => null)) as ApiError | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? fallback);
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
}): Promise<void> {
  const response = await fetch("/api/v1/marketplace/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await parseResponse(response, "Failed to submit enquiry.");
}
