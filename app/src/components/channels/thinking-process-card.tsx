import * as React from "react";
import { useState } from "react";
import { IconBrain, IconChevronDown, IconChevronRight } from "@tabler/icons-react";

export function ThinkingProcessCard({ thought }: { thought: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-2 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs overflow-hidden select-text">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-purple-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
            <IconBrain className="size-3.5" />
          </div>
          <span className="font-semibold text-purple-400 uppercase tracking-wider text-[11px]">
            Thought Process
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            (deliberation active)
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-[10px]">{expanded ? "Collapse" : "Expand"}</span>
          {expanded ? (
            <IconChevronDown className="size-3.5" />
          ) : (
            <IconChevronRight className="size-3.5" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 py-2.5 border-t border-purple-500/15 font-mono text-[11px] text-muted-foreground/90 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-background/50">
          {thought.trim()}
        </div>
      )}
    </div>
  );
}
