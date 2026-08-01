"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  OperationsApplicationActionInput,
  OperationsApplicationPriority,
  OperationsApplicationStatus,
  OperationsApplicationsWorkspaceData,
} from "@/features/operations/types/applications-centre.types";

function formatRelative(isoTimestamp: string): string {
  const parsed = Date.parse(isoTimestamp);
  if (!Number.isFinite(parsed)) return "Unknown";

  const minutes = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function toStatusVariant(status: OperationsApplicationStatus): "default" | "warning" | "success" | "danger" | "outline" | "info" {
  if (status === "new") return "default";
  if (status === "assigned" || status === "in-review") return "warning";
  if (status === "approved" || status === "completed") return "success";
  if (status === "rejected" || status === "cancelled") return "danger";
  if (status === "archived") return "outline";
  return "info";
}

function toPriorityVariant(priority: OperationsApplicationPriority): "success" | "warning" | "danger" | "outline" {
  if (priority === "low") return "outline";
  if (priority === "medium") return "success";
  if (priority === "high") return "warning";
  return "danger";
}

interface ApplicationsCentreWorkspaceProps {
  readonly initialData: OperationsApplicationsWorkspaceData;
}

export function ApplicationsCentreWorkspace({ initialData }: ApplicationsCentreWorkspaceProps) {
  const [workspace, setWorkspace] = useState(initialData);
  const [selectedId, setSelectedId] = useState(initialData.queue[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "priority">("updated");
  const [noteText, setNoteText] = useState("");
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const [attachmentFileName, setAttachmentFileName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queue = useMemo(() => {
    const filtered = workspace.queue.filter((item) => {
      const searchTerm = search.trim().toLowerCase();
      if (searchTerm) {
        const haystack = [
          item.summary,
          item.typeLabel,
          item.applicant.name,
          item.dealer?.name,
          item.buyer?.name,
          item.vehicle?.title,
        ].filter(Boolean).join(" ").toLowerCase();

        if (!haystack.includes(searchTerm)) return false;
      }

      if (statusFilter && item.status !== statusFilter) return false;
      if (typeFilter && item.type !== typeFilter) return false;
      if (priorityFilter && item.priority !== priorityFilter) return false;
      if (ownerFilter && item.assignedUser?.name !== ownerFilter) return false;

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const rank = { urgent: 4, high: 3, medium: 2, low: 1 } as const;
        return rank[b.priority] - rank[a.priority];
      }

      if (sortBy === "created") {
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }

      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
  }, [workspace.queue, search, statusFilter, typeFilter, priorityFilter, ownerFilter, sortBy]);

  const selected = useMemo(() => queue.find((item) => item.id === selectedId) ?? queue[0] ?? null, [queue, selectedId]);

  const owners = useMemo(
    () => [...new Set(workspace.queue.map((item) => item.assignedUser?.name).filter(Boolean))] as string[],
    [workspace.queue],
  );

  async function reloadWorkspace() {
    const response = await fetch("/api/v1/operations/applications-centre", { cache: "no-store" });
    const payload = await response.json() as OperationsApplicationsWorkspaceData | { error: string };

    if (!response.ok || "error" in payload) {
      throw new Error("error" in payload ? payload.error : "Failed to refresh Applications Centre.");
    }

    setWorkspace(payload);
  }

  async function runAction(action: OperationsApplicationActionInput) {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/v1/operations/applications-centre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });

      const payload = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Action failed.");
      }

      await reloadWorkspace();

      if (action.action === "add-note") {
        setNoteText("");
      }

      if (action.action === "add-attachment-metadata") {
        setAttachmentLabel("");
        setAttachmentFileName("");
        setAttachmentUrl("");
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-5 py-1">
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[radial-gradient(circle_at_top_right,rgba(0,112,255,0.12),transparent_44%),linear-gradient(165deg,var(--color-surface-raised),var(--color-background))] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(0,112,255,0.16),rgba(0,112,255,0))]" />
        <p className="relative text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          SURF Operations Centre
        </p>
        <h1 className="relative mt-2 text-balance text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h1)]">
          Applications Centre
        </h1>
        <p className="relative mt-3 max-w-3xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          Unified operational queue for platform applications and incoming requests.
        </p>
        <p className="relative mt-4 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          Last refreshed {formatRelative(workspace.generatedAt)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspace.queueStats.map((card) => (
          <Card key={card.id} variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)]">
                {card.label}
              </CardDescription>
              <CardTitle className="text-[length:var(--text-h3)]">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{card.detail}</p>
              {card.availability === "coming-soon" ? <Badge variant="outline" className="mt-2">Coming Soon</Badge> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Queue Filters</CardTitle>
          <CardDescription>Search, filter, and sort all applications through one operational framework.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Input placeholder="Search queue" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in-review">In Review</option>
              <option value="waiting-customer">Waiting Customer</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </Select>
            <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All application types</option>
              {[...new Set(workspace.queue.map((item) => item.type))].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
            <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
              <option value="">All owners</option>
              {owners.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
            </Select>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as "updated" | "created" | "priority") }>
              <option value="updated">Sort by updated date</option>
              <option value="created">Sort by created date</option>
              <option value="priority">Sort by priority</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Unified Queue</CardTitle>
            <CardDescription>Every request entering the platform passes through this operational inbox.</CardDescription>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <EmptyState title="No applications" description="No applications match current filters." />
            ) : (
              <Table>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((item) => (
                    <TableRow key={item.id} selected={selected?.id === item.id} onClick={() => setSelectedId(item.id)} className="cursor-pointer">
                      <TableCell>{item.typeLabel}</TableCell>
                      <TableCell>{item.summary}</TableCell>
                      <TableCell><Badge variant={toStatusVariant(item.status)}>{item.status}</Badge></TableCell>
                      <TableCell><Badge variant={toPriorityVariant(item.priority)}>{item.priority}</Badge></TableCell>
                      <TableCell>{item.assignedUser?.name ?? "Unassigned"}</TableCell>
                      <TableCell>{item.dealer?.name ?? "N/A"}</TableCell>
                      <TableCell>{item.buyer?.name ?? "N/A"}</TableCell>
                      <TableCell>{item.vehicle?.title ?? "N/A"}</TableCell>
                      <TableCell>{formatRelative(item.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
          <CardHeader>
            <CardTitle>Application Detail</CardTitle>
            <CardDescription>Detail workflow including assignment, status actions, notes, timeline, and audit history.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <EmptyState title="Select an application" description="Choose a queue item to inspect details and run actions." />
            ) : (
              <div className="space-y-4">
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                  <p className="text-[length:var(--text-body-sm)] font-medium">{selected.typeLabel}</p>
                  <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{selected.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={toStatusVariant(selected.status)}>{selected.status}</Badge>
                    <Badge variant={toPriorityVariant(selected.priority)}>{selected.priority}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[length:var(--text-caption)]">
                  <p>Applicant: {selected.applicant.name}</p>
                  <p>Dealer: {selected.dealer?.name ?? "N/A"}</p>
                  <p>Buyer: {selected.buyer?.name ?? "N/A"}</p>
                  <p>Vehicle: {selected.vehicle?.title ?? "N/A"}</p>
                  <p>Assigned: {selected.assignedUser?.name ?? "Unassigned"}</p>
                  <p>Updated: {formatRelative(selected.updatedAt)}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button size="sm" disabled={isSaving} onClick={() => runAction({ applicationId: selected.id, action: "assign", assignedToUserId: "operations-user", assignedToName: "Operations User" })}>Assign</Button>
                  <Button size="sm" variant="outline" disabled={isSaving} onClick={() => runAction({ applicationId: selected.id, action: "reassign", assignedToUserId: "operations-user-2", assignedToName: "Operations User 2" })}>Reassign</Button>
                  <Button size="sm" variant="success" disabled={isSaving} onClick={() => runAction({ applicationId: selected.id, action: "approve" })}>Approve</Button>
                  <Button size="sm" variant="danger" disabled={isSaving} onClick={() => runAction({ applicationId: selected.id, action: "reject" })}>Reject</Button>
                  <Button size="sm" variant="outline" disabled={isSaving} onClick={() => runAction({ applicationId: selected.id, action: "request-information", note: "Requesting additional applicant information." })}>Request Info</Button>
                  <Button size="sm" variant="success" disabled={isSaving} onClick={() => runAction({ applicationId: selected.id, action: "mark-complete" })}>Mark Complete</Button>
                  <Button size="sm" variant="danger" disabled={isSaving} onClick={() => runAction({ applicationId: selected.id, action: "cancel" })}>Cancel</Button>
                  <Button size="sm" variant="outline" disabled={isSaving} onClick={() => runAction({ applicationId: selected.id, action: "archive" })}>Archive</Button>
                  <Button size="sm" variant="outline" disabled={isSaving} onClick={() => runAction({ applicationId: selected.id, action: "export" })}>Export</Button>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                  <p className="text-[length:var(--text-body-sm)] font-medium">Internal Notes</p>
                  <Textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Add operations-only notes" />
                  <Button className="mt-2" size="sm" disabled={isSaving || !noteText.trim()} onClick={() => runAction({ applicationId: selected.id, action: "add-note", note: noteText })}>Save Note</Button>
                  <ul className="mt-3 space-y-2 text-[length:var(--text-caption)]">
                    {selected.notes.map((note) => (
                      <li key={note.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2">
                        <p>{note.note}</p>
                        <p className="text-[var(--color-muted-foreground)]">{note.actorName ?? note.actorType} · {formatRelative(note.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                  <p className="text-[length:var(--text-body-sm)] font-medium">Attachments (Metadata)</p>
                  <div className="mt-2 grid gap-2">
                    <Input placeholder="Label" value={attachmentLabel} onChange={(event) => setAttachmentLabel(event.target.value)} />
                    <Input placeholder="File name" value={attachmentFileName} onChange={(event) => setAttachmentFileName(event.target.value)} />
                    <Input placeholder="File URL" value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} />
                  </div>
                  <Button
                    className="mt-2"
                    size="sm"
                    disabled={isSaving || !attachmentLabel.trim() || !attachmentFileName.trim() || !attachmentUrl.trim()}
                    onClick={() => runAction({
                      applicationId: selected.id,
                      action: "add-attachment-metadata",
                      attachment: {
                        label: attachmentLabel,
                        fileName: attachmentFileName,
                        fileUrl: attachmentUrl,
                      },
                    })}
                  >
                    Add Attachment Metadata
                  </Button>
                  <ul className="mt-3 space-y-2 text-[length:var(--text-caption)]">
                    {selected.attachments.map((attachment) => (
                      <li key={attachment.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2">
                        <p>{attachment.label} · {attachment.fileName}</p>
                        <p className="text-[var(--color-muted-foreground)]">{attachment.fileUrl}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                  <p className="text-[length:var(--text-body-sm)] font-medium">Timeline</p>
                  <ul className="mt-2 space-y-2 text-[length:var(--text-caption)]">
                    {selected.timeline.map((event) => (
                      <li key={event.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2">
                        <p>{event.message}</p>
                        <p className="text-[var(--color-muted-foreground)]">{event.actorName ?? "System"} · {formatRelative(event.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                  <p className="text-[length:var(--text-body-sm)] font-medium">AI Insights</p>
                  <ul className="mt-2 space-y-2 text-[length:var(--text-caption)]">
                    {selected.aiInsights.entries.map((entry) => (
                      <li key={entry} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2">{entry}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                  <p className="text-[length:var(--text-body-sm)] font-medium">Audit History</p>
                  <ul className="mt-2 space-y-2 text-[length:var(--text-caption)]">
                    {selected.auditHistory.map((event) => (
                      <li key={event.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2">
                        <p>{event.action}</p>
                        <p className="text-[var(--color-muted-foreground)]">{event.source} · {event.actorType} · {formatRelative(event.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {error ? (
              <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card variant="glass" padding="md" className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle>Source Readiness</CardTitle>
          <CardDescription>Live and upcoming request source integrations for the unified queue.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {workspace.sourceReadiness.map((source) => (
              <article key={source.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/45 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[length:var(--text-body-sm)] font-medium">{source.label}</p>
                  <Badge variant={source.mode === "live" ? "success" : source.mode === "manual" ? "warning" : "outline"}>{source.mode}</Badge>
                </div>
                <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{source.detail}</p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
