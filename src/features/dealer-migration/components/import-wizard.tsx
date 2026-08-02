"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/shell/page/page-container";
import { Text } from "@/components/ui/typography";
import { getActiveDealershipId } from "@/features/inventory/utils/active-dealership";

import { CANONICAL_FIELDS, type CanonicalField, type ImportPlan, type RowDecision } from "../domain/import.types";

/**
 * The import wizard.
 *
 * "MUST FEEL LIKE APPLE. NOT SAP."
 * ================================
 * Which in practice is three rules, and they are the ones that were actually hard:
 *
 * 1. **Dealer language only.** Not one word of this screen says "CSV", "mapping", "validation",
 *    "record" or "parse". A dealer moving 250 cars is not a systems integrator; they are a person
 *    with a spreadsheet and a Tuesday. "Check we read your columns correctly" is the same question
 *    as "confirm your column mapping" and only one of them can be answered without training.
 *
 * 2. **Show the outcome before asking for a decision.** Every incumbent runs the import and then
 *    reports on it. This shows what *will* happen — every row, every problem, every vehicle already
 *    on the forecourt — and nothing exists until the dealer says so. Re-reading the file with a
 *    different column costs nothing, because analysing writes nothing.
 *
 * 3. **Never make a destructive choice on the dealer's behalf.** A vehicle already in stock defaults
 *    to being left alone. Changing that is one click, but it is the dealer's click.
 *
 * WHY THE STEPS ARE NOT A PROGRESS BAR
 * ====================================
 * A dealer who has spent ten minutes reviewing 250 rows must be able to go back and change a column
 * without starting again. The plan lives in component state and re-analysing is a single request, so
 * every step back is free and nothing is lost.
 */

type Step = "choose" | "columns" | "review" | "done";

interface Branch {
  readonly id: string;
  readonly name: string;
  readonly city: string | null;
}

interface CommitResult {
  readonly batchId: string;
  readonly imported: number;
  readonly updated: number;
  readonly skipped: number;
  readonly rejected: number;
  readonly mediaWritten: number;
  readonly durationMs: number;
}

/** The dealer's word for each field. Never the field name. */
const FIELD_LABELS: Record<CanonicalField, string> = {
  vin: "VIN / chassis number",
  stockNumber: "Your stock number",
  registration: "Registration",
  make: "Make",
  model: "Model",
  variant: "Derivative",
  year: "Year",
  mileageKm: "Mileage",
  fuel: "Fuel",
  transmission: "Transmission",
  colour: "Colour",
  bodyType: "Body type",
  engine: "Engine",
  priceRand: "Price",
  description: "Description",
  equipment: "Features",
  imageUrls: "Photographs",
  branch: "Branch",
};

const REQUIRED_FIELDS: readonly CanonicalField[] = ["make", "model", "priceRand"];

