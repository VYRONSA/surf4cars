const DEALERSHIP_KEY = "surf4cars:active-dealership-id";

export function getActiveDealershipId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEALERSHIP_KEY);
}
