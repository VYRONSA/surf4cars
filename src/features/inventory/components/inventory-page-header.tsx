import { Icon } from "@/components/ui/icons";
import { Sparkles } from "@/components/ui/icons/registry";
import { inventoryPolish } from "@/features/inventory/config/inventory-shared";

export function InventoryPageHeader() {
  return (
    <header className={`${inventoryPolish.glassCard} p-5 lg:p-6`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
            Smart Inventory Intelligence
          </p>
          <h1 className="mt-1 text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h2)]">
            Inventory Intelligence Centre
          </h1>
          <p className="mt-2 max-w-2xl text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)] lg:text-[length:var(--text-body-md)]">
            Know what&apos;s performing, what needs attention, and what to do today — powered by SURF Intelligence.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-secondary)]/25 bg-[var(--color-secondary-muted)] px-3.5 py-2">
          <Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />
          <span className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-secondary)]">
            Avg listing score: 82%
          </span>
        </div>
      </div>
    </header>
  );
}