export function ImportWizard() {
  const [step, setStep] = useState<Step>("choose");
  const [dealershipId] = useState<string | null>(() => getActiveDealershipId());
  const [fileName, setFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [branches, setBranches] = useState<readonly Branch[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Record<number, RowDecision>>({});
  const [result, setResult] = useState<CommitResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyse = useCallback(
    async (content: string, name: string) => {
      if (!dealershipId) {
        setError("Choose a dealership before adding stock.");
        return;
      }
      setIsBusy(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/dealer/imports/analyse?dealershipId=${encodeURIComponent(dealershipId)}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fileName: name, content }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "We could not read that file.");

        setPlan(payload.plan as ImportPlan);
        setBranches(payload.branches as Branch[]);
        setBranchId((current) => current || (payload.branches?.[0]?.id ?? ""));
        setDecisions({});
        setStep("columns");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "We could not read that file.");
      } finally {
        setIsBusy(false);
      }
    },
    [dealershipId],
  );

  const onFile = useCallback(
    async (file: File) => {
      const content = await file.text();
      setFileName(file.name);
      setFileContent(content);
      await analyse(content, file.name);
    },
    [analyse],
  );

  const summary = plan?.summary;

  /* A dealer's own decisions win over the plan's proposal, and the plan's proposal for a vehicle
     already in stock is always "leave it alone". */
  const effectiveDecision = useCallback(
    (rowNumber: number, planned: RowDecision): RowDecision => decisions[rowNumber] ?? planned,
    [decisions],
  );

  const duplicates = useMemo(
    () => (plan?.rows ?? []).filter((row) => row.matchedVehicleId !== null && row.decision !== "reject"),
    [plan],
  );

  const problems = useMemo(
    () => (plan?.rows ?? []).filter((row) => row.issues.length > 0),
    [plan],
  );

  const missingRequired = useMemo(() => {
    if (!plan) return [];
    const mapping = { ...plan.mapping.mapping, ...overrides } as Record<string, string | undefined>;
    return REQUIRED_FIELDS.filter((field) => !mapping[field]);
  }, [plan, overrides]);

  async function commit() {
    if (!plan || !dealershipId) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/dealer/imports/commit?dealershipId=${encodeURIComponent(dealershipId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, decisions, defaultBranchId: branchId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The import could not be completed.");
      setResult(payload as CommitResult);
      setStep("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The import could not be completed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function batchAction(action: "revert" | "publish") {
    if (!result || !dealershipId) return;
    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/v1/dealer/imports/${result.batchId}?dealershipId=${encodeURIComponent(dealershipId)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "That could not be completed.");

      if (action === "revert") {
        setNotice(
          payload.leftUpdated > 0
            ? `${payload.deleted} vehicles removed. ${payload.leftUpdated} vehicles you chose to update were left as they are — undoing an update would mean restoring values we never held.`
            : `${payload.deleted} vehicles removed. Your stock is back to how it was.`,
        );
      } else {
        setNotice(
          payload.withheld > 0
            ? `${payload.published} vehicles are now live. ${payload.withheld} were held back because they still have no price or no photographs.`
            : `${payload.published} vehicles are now live.`,
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That could not be completed.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Add your stock"
        description="Bring your vehicles across from a spreadsheet or an export from another site. Nothing is added until you have seen exactly what will happen."
      />

      {error ? (
        <Card className="mt-6 border-[var(--color-danger)]">
          <CardContent>
            <Text role="alert">{error}</Text>
          </CardContent>
        </Card>
      ) : null}

      {step === "choose" ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Choose your stock file</CardTitle>
            <CardDescription>
              A spreadsheet saved as CSV, or an export from AutoTrader or Cars.co.za. We work out the rest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
              {isBusy ? "Reading your file…" : "Choose file"}
            </Button>
            {fileName ? (
              <Text className="mt-3">{fileName}</Text>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {step === "columns" && plan ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Check we read your columns correctly</CardTitle>
            <CardDescription>
              We matched {Object.keys(plan.mapping.mapping).length} of your columns. Change anything we got wrong.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CANONICAL_FIELDS.map((field) => {
                const chosen = overrides[field] ?? plan.mapping.mapping[field] ?? "";
                const reason = plan.mapping.reasons[field];
                return (
                  <div key={field} className="grid gap-2 sm:grid-cols-[14rem_1fr]">
                    <label htmlFor={`map-${field}`}>
                      <Text>
                        {FIELD_LABELS[field]}
                        {REQUIRED_FIELDS.includes(field) ? " — needed" : ""}
                      </Text>
                    </label>
                    <div>
                      <select
                        id={`map-${field}`}
                        value={chosen}
                        onChange={(event) =>
                          setOverrides((current) => ({ ...current, [field]: event.target.value }))
                        }
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                      >
                        <option value="">Not in my file</option>
                        {allColumns(plan).map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </select>
                      {reason && !overrides[field] ? (
                        <Text className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                          {reason}
                        </Text>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {plan.mapping.ignoredColumns.length > 0 ? (
              <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <Text className="font-medium">
                  {plan.mapping.ignoredColumns.length} columns in your file were not brought across
                </Text>
                <Text className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {plan.mapping.ignoredColumns.join(", ")}
                </Text>
                <Text className="mt-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                  Nothing was thrown away — these stay on your import record. Cost, trade and internal
                  columns are never matched automatically, so your buying prices and private notes are
                  never published by accident. Pick one above if you did want it.
                </Text>
              </div>
            ) : null}

            {missingRequired.length > 0 ? (
              <Text className="mt-4" role="alert">
                We still need {missingRequired.map((field) => FIELD_LABELS[field]).join(", ")} before we can continue.
              </Text>
            ) : null}

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep("choose")} disabled={isBusy}>
                Choose a different file
              </Button>
              <Button
                type="button"
                onClick={() => setStep("review")}
                disabled={isBusy || missingRequired.length > 0}
              >
                See what will happen
              </Button>
            </div>
            {Object.keys(overrides).length > 0 ? (
              <Text className="mt-3 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                Changed a column?{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void analyse(fileContent, fileName)}
                >
                  Read my file again
                </button>{" "}
                to see the effect.
              </Text>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {step === "review" && plan && summary ? (
        <>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>What will happen</CardTitle>
              <CardDescription>Nothing has been added yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <Stat label="Vehicles to add" value={summary.toImport} />
                <Stat label="Already in your stock" value={summary.toSkip} />
                <Stat label="Cannot be added" value={summary.rejected} />
                <Stat label="Ready to go live" value={summary.ready} />
                <Stat label="Photographs found" value={summary.imagesFound} />
                <Stat label="Features found" value={summary.equipmentFound} />
              </dl>

              {branches.length > 1 ? (
                <div className="mt-6">
                  <label htmlFor="branch">
                    <Text>Which branch are these vehicles at?</Text>
                  </label>
                  <select
                    id="branch"
                    value={branchId}
                    onChange={(event) => setBranchId(event.target.value)}
                    className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 sm:max-w-sm"
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                        {branch.city ? ` — ${branch.city}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {duplicates.length > 0 ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Vehicles you already have</CardTitle>
                <CardDescription>
                  We will leave these alone unless you say otherwise. Nothing is ever overwritten automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {duplicates.map((row) => (
                    <div key={row.rowNumber} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                      <Text className="font-medium">
                        Row {row.rowNumber} — {[row.mapped.year, row.mapped.make, row.mapped.model].filter(Boolean).join(" ")}
                      </Text>
                      <Text className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                        {row.matchReason}
                      </Text>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["skip", "update", "import"] as const).map((choice) => (
                          <Button
                            key={choice}
                            type="button"
                            variant={effectiveDecision(row.rowNumber, row.decision) === choice ? "primary" : "secondary"}
                            onClick={() =>
                              setDecisions((current) => ({ ...current, [row.rowNumber]: choice }))
                            }
                          >
                            {choice === "skip"
                              ? "Keep what I have"
                              : choice === "update"
                                ? "Update it from this file"
                                : "Add as a second listing"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {problems.length > 0 ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Vehicles that need your attention</CardTitle>
                <CardDescription>
                  Every one names the row and the column in your own file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {problems.slice(0, 100).map((row) => (
                    <div key={row.rowNumber} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                      <Text className="font-medium">
                        Row {row.rowNumber}
                        {row.decision === "reject" ? " — cannot be added" : ""}
                      </Text>
                      <ul className="mt-2 space-y-1">
                        {row.issues.map((issue, index) => (
                          <li key={index}>
                            <Text className="text-[length:var(--text-body-sm)]">
                              {issue.severity === "error" ? "Must fix" : "Worth knowing"}
                              {issue.sourceColumn ? ` — ${issue.sourceColumn}` : ""}: {issue.message}
                            </Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {problems.length > 100 ? (
                  <Text className="mt-3 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                    Showing the first 100 of {problems.length}. The full list is in the report you can
                    download once the import has run.
                  </Text>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <div className="mt-6 flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("columns")} disabled={isBusy}>
              Back to columns
            </Button>
            <Button type="button" onClick={() => void commit()} disabled={isBusy || !branchId}>
              {isBusy ? "Adding your vehicles…" : `Add ${summary.toImport + summary.toUpdate} vehicles`}
            </Button>
          </div>
        </>
      ) : null}

      {step === "done" && result ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your stock is in</CardTitle>
            <CardDescription>
              Added as drafts, so nothing is visible to buyers until you publish it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-3">
              <Stat label="Added" value={result.imported} />
              <Stat label="Updated" value={result.updated} />
              <Stat label="Left alone" value={result.skipped} />
              <Stat label="Could not be added" value={result.rejected} />
              <Stat label="Photographs" value={result.mediaWritten} />
              <Stat label="Took" value={`${(result.durationMs / 1000).toFixed(1)}s`} />
            </dl>

            {notice ? (
              <Text className="mt-4" role="status">
                {notice}
              </Text>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void batchAction("publish")} disabled={isBusy}>
                Publish everything that is ready
              </Button>
              <Button type="button" variant="secondary" onClick={() => void batchAction("revert")} disabled={isBusy}>
                Undo this import
              </Button>
              <a
                href={`/api/v1/dealer/imports?dealershipId=${encodeURIComponent(dealershipId ?? "")}&report=${result.batchId}`}
                className="inline-flex items-center underline"
              >
                Download the full report
              </a>
            </div>

            <Text className="mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              You can undo this import until you publish it. Once vehicles are live they can still be
              unpublished one at a time, but the import can no longer be undone as a whole — a live
              listing may already have been seen or enquired about.
            </Text>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: number | string }) {
  return (
    <div>
      <dt>
        <Text className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{label}</Text>
      </dt>
      <dd>
        <Text className="text-[length:var(--text-heading-sm)]">{value}</Text>
      </dd>
    </div>
  );
}

/** Every column in the file — the mapped ones and the ones nothing was done with. */
function allColumns(plan: ImportPlan): readonly string[] {
  return [...new Set([...Object.values(plan.mapping.mapping), ...plan.mapping.ignoredColumns])].filter(
    (column): column is string => Boolean(column),
  );
}
