export function formatCurrencyCents(value: number, currency: string): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatRelativeDays(value: number): string {
  if (value === 0) return "Today";
  if (value === 1) return "1 day";
  return `${value} days`;
}
