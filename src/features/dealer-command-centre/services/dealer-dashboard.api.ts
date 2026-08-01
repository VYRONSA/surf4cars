import { createAuthenticatedHeaders } from "@/features/authentication";
import type { DealerDashboardData } from "@/features/dealer-command-centre/types/dashboard.types";

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const body = (await response.json().catch(() => null)) as { readonly error?: string } | null;
  if (!response.ok) {
    throw new Error(body?.error ?? fallback);
  }
  return body as T;
}

export async function getDealerDashboardPayload(dealershipId: string): Promise<DealerDashboardData> {
  const headers = await createAuthenticatedHeaders();
  const url = new URL("/api/v1/dealer/dashboard", window.location.origin);
  url.searchParams.set("dealershipId", dealershipId);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseResponse<DealerDashboardData>(response, "Failed to load dealer dashboard.");
}