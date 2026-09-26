import * as React from "react";
import { useMemo } from "react";

export type ChartData = {
  type: "bar" | "line" | "pie";
  title?: string;
  data: Array<{ label: string; value: number; color?: string }>;
};

const DEFAULT_COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#06b6d4"];

export function VisualChartCard({ chart }: { chart: ChartData }) {
  const maxVal = useMemo(
    () => Math.max(...chart.data.map((d) => d.value), 1),
    [chart.data],
  );

  return (
    <div className="my-3 p-4 rounded-xl border border-border bg-card/60 shadow-sm flex flex-col gap-3">
      {chart.title && (
        <div className="text-xs font-semibold text-foreground tracking-wide flex items-center justify-between">
          <span>{chart.title}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-mono px-1.5 py-0.5 rounded bg-muted">
            {chart.type} chart
          </span>
        </div>
      )}

      {chart.type === "bar" && (
        <div className="flex flex-col gap-2 pt-1">
          {chart.data.map((item, idx) => {
            const pct = Math.round((item.value / maxVal) * 100);
            const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            return (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-foreground font-medium">
                  <span>{item.label}</span>
                  <span className="font-mono text-muted-foreground">{item.value.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {chart.type === "pie" && (
        <div className="flex flex-col gap-2 pt-1">
          <div className="h-4 w-full flex rounded-full overflow-hidden gap-0.5">
            {chart.data.map((item, idx) => {
              const total = chart.data.reduce((acc, d) => acc + d.value, 0) || 1;
              const pct = (item.value / total) * 100;
              const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
              return (
                <div
                  key={item.label}
                  style={{ width: `${pct}%`, backgroundColor: color }}
                  title={`${item.label}: ${item.value}`}
                  className="h-full"
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            {chart.data.map((item, idx) => {
              const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
              return (
                <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-foreground">{item.label}:</span>
                  <span className="font-mono">{item.value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
