import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { ArrowRight, Sparkles } from "@/components/ui/icons/registry";

interface OperationsComingSoonPanelProps {
  readonly title: string;
  readonly description: string;
}

export function OperationsComingSoonPanel({ title, description }: OperationsComingSoonPanelProps) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[radial-gradient(circle_at_top_right,rgba(0,112,255,0.14),transparent_45%),linear-gradient(180deg,var(--color-surface-raised),var(--color-background))] p-4 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(0,112,255,0.20),rgba(0,112,255,0))]" />
      <Card variant="glass" padding="lg" className="relative border-[var(--color-border-subtle)]">
        <CardHeader>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-primary-muted)] text-[var(--color-primary-text)]">
            <Icon icon={Sparkles} size="md" />
          </div>
          <CardTitle className="text-[length:var(--text-h3)]">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-[length:var(--text-body-md)]">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Link
            href="/operations/dashboard"
            className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-4 py-2 text-[length:var(--text-body-sm)] font-semibold text-[var(--color-primary-foreground)] motion-button hover:bg-[var(--color-primary-hover)]"
          >
            Return to Dashboard
            <Icon icon={ArrowRight} size="xs" />
          </Link>
          <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
            Route, permissions, shell, and audit pipeline are already connected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
