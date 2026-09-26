import * as React from "react";
import { useState } from "react";
import {
  IconHistory,
  IconPlayerPlay,
  IconCheck,
  IconWorld,
  IconClick,
  IconKeyboard,
} from "@tabler/icons-react";

export type TimelineStep = {
  id: string;
  stepNumber: number;
  action: "navigate" | "click" | "type" | "download" | "assertion";
  target: string;
  timestamp: string;
  screenshotUrl?: string;
  status: "success" | "pending" | "failed";
};

export function BrowserActionTimeline({
  steps,
  onSelectStep,
}: {
  steps: TimelineStep[];
  onSelectStep?: (step: TimelineStep) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    steps[steps.length - 1]?.id ?? null,
  );

  const getActionIcon = (action: TimelineStep["action"]) => {
    switch (action) {
      case "navigate":
        return <IconWorld className="size-3.5 text-blue-400" />;
      case "click":
        return <IconClick className="size-3.5 text-purple-400" />;
      case "type":
        return <IconKeyboard className="size-3.5 text-amber-400" />;
      default:
        return <IconCheck className="size-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-card/60 rounded-xl border border-border select-text">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <IconHistory className="size-4 text-primary" />
          <span>Browser Action Timeline</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {steps.length} steps recorded
        </span>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        {steps.map((step) => {
          const isSelected = selectedId === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setSelectedId(step.id);
                onSelectStep?.(step);
              }}
              className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors border ${
                isSelected
                  ? "bg-primary/10 border-primary/30 text-foreground"
                  : "bg-background/40 hover:bg-background/80 border-transparent text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px]">
                  {step.stepNumber}
                </span>
                {getActionIcon(step.action)}
                <span className="truncate font-medium text-foreground">
                  {step.target}
                </span>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
                {step.timestamp}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
