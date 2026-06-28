import type { ReactNode } from "react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Progress } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Bot, Brain, Cpu, Lightbulb, Loader2, Sparkles } from "@/components/ui/icons/registry";
import { type DivProps } from "@/components/ui/shared";
import { cn } from "@/utils";

export interface AiInsightCardProps extends DivProps {
  readonly title: ReactNode;
  readonly insight: ReactNode;
  readonly confidence?: number;
  readonly footer?: ReactNode;
}

export function AiInsightCard({
  title,
  insight,
  confidence,
  footer,
  className,
  ...props
}: AiInsightCardProps) {
  return (
    <Card variant="glass" className={cn("border-[var(--color-primary)]/10", className)} {...props}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon icon={Brain} size="sm" tone="primary" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[length:var(--text-body-md)] leading-[var(--leading-relaxed)]">
          {insight}
        </p>
        {confidence != null && <AiConfidence value={confidence} className="mt-4" />}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

export interface AiRecommendationProps extends DivProps {
  readonly title: ReactNode;
  readonly recommendation: ReactNode;
  readonly priority?: "low" | "medium" | "high";
  readonly actions?: ReactNode;
}

export function AiRecommendation({
  title,
  recommendation,
  priority,
  actions,
  className,
  ...props
}: AiRecommendationProps) {
  const priorityVariant =
    priority === "high" ? "danger" : priority === "medium" ? "warning" : "info";

  return (
    <Card interactive className={className} {...props}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon icon={Lightbulb} size="sm" tone="accent" />
            <CardTitle>{title}</CardTitle>
          </div>
          {priority && <Badge variant={priorityVariant}>{priority}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {recommendation}
        </p>
      </CardContent>
      {actions && <CardFooter>{actions}</CardFooter>}
    </Card>
  );
}

export interface AiSuggestionProps extends DivProps {
  readonly suggestions: readonly ReactNode[];
  readonly onSelect?: (index: number) => void;
}

export function AiSuggestion({
  suggestions,
  onSelect,
  className,
  ...props
}: AiSuggestionProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} {...props}>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect?.(index)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-[length:var(--text-body-sm)] motion-button hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
        >
          <Icon icon={Sparkles} size="xs" tone="primary" />
          {suggestion}
        </button>
      ))}
    </div>
  );
}

export interface AiStatusProps extends DivProps {
  readonly status: "idle" | "processing" | "complete" | "error";
  readonly label?: ReactNode;
}

export function AiStatus({ status, label, className, ...props }: AiStatusProps) {
  const config = {
    idle: { icon: Bot, tone: "muted" as const, text: label ?? "Ready" },
    processing: { icon: Loader2, tone: "primary" as const, text: label ?? "Processing" },
    complete: { icon: Sparkles, tone: "success" as const, text: label ?? "Complete" },
    error: { icon: Cpu, tone: "danger" as const, text: label ?? "Error" },
  }[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)] px-3 py-1.5 text-[length:var(--text-body-sm)]",
        className,
      )}
      {...props}
    >
      <Icon
        icon={config.icon}
        size="sm"
        tone={config.tone}
        className={status === "processing" ? "animate-spin-sfc" : undefined}
      />
      {config.text}
    </div>
  );
}

export interface AiConfidenceProps extends DivProps {
  readonly value: number;
  readonly label?: string;
}

export function AiConfidence({
  value,
  label = "Confidence",
  className,
  ...props
}: AiConfidenceProps) {
  return (
    <div className={cn("", className)} {...props}>
      <Progress value={value} max={100} label={label} />
    </div>
  );
}

export interface AiProcessingProps extends DivProps {
  readonly label?: ReactNode;
  readonly progress?: number;
}

export function AiProcessing({
  label = "Analysing…",
  progress,
  className,
  ...props
}: AiProcessingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-8 text-center",
        className,
      )}
      {...props}
    >
      <Icon icon={Loader2} size="lg" tone="primary" className="animate-spin-sfc" />
      <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      {progress != null && <Progress value={progress} className="w-full max-w-xs" />}
    </div>
  );
}

export interface AiSummaryProps extends DivProps {
  readonly title: ReactNode;
  readonly summary: ReactNode;
  readonly highlights?: readonly ReactNode[];
}

export function AiSummary({
  title,
  summary,
  highlights,
  className,
  ...props
}: AiSummaryProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon icon={Sparkles} size="sm" tone="primary" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[length:var(--text-body-md)] leading-[var(--leading-relaxed)]">
          {summary}
        </p>
        {highlights && highlights.length > 0 && (
          <ul className="space-y-2">
            {highlights.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-primary)]" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
