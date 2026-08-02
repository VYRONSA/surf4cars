import type { SourceRow, SourceTable } from "../domain/import.types";

/**
 * Adapters: the only part of the platform that knows what a file looks like.
 *
 * THE CONTRACT, AND WHY IT IS THIS NARROW
 * =======================================
 * An adapter takes bytes and returns a `SourceTable`. It does not validate, does not map to
 * canonical fields, and does not touch the database. Phase 13 asks whether a new importer can be
 * added without changing the engine, and the answer stays yes only while that boundary holds — the
 * moment one adapter starts "helpfully" normalising a price, the next one has to reimplement it and
 * the third disagrees with both.
 *
 * What separates the AutoTrader adapter from the plain CSV adapter is therefore *not* parsing logic.
 * They share it. It is a set of column aliases, which the mapping engine consumes as hints. That is
 * the whole difference, and it is the reason adding Cars.co.za took eleven lines.
 */

export interface SourceAdapter {
  readonly id: string;
  readonly label: string;
  /** Shown in the wizard so a dealer recognises their own export. */
  readonly description: string;
  /** Extra column aliases this source is known to use, consumed by the mapping engine. */
  readonly columnHints?: Readonly<Record<string, readonly string[]>>;
  /** Confidence 0–1 that this adapter should handle the file, from its headers alone. */
  detect(columns: readonly string[]): number;
  parse(content: string, sourceName: string): SourceTable;
}

/* ── Delimited parsing, shared ────────────────────────────────────────────────────────────────
   One implementation. CSV, TSV and semicolon files are the same problem with a different byte, and
   South African exports use all three — Excel on a machine with a comma decimal separator writes
   semicolons without telling anybody.
   ──────────────────────────────────────────────────────────────────────────────────────────── */

function detectDelimiter(headerLine: string): string {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = splitDelimited(headerLine, candidate).length;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

/** A single line, respecting double quotes and doubled quotes inside them. */
function splitDelimited(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === delimiter && !quoted) {
      out.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current);
  return out;
}

/**
 * Split into records, honouring newlines inside quoted cells.
 *
 * A dealer's description column routinely contains line breaks — it is the field they paste from
 * Word. Splitting on `\n` first would turn one vehicle into six rows of nonsense, and the failure
 * looks like a corrupt file rather than a parser bug.
 */
function splitRecords(content: string): string[] {
  const records: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (char === '"') {
      if (quoted && content[i + 1] === '"') {
        current += '""';
        i += 1;
        continue;
      }
      quoted = !quoted;
      current += char;
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && content[i + 1] === "\n") i += 1;
      records.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) records.push(current);
  return records;
}

export function parseDelimited(content: string, sourceName: string, sourceKind: string): SourceTable {
  /* A byte-order mark on the first header turns "VIN" into "﻿VIN", which then matches nothing
     and is reported as an ignored column. Excel writes one by default. */
  const text = content.replace(/^﻿/, "");
  const records = splitRecords(text).filter((line) => line.trim().length > 0);
  if (records.length === 0) {
    return { columns: [], rows: [], sourceKind, sourceName };
  }

  const delimiter = detectDelimiter(records[0]!);
  const columns = splitDelimited(records[0]!, delimiter).map((column) => column.trim());

  const rows: SourceRow[] = [];
  for (let i = 1; i < records.length; i += 1) {
    const values = splitDelimited(records[i]!, delimiter);
    const cells: Record<string, string> = {};
    columns.forEach((column, index) => {
      cells[column] = (values[index] ?? "").trim();
    });
    /* Row 1 is the header, so the first data row is row 2 — the number the dealer sees. */
    rows.push({ rowNumber: i + 1, cells });
  }

  return { columns, rows, sourceKind, sourceName };
}

const hasAll = (columns: readonly string[], needles: readonly string[]): boolean => {
  const lower = columns.map((column) => column.toLowerCase().replace(/[^a-z0-9]/g, ""));
  return needles.every((needle) => lower.some((column) => column.includes(needle)));
};

/* ── The adapters ────────────────────────────────────────────────────────────────────────────── */

export const csvAdapter: SourceAdapter = {
  id: "csv",
  label: "Spreadsheet (CSV)",
  description: "A comma, semicolon or tab separated export from Excel, Google Sheets or Numbers.",
  /* The floor. Anything with columns can be read as a spreadsheet, so this never wins against a
     source that recognises itself, and never loses to nothing. */
  detect: (columns) => (columns.length > 1 ? 0.3 : 0),
  parse: (content, sourceName) => parseDelimited(content, sourceName, "csv"),
};

export const autotraderAdapter: SourceAdapter = {
  id: "autotrader",
  label: "AutoTrader stock export",
  description: "The stock file AutoTrader produces for dealers.",
  columnHints: {
    stockNumber: ["stockid", "stockref", "advertref"],
    variant: ["derivative", "trim"],
    priceRand: ["retailprice", "advertisedprice"],
    imageUrls: ["imageurls", "photourls", "images"],
    mileageKm: ["mileage", "odometer", "kms"],
    bodyType: ["bodystyle", "bodytype"],
  },
  detect: (columns) =>
    hasAll(columns, ["derivative"]) && hasAll(columns, ["stock"])
      ? 0.9
      : hasAll(columns, ["derivative"])
        ? 0.6
        : 0,
  parse: (content, sourceName) => parseDelimited(content, sourceName, "autotrader"),
};

export const carsCoZaAdapter: SourceAdapter = {
  id: "carscoza",
  label: "Cars.co.za stock export",
  description: "The stock file Cars.co.za produces for dealers.",
  columnHints: {
    stockNumber: ["stockcode", "dealerstockcode"],
    variant: ["version", "trim"],
    priceRand: ["price", "sellingprice"],
    imageUrls: ["imagelinks", "pictures"],
    registration: ["regno", "registrationno"],
  },
  detect: (columns) =>
    hasAll(columns, ["stockcode"]) ? 0.9 : hasAll(columns, ["version", "price"]) ? 0.55 : 0,
  parse: (content, sourceName) => parseDelimited(content, sourceName, "carscoza"),
};

/**
 * Every adapter the platform knows.
 *
 * Adding one is an entry here plus a file. Nothing in mapping, validation, duplicate detection,
 * readiness or publishing changes — which is the property Phase 13 asks about, and the reason the
 * two portal adapters above are almost entirely column aliases.
 */
export const SOURCE_ADAPTERS: readonly SourceAdapter[] = [
  autotraderAdapter,
  carsCoZaAdapter,
  csvAdapter,
];

/** The best adapter for a file, by its own confidence. Ties fall to the earlier registration. */
export function detectAdapter(columns: readonly string[]): SourceAdapter {
  let best = csvAdapter;
  let bestScore = -1;
  for (const adapter of SOURCE_ADAPTERS) {
    const score = adapter.detect(columns);
    if (score > bestScore) {
      best = adapter;
      bestScore = score;
    }
  }
  return best;
}
