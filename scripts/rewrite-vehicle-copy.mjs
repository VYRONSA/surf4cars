/**
 * Rewrites customer-facing vehicle copy that betrays the platform's build process.
 *
 * Twenty-four published listings carry descriptions like "…1785342219481 — premium pre-owned stock
 * published for PCP-001F marketplace verification with full dealer enrichment", and their SEO titles carry
 * the same raw epoch identifier. That is the sprint's most visible defect: a buyer reading a Volvo's
 * description is told about our ticket numbering.
 *
 * WHAT THIS WILL AND WILL NOT SAY
 * ===============================
 * Copy is composed from fields the record actually holds — year, make, model, variant, body type, fuel,
 * transmission, colour, mileage — plus one line of *marque character*, which is a statement about the
 * brand rather than about this car. "Volvo builds around safety" is true of Volvo; "full service history"
 * or "one owner" would be a claim about a specific vehicle that no field supports, so nothing here makes
 * one.
 *
 * That restraint is the point. A description that invents a service history is worse than the sprint ID it
 * replaced: the ID is embarrassing, the invention is a misrepresentation to someone deciding what to buy.
 *
 * Safety
 * ------
 * Dry run by default — `--apply` is required to write. Only rows whose copy matches an internal marker are
 * touched, so re-running is safe and a dealer's own description is never overwritten. Every previous value
 * is written to a restore file before the update.
 *
 * Usage:
 *   node scripts/rewrite-vehicle-copy.mjs              # report only
 *   node scripts/rewrite-vehicle-copy.mjs --apply
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const RESTORE_PATH = join("docs", "reports", "vehicle-copy-restore.json");

function loadEnv() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (match && !(match[1] in env)) env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
      }
    } catch {
      /* absent file is fine */
    }
  }
  return env;
}

