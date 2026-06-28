"use client";

import { useShell } from "@/components/shell/context";
import {
  COMMAND_PALETTE_ACTIONS,
  getShellIcon,
} from "@/components/shell/navigation";
import { Icon } from "@/components/ui/icons";
import { Search } from "@/components/ui/icons/registry";

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useShell();

  if (!commandPaletteOpen) return null;

  const groups = COMMAND_PALETTE_ACTIONS.reduce<
    Record<string, typeof COMMAND_PALETTE_ACTIONS[number][]>
  >((acc, action) => {
    const list = acc[action.group] ?? [];
    list.push(action);
    acc[action.group] = list;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center pt-[15vh]">
      <div
        className="glass-overlay absolute inset-0"
        onClick={() => setCommandPaletteOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="glass-dialog relative z-10 w-full max-w-xl overflow-hidden animate-slide-up-sfc"
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4">
          <Icon icon={Search} size="sm" tone="muted" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search…"
            className="h-12 flex-1 bg-transparent text-[length:var(--text-body-md)] outline-none placeholder:text-[var(--color-muted)]"
            aria-label="Command input"
          />
          <kbd className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-1.5 py-0.5 text-[length:var(--text-caption)]">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(groups).map(([group, actions]) => (
            <div key={group} className="mb-3 last:mb-0">
              <p className="px-3 py-1.5 text-[length:var(--text-caption)] font-medium uppercase tracking-[var(--tracking-overline)] text-[var(--color-muted-foreground)]">
                {group}
              </p>
              {actions.map((action) => {
                const ActionIcon = getShellIcon(action.icon);
                return (
                  <button
                    key={action.id}
                    type="button"
                    disabled
                    className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]"
                    aria-label={action.label}
                  >
                    <Icon icon={ActionIcon} size="sm" tone="muted" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
