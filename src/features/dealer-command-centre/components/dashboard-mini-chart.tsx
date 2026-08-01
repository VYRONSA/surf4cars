import type { DashboardChartSeries } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

export interface DashboardMiniChartProps {
  readonly series: DashboardChartSeries;
  readonly variant?: "line" | "bar";
  readonly className?: string;
}

export function DashboardMiniChart({ series, variant = "line", className }: DashboardMiniChartProps) {
  const values = [...series.values];
  if (values.length === 0) {
    return (
      <div className={cn("flex size-full items-center justify-center text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]", className)}>
        {series.message ?? "No live data available yet."}
      </div>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("size-full", className)}
      role="img"
      aria-label={`${series.label} chart`}
    >
      {variant === "bar" ? (
        values.map((value, index) => {
          const width = 100 / values.length - 2;
          const height = ((value - min) / range) * 100;
          const x = (index / values.length) * 100 + 1;
          return (
            <rect
              key={index}
              x={x}
              y={100 - height}
              width={width}
              height={height}
              rx="2"
              className="fill-[var(--color-primary)]/70"
            />
          );
        })
      ) : (
        <>
          <polyline
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            points={points.join(" ")}
          />
          <polygon
            fill="url(#chartGradient)"
            points={`0,100 ${points.join(" ")} 100,100`}
          />
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </>
      )}
    </svg>
  );
}
