/**
 * South African geography, only as far as we can assert it.
 *
 * This exists to answer one question honestly: *is this address internally contradictory?* It is not a
 * validation service and it cannot tell you an address is correct — only that a record disagrees with
 * itself, which is a defect no matter what the true address turns out to be.
 *
 * WHY THE COVERAGE IS DELIBERATELY INCOMPLETE
 * ===========================================
 * A quality rule that fires wrongly is worse than a missing rule. A false "this dealer's address is wrong"
 * sends the Founder to correct a record that was already right, and after that happens twice nobody trusts
 * the report. So every range below is one whose provincial allocation is unambiguous, and the genuinely
 * contested bands — provincial borders, and the blocks South Africa reallocated between provinces — are
 * left out entirely and resolve to `null`.
 *
 * `null` means "this reference cannot say", never "no problem found". Callers must treat the two
 * differently: an indeterminate postal code produces no finding at all, rather than a pass.
 *
 * The same principle the platform applies to dealer data applies to its own reference data. An obviously
 * absent range gets noticed and filled. A confidently wrong one gets believed.
 */

export type Province =
  | "Eastern Cape"
  | "Free State"
  | "Gauteng"
  | "KwaZulu-Natal"
  | "Limpopo"
  | "Mpumalanga"
  | "North West"
  | "Northern Cape"
  | "Western Cape";

export const PROVINCES: readonly Province[] = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

interface PostalRange {
  readonly from: number;
  readonly to: number;
  readonly province: Province;
}

/**
 * Postal-code bands with an unambiguous province.
 *
 * Gaps are intentional and are listed here so nobody "completes" the table by guessing:
 *
 *   2200–3199   North West / Free State / KwaZulu-Natal interleave around the old boundaries.
 *   4731–5199   the Eastern Cape–KwaZulu-Natal border, including the former Transkei reallocations.
 *   9000–9199   Free State / Northern Cape border.
 *
 * An address in one of those bands is reported as indeterminate, not as consistent and not as wrong.
 */
const POSTAL_RANGES: readonly PostalRange[] = [
  { from: 1, to: 299, province: "Gauteng" },        // Tshwane
  { from: 300, to: 499, province: "North West" },   // Rustenburg, Brits
  { from: 500, to: 999, province: "Limpopo" },
  { from: 1000, to: 1399, province: "Mpumalanga" },
  { from: 1400, to: 2199, province: "Gauteng" },    // Ekurhuleni, West Rand, Johannesburg
  { from: 3200, to: 4730, province: "KwaZulu-Natal" },
  { from: 5200, to: 6499, province: "Eastern Cape" },
  { from: 6500, to: 8099, province: "Western Cape" },
  { from: 8100, to: 8999, province: "Northern Cape" },
  { from: 9200, to: 9999, province: "Free State" },
];

/** The province a postal code belongs to, or `null` where this reference cannot say. */
export function provinceForPostalCode(postalCode: string | null | undefined): Province | null {
  const digits = String(postalCode ?? "").trim();
  if (!/^\d{4}$/.test(digits)) return null;

  const value = Number(digits);
  return POSTAL_RANGES.find((range) => value >= range.from && value <= range.to)?.province ?? null;
}

/**
 * Cities whose province is not in question.
 *
 * Metros and large centres only. A small town shared across a provincial boundary, or one of the several
 * duplicated place names in South Africa, is absent on purpose — the rule that consumes this would rather
 * say nothing than accuse a dealer of misfiling an address that is correct.
 */
const CITY_PROVINCE: Readonly<Record<string, Province>> = {
  "cape town": "Western Cape",
  stellenbosch: "Western Cape",
  paarl: "Western Cape",
  "george": "Western Cape",
  johannesburg: "Gauteng",
  pretoria: "Gauteng",
  tshwane: "Gauteng",
  sandton: "Gauteng",
  centurion: "Gauteng",
  soweto: "Gauteng",
  benoni: "Gauteng",
  durban: "KwaZulu-Natal",
  pietermaritzburg: "KwaZulu-Natal",
  umhlanga: "KwaZulu-Natal",
  newcastle: "KwaZulu-Natal",
  gqeberha: "Eastern Cape",
  "port elizabeth": "Eastern Cape",
  "east london": "Eastern Cape",
  mthatha: "Eastern Cape",
  bloemfontein: "Free State",
  welkom: "Free State",
  mbombela: "Mpumalanga",
  nelspruit: "Mpumalanga",
  witbank: "Mpumalanga",
  emalahleni: "Mpumalanga",
  polokwane: "Limpopo",
  rustenburg: "North West",
  potchefstroom: "North West",
  mahikeng: "North West",
  kimberley: "Northern Cape",
  upington: "Northern Cape",
};

/** The province a city sits in, or `null` where this reference cannot say. */
export function provinceForCity(city: string | null | undefined): Province | null {
  const key = String(city ?? "").trim().toLowerCase();
  return key ? (CITY_PROVINCE[key] ?? null) : null;
}

/** Whether a string names a province we recognise. */
export function isKnownProvince(value: string | null | undefined): value is Province {
  return PROVINCES.includes(String(value ?? "").trim() as Province);
}

/**
 * Whether a street address carries more than a street line.
 *
 * A South African address that a buyer can actually navigate to normally names a suburb as well as a
 * street. "1 Main Road" with no suburb is not wrong, but in a city the size of Cape Town it is not enough
 * to find a forecourt — so it is reported as thin rather than as an error.
 */
export function hasSuburb(address: string | null | undefined): boolean {
  const text = String(address ?? "").trim();
  if (!text) return false;
  // A suburb shows up as a second component: either a comma-separated part, or words beyond the street.
  if (text.includes(",")) return true;
  // "12 Rivonia Road Sandhurst" — street type followed by at least one more word.
  return /\b(road|street|avenue|drive|lane|way|crescent|boulevard|rd|st|ave)\b\s+\S+/i.test(text);
}
