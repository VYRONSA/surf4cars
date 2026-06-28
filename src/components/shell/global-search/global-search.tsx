"use client";

import { useShell } from "@/components/shell/context";
import { GLOBAL_SEARCH_SCOPES } from "@/components/shell/navigation";
import { Icon } from "@/components/ui/icons";
import { Search } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

export function GlobalSearchTrigger({ className }: { readonly className?: string }) {
  const { setGlobalSearchOpen } = useShell();

  return (
    <button
      type="button"
      onClick={() => setGlobalSearchOpen(true)}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-left text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] motion-hover hover:border-[var(--color-border-strong)]",
        className,
      )}
      aria-label="Open global search"
    >
      <Icon icon={Search} size="sm" tone="muted" />
      <span className="flex-1">Search vehicles, dealers, pages…</span>
      <kbd className="hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] px-1.5 py-0.5 text-[length:var(--text-caption)] sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}

export function GlobalSearchDialog() {
  const { globalSearchOpen, setGlobalSearchOpen } = useShell();

  if (!globalSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh]">
      <div
        className="glass-overlay absolute inset-0"
        onClick={() => setGlobalSearchOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        className="glass-dialog relative z-10 w-full max-w-2xl overflow-hidden animate-slide-up-sfc"
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4">
          <Icon icon={Search} size="sm" tone="muted" />
          <input
            autoFocus
            type="search"
            placeholder="Search vehicles, dealers, buyers, pages, commands, AI…"
            className="h-12 flex-1 bg-transparent text-[length:var(--text-body-md)] outline-none placeholder:text-[var(--color-muted)]"
            aria-label="Search query"
          />
        </div>
        <div className="p-4">
          <p className="mb-3 text-[length:var(--text-caption)] font-medium uppercase tracking-[var(--tracking-overline)] text-[var(--color-muted-foreground)]">
            Future scopes
          </p>
          <div className="flex flex-wrap gap-2">
            {GLOBAL_SEARCH_SCOPES.map((scope) => (
              <span
                key={scope}
                className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1 text-[length:var(--text-caption)] capitalize text-[var(--color-muted-foreground)]"
              >
                {scope}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Search is not connected yet. This framework is ready for data integration.
          </p>
        </div>
      </div>
    </div>
  );
}