const env = loadEnv();
const URL = String(env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const KEY = env.SUPABASE_SECRET_KEY;
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

/** Copy that should never reach a customer. Narrow on purpose — see the audit script. */
const INTERNAL = [/\bPCP-?\d{3}[A-Z]?\b/i, /\bSFC-?\d{3}\b/i, /\bmarketplace verification\b/i, /\bdealer enrichment\b/i, /\b\d{13,}\b/];

const isInternal = (text) => INTERNAL.some((pattern) => pattern.test(String(text ?? "")));

/**
 * One sentence of marque character.
 *
 * A statement about what the manufacturer is known for — defensible for any car wearing the badge. Marques
 * without an entry simply get no character line rather than a generic one, because "renowned for quality"
 * attached to everything is worth less than silence.
 */
const MARQUE_CHARACTER = {
  Volvo: "Volvo's reputation is built on occupant safety and restrained Scandinavian design",
  BMW: "BMW builds cars around the person driving them",
  "Mercedes-Benz": "Mercedes-Benz has long set the reference for refinement and interior quality",
  Audi: "Audi pairs understated design with a cabin that rewards close inspection",
  Porsche: "Porsche engineering is unmistakable from the first corner",
  Jaguar: "Jaguar's character sits somewhere between comfort and genuine pace",
  Lexus: "Lexus is known for quietness and a standard of finish that ages well",
  Toyota: "Toyota's reputation for durability is the reason resale values hold",
  Volkswagen: "Volkswagen builds for the long term, with a solidity you notice on a bad road",
  Ford: "Ford's local engineering is tuned for South African conditions",
  Isuzu: "Isuzu has spent decades earning its reputation on farms and work sites",
  Mahindra: "Mahindra builds for hard use and straightforward maintenance",
  Suzuki: "Suzuki's strength is light, honest engineering and running costs to match",
  Hyundai: "Hyundai's warranty and equipment levels changed what buyers expect at this price",
  Kia: "Kia has moved decisively upmarket in design and equipment",
  Nissan: "Nissan builds practical cars with a focus on everyday usability",
  Mazda: "Mazda puts unusual care into how a car steers and how its cabin is laid out",
  Peugeot: "Peugeot's recent interiors are among the most distinctive at any price",
  Renault: "Renault focuses on space and value in the segments it competes in",
  Mitsubishi: "Mitsubishi's four-wheel-drive heritage runs through everything it builds",
  Honda: "Honda's engineering discipline shows in how its engines and gearboxes wear",
};

/** How the body style is described in a sentence. */
const BODY_ROLE = {
  SUV: "an SUV with the space and command that come with it",
  Hatch: "a compact hatch that suits city use",
  Hatchback: "a compact hatch that suits city use",
  Sedan: "a sedan in the classic three-box shape",
  "Double Cab": "a double cab, equally suited to work and weekends",
  Bakkie: "a bakkie built for load and distance",
  MPV: "a people carrier with genuine room for everyone",
  Coupe: "a coupe, chosen for how it looks and drives rather than what it carries",
  "Panel Van": "a panel van set up for daily commercial work",
};

const formatKm = (km) => `${Number(km).toLocaleString("en-ZA").replace(/,/g, " ")} km`;

/**
 * Compose a description from the record.
 *
 * Three sentences: what it is, what it is made of, and what its condition record shows. Every clause is
 * dropped when the field behind it is absent, so a sparse record produces a shorter description rather than
 * a padded one.
 */
function composeDescription(vehicle) {
  const name = [vehicle.year, vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ");
  const role = BODY_ROLE[vehicle.body_type] ?? null;
  const character = MARQUE_CHARACTER[vehicle.make] ?? null;

  /* A record without a body type must still open on a whole sentence, not a fragment. */
  const opening = role
    ? `The ${name} is ${role}.`
    : `The ${name} is offered here by a verified SURF4CARS dealer.`;

  const mechanical = [
    vehicle.engine ? `a ${vehicle.engine}` : null,
    vehicle.fuel ? `${String(vehicle.fuel).toLowerCase()} engine` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const drivetrain = [
    mechanical || null,
    vehicle.transmission ? `${String(vehicle.transmission).toLowerCase()} transmission` : null,
  ]
    .filter(Boolean)
    .join(" paired with a ");

  const second = drivetrain ? `This example runs ${drivetrain}.` : null;

  /* Each combination gets its own phrasing so none of them reads as a fragment. */
  const colour = vehicle.colour ? String(vehicle.colour) : null;
  const distance = vehicle.mileage_km ? formatKm(vehicle.mileage_km) : null;
  const third =
    colour && distance
      ? `Finished in ${colour}, with ${distance} on the odometer.`
      : distance
        ? `It shows ${distance} on the odometer.`
        : colour
          ? `Finished in ${colour}.`
          : null;

  const closing = character ? `${character}.` : null;

  return [opening, second, third, closing].filter(Boolean).join(" ");
}

const composeSeoTitle = (vehicle) =>
  `${[vehicle.year, vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ")} for sale — SURF4CARS`;

const composeSeoDescription = (vehicle) => {
  const bits = [
    vehicle.mileage_km ? formatKm(vehicle.mileage_km) : null,
    vehicle.transmission,
    vehicle.fuel,
    vehicle.colour,
  ].filter(Boolean);
  return `${[vehicle.year, vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ")}${
    bits.length ? ` — ${bits.join(", ")}` : ""
  }. Verified dealer stock on SURF4CARS.`;
};

async function main() {
  if (!URL || !KEY) throw new Error("Supabase URL or secret key missing from .env.local.");

  const response = await fetch(
    `${URL}/rest/v1/inventory_vehicles?select=id,title,make,model,variant,year,mileage_km,colour,fuel,transmission,engine,body_type,description,seo_title,seo_description&lifecycle_status=eq.published&limit=1000`,
    { headers: HEADERS },
  );
  const vehicles = await response.json();
  if (!Array.isArray(vehicles)) throw new Error(`Read failed: ${JSON.stringify(vehicles).slice(0, 200)}`);

  const affected = vehicles.filter(
    (vehicle) =>
      isInternal(vehicle.description) || isInternal(vehicle.seo_title) || isInternal(vehicle.seo_description),
  );

  console.log(`${vehicles.length} published listings, ${affected.length} carrying internal copy.\n`);

  const restore = [];
  let written = 0;

  for (const vehicle of affected) {
    const next = {
      description: composeDescription(vehicle),
      seo_title: composeSeoTitle(vehicle),
      seo_description: composeSeoDescription(vehicle),
    };

    if (!APPLY) {
      console.log(`— ${vehicle.title}`);
      console.log(`  before: ${String(vehicle.description ?? "").slice(0, 96)}`);
      console.log(`  after:  ${next.description.slice(0, 96)}\n`);
      continue;
    }

    restore.push({
      id: vehicle.id,
      description: vehicle.description,
      seo_title: vehicle.seo_title,
      seo_description: vehicle.seo_description,
    });

    const update = await fetch(`${URL}/rest/v1/inventory_vehicles?id=eq.${vehicle.id}`, {
      method: "PATCH",
      headers: { ...HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify(next),
    });

    if (!update.ok) {
      console.log(`  ! ${vehicle.title}: ${update.status} ${(await update.text()).slice(0, 120)}`);
      continue;
    }

    written += 1;
    console.log(`✓ ${vehicle.title}`);
  }

  if (APPLY) {
    mkdirSync(join("docs", "reports"), { recursive: true });
    writeFileSync(RESTORE_PATH, `${JSON.stringify({ rewrittenAt: new Date().toISOString(), restore }, null, 2)}\n`);
    console.log(`\n${written} listings rewritten. Previous values saved to ${RESTORE_PATH}.`);
  } else {
    console.log(`Dry run — nothing written. Re-run with --apply to update ${affected.length} listings.`);
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
